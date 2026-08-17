const express = require("express");
const crypto = require("crypto");
const { db } = require("../config/db");
const { verifyToken } = require("../middleware/auth");
const { objectId, serialize } = require("../utils/query");

const router = express.Router();

// Every booking route is private.
router.use(verifyToken);

const tutorCollection = () => db().collection("tutors");
const bookingCollection = () => db().collection("bookings");

function makeSessionToken() {
  const timePart = Date.now().toString(36).toUpperCase();
  const randomPart = crypto.randomBytes(2).toString("hex").toUpperCase();

  return `MQ-${timePart}-${randomPart}`;
}

// Create a new booking.
router.post("/", async (request, response) => {
  const tutorId = objectId(request.body.tutorId);

  if (!tutorId) {
    return response.status(400).send({ message: "Invalid tutor id" });
  }

  const tutor = await tutorCollection().findOne({ _id: tutorId });

  if (!tutor) {
    return response.status(404).send({ message: "Tutor not found" });
  }

  if (Number(tutor.totalSlot) <= 0) {
    return response.status(409).send({
      message: "No available slots left.",
    });
  }

  if (new Date() < new Date(tutor.sessionStartDate)) {
    return response.status(409).send({
      message: "Booking is not available yet for this tutor",
    });
  }

  const studentName = String(
    request.body.studentName || request.user.name || ""
  ).trim();
  const phone = String(request.body.phone || "").trim();

  if (!studentName || !phone) {
    return response.status(400).send({
      message: "Student name and phone are required",
    });
  }

  if (!/^[+0-9][0-9\s-]{6,19}$/.test(phone)) {
    return response.status(400).send({
      message: "Enter a valid phone number",
    });
  }

  // The conditional update prevents two students taking the final slot.
  const tutorQuery = {
    _id: tutorId,
    totalSlot: { $gt: 0 },
    sessionStartDate: { $lte: new Date() },
  };
  const slotUpdate = {
    $inc: { totalSlot: -1 },
    $set: { updatedAt: new Date() },
  };

  const slotResult = await tutorCollection().updateOne(
    tutorQuery,
    slotUpdate
  );

  if (!slotResult.modifiedCount) {
    return response.status(409).send({
      message: "This session is fully booked. You cannot join right now.",
    });
  }

  const newBooking = {
    tutorId,
    tutorName: tutor.tutorName,
    subject: tutor.subject,
    studentName,
    phone,
    studentId: request.user.id,
    studentEmail: request.user.email,
    status: "booked",
    sessionToken: makeSessionToken(),
    sessionStartDate: tutor.sessionStartDate,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    const result = await bookingCollection().insertOne(newBooking);

    response.status(201).send({
      ...serialize(newBooking),
      _id: result.insertedId.toString(),
    });
  } catch (error) {
    // Return the slot if the booking document could not be created.
    await tutorCollection().updateOne(
      { _id: tutorId },
      { $inc: { totalSlot: 1 } }
    );

    throw error;
  }
});

// Get only the logged-in student's bookings.
router.get("/mine", async (request, response) => {
  const query = {
    studentEmail: request.user.email,
  };

  const bookings = await bookingCollection()
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();

  response.send(bookings.map(serialize));
});

// Cancel one booking and restore exactly one tutor slot.
router.patch("/:id/cancel", async (request, response) => {
  const bookingId = objectId(request.params.id);

  if (!bookingId) {
    return response.status(400).send({ message: "Invalid booking id" });
  }

  const ownerQuery = {
    _id: bookingId,
    studentEmail: request.user.email,
  };

  const booking = await bookingCollection().findOne(ownerQuery);

  if (!booking) {
    return response.status(404).send({ message: "Booking not found" });
  }

  if (booking.status === "cancelled") {
    return response.send(serialize(booking));
  }

  if (booking.status !== "booked") {
    return response.status(409).send({
      message: "Only active bookings can be cancelled",
    });
  }

  const activeBookingQuery = {
    ...ownerQuery,
    status: "booked",
  };
  const cancelledDocument = {
    $set: {
      status: "cancelled",
      updatedAt: new Date(),
    },
  };

  const cancelResult = await bookingCollection().updateOne(
    activeBookingQuery,
    cancelledDocument
  );

  if (cancelResult.modifiedCount) {
    await tutorCollection().updateOne(
      { _id: booking.tutorId },
      {
        $inc: { totalSlot: 1 },
        $set: { updatedAt: new Date() },
      }
    );
  }

  const cancelledBooking = await bookingCollection().findOne({
    _id: bookingId,
  });

  response.send(serialize(cancelledBooking));
});

module.exports = router;
