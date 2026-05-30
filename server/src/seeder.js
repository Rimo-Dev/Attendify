const mongoose = require("mongoose");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const User = require("./models/User");

dotenv.config();
connectDB();

const importData = async () => {
  try {
    await User.deleteMany();

    const adminUser = {
      name: "Admin User",
      email: "admin@example.com",
      password: "password123",
      role: "Admin",
      baseSalary: 50000,
      department: "Management",
      designation: "System Administrator",
    };

    await User.create(adminUser);

    console.log("Data Imported!");
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

importData();
