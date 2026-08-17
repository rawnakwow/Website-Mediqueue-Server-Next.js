const express = require("express");
const { db } = require("../config/db");
const { verifyToken } = require("../middleware/auth");
const { objectId, escapeRegex, serialize } = require("../utils/query");

const router = express.Router();

// This follows the same simple collection pattern as the supplied CRUD sample.
const tutorCollection = () => db().collection("tutors");

function makeTutorData(data) {
  return {
    tutorName: String(data.tutorName || "").trim(),
    photo: String(data.photo || "").trim(),
    subject: String(data.subject || "").trim(),
    availableDays: String(data.availableDays || "").trim(),
    availableTimeSlot: String(data.availableTimeSlot || "").trim(),
    hourlyFee: Number(data.hourlyFee),
    totalSlot: Number(data.totalSlot),
    sessionStartDate: new Date(data.sessionStartDate),
    institutionExperience: String(
      data.institutionExperience || ""
    ).trim(),
    location: String(data.location || "").trim(),
    teachingMode: String(data.teachingMode || "").trim(),
  };
}

function validateTutor(tutor) {
  const requiredTextFields = [
    tutor.tutorName,
    tutor.photo,
    tutor.subject,
    tutor.availableDays,
    tutor.availableTimeSlot,
    tutor.institutionExperience,
    tutor.location,
    tutor.teachingMode,
  ];

  if (requiredTextFields.some((field) => !field)) {
    return "Please complete every required tutor field";
  }

  if (!Number.isFinite(tutor.hourlyFee) || tutor.hourlyFee <= 0) {
    return "Hourly fee must be greater than zero";
  }

  if (!Number.isInteger(tutor.totalSlot) || tutor.totalSlot < 0) {
    return "Total slot must be a non-negative whole number";
  }

  if (Number.isNaN(tutor.sessionStartDate.getTime())) {
    return "Session start date is invalid";
  }

  return null;
}

// Get exactly six tutors for the home page.
router.get("/featured", async (request, response) => {
  const tutors = await tutorCollection()
    .find({})
    .sort({ createdAt: -1 })
    .limit(6)
    .toArray();

  response.send(tutors.map(serialize));
});

// Get tutor profiles created by the logged-in user.
router.get("/mine", verifyToken, async (request, response) => {
  const query = {
    creatorEmail: request.user.email,
  };

  const tutors = await tutorCollection()
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  response.send(tutors.map(serialize));
});

// Get all tutors with optional name, subject, and date filters.
router.get("/", async (request, response) => {
  const query = {};

  if (request.query.name) {
    query.tutorName = {
      $regex: escapeRegex(request.query.name),
      $options: "i",
    };
  }

  if (request.query.subject) {
    query.subject = {
      $regex: `^${escapeRegex(request.query.subject)}$`,
      $options: "i",
    };
  }

  if (request.query.startDate || request.query.endDate) {
    query.createdAt = {};

    if (request.query.startDate) {
      const startDate = new Date(
        `${request.query.startDate}T00:00:00.000Z`
      );

      if (!Number.isNaN(startDate.getTime())) {
        query.createdAt.$gte = startDate;
      }
    }

    if (request.query.endDate) {
      const endDate = new Date(`${request.query.endDate}T23:59:59.999Z`);

      if (!Number.isNaN(endDate.getTime())) {
        query.createdAt.$lte = endDate;
      }
    }

    if (!Object.keys(query.createdAt).length) {
      delete query.createdAt;
    }
  }

  const tutors = await tutorCollection()
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  response.send(tutors.map(serialize));
});

// Get one tutor using its MongoDB ObjectId.
router.get("/:id", async (request, response) => {
  const tutorId = objectId(request.params.id);

  if (!tutorId) {
    return response.status(400).send({ message: "Invalid tutor id" });
  }

  const query = { _id: tutorId };
  const tutor = await tutorCollection().findOne(query);

  if (!tutor) {
    return response.status(404).send({ message: "Tutor not found" });
  }

  response.send(serialize(tutor));
});

// Add a tutor. The creator fields come from the verified JWT.
router.post("/", verifyToken, async (request, response) => {
  const newTutor = makeTutorData(request.body);
  const validationError = validateTutor(newTutor);

  if (validationError) {
    return response.status(400).send({ message: validationError });
  }

  Object.assign(newTutor, {
    creatorId: request.user.id,
    creatorEmail: request.user.email,
    creatorName: request.user.name,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const result = await tutorCollection().insertOne(newTutor);

  response.status(201).send({
    ...serialize(newTutor),
    _id: result.insertedId.toString(),
  });
});

// Update only a tutor created by the logged-in user.
router.patch("/:id", verifyToken, async (request, response) => {
  const tutorId = objectId(request.params.id);

  if (!tutorId) {
    return response.status(400).send({ message: "Invalid tutor id" });
  }

  const ownerQuery = {
    _id: tutorId,
    creatorEmail: request.user.email,
  };

  const currentTutor = await tutorCollection().findOne(ownerQuery);

  if (!currentTutor) {
    return response.status(404).send({
      message: "Tutor not found or not owned by you",
    });
  }

  const updatedTutor = makeTutorData({
    ...currentTutor,
    ...request.body,
  });
  const validationError = validateTutor(updatedTutor);

  if (validationError) {
    return response.status(400).send({ message: validationError });
  }

  const updatedDocument = {
    $set: {
      ...updatedTutor,
      updatedAt: new Date(),
    },
  };

  await tutorCollection().updateOne(ownerQuery, updatedDocument);

  const savedTutor = await tutorCollection().findOne({ _id: tutorId });
  response.send(serialize(savedTutor));
});

// Delete only a tutor created by the logged-in user.
router.delete("/:id", verifyToken, async (request, response) => {
  const tutorId = objectId(request.params.id);

  if (!tutorId) {
    return response.status(400).send({ message: "Invalid tutor id" });
  }

  const query = {
    _id: tutorId,
    creatorEmail: request.user.email,
  };

  const result = await tutorCollection().deleteOne(query);

  if (!result.deletedCount) {
    return response.status(404).send({
      message: "Tutor not found or not owned by you",
    });
  }

  response.send({ message: "Tutor deleted successfully" });
});

module.exports = router;
