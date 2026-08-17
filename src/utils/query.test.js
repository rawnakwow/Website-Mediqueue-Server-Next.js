const test = require("node:test");
const assert = require("node:assert/strict");
const { ObjectId } = require("mongodb");
const { escapeRegex, objectId, serialize } = require("./query");

test("escapeRegex treats user search text literally", () => {
  const value = "Ayesha (Math).*";
  const expression = new RegExp(escapeRegex(value), "i");
  assert.equal(expression.test(value), true);
  assert.equal(expression.test("Ayesha Math plus anything"), false);
});

test("objectId rejects malformed identifiers", () => {
  assert.equal(objectId("not-an-object-id"), null);
  assert.equal(objectId("507f1f77bcf86cd799439011") instanceof ObjectId, true);
});

test("serialize converts MongoDB identifiers without mutating the source", () => {
  const source = { _id: new ObjectId("507f1f77bcf86cd799439011"), tutorId: new ObjectId("507f191e810c19729de860ea") };
  const output = serialize(source);
  assert.equal(output._id, "507f1f77bcf86cd799439011");
  assert.equal(output.tutorId, "507f191e810c19729de860ea");
  assert.equal(source._id instanceof ObjectId, true);
});
