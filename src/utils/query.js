const { ObjectId } = require("mongodb");
function objectId(value){ return ObjectId.isValid(value) ? new ObjectId(value) : null; }
function escapeRegex(value=""){ return String(value).replace(/[.*+?^${}()|[\]\\]/g,"\\$&"); }
function serialize(doc){
  if(!doc) return doc;
  if(Array.isArray(doc)) return doc.map(serialize);
  const out = { ...doc };
  if(out._id?.toString) out._id = out._id.toString();
  if(out.tutorId?.toString) out.tutorId = out.tutorId.toString();
  return out;
}
module.exports = { objectId, escapeRegex, serialize };
