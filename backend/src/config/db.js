const mongoose = require("mongoose");
const env = require("./env");

async function connectDb(uri = env.mongoUri) {
  if (!uri) {
    throw new Error("MONGO_URI is not configured.");
  }

  await mongoose.connect(uri);
}

async function disconnectDb() {
  await mongoose.disconnect();
}

module.exports = {
  connectDb,
  disconnectDb,
};
