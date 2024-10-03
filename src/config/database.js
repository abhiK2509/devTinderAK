const mongoose = require("mongoose");
const { MONGO_URI, DB_NAME } = require("../constants");

const connectDB = async () => {
  await mongoose.connect(MONGO_URI + DB_NAME);
};

module.exports = connectDB;
