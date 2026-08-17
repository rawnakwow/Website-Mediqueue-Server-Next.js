const { MongoClient } = require("mongodb");
let client;
let database;
let connectionPromise;

async function connectDB(){
  if(database) return database;
  if(connectionPromise) return connectionPromise;

  connectionPromise = (async()=>{
    const uri = process.env.MONGODB_URI;
    if(!uri) throw new Error("MONGODB_URI is not configured");
    client = new MongoClient(uri, { maxPoolSize: 10 });
    await client.connect();
    database = client.db(process.env.DB_NAME || "mediqueue");
    await Promise.all([
      database.collection("tutors").createIndex({ tutorName: 1, createdAt: -1 }),
      database.collection("tutors").createIndex({ subject: 1, createdAt: -1 }),
      database.collection("tutors").createIndex({ creatorEmail: 1, createdAt: -1 }),
      database.collection("bookings").createIndex({ studentEmail: 1, createdAt: -1 }),
      database.collection("bookings").createIndex({ sessionToken: 1 }, { unique: true }),
    ]);
    return database;
  })();

  try {
    return await connectionPromise;
  } catch (error) {
    connectionPromise = null;
    throw error;
  }
}
function db(){ if(!database) throw new Error("Database has not been initialized"); return database; }
module.exports = { connectDB, db };
