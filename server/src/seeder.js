const mongoose = require("mongoose");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const User = require("./models/User");
const Holiday = require("./models/Holiday");

dotenv.config();
connectDB();

const importData = async () => {
  try {
    await User.deleteMany();
    await Holiday.deleteMany();

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

    const holidaySeed = process.env.COMPANY_HOLIDAYS_JSON
      ? JSON.parse(process.env.COMPANY_HOLIDAYS_JSON)
      : [];

    if (Array.isArray(holidaySeed) && holidaySeed.length > 0) {
      await Holiday.insertMany(
        holidaySeed
          .filter((holiday) => holiday && holiday.date && holiday.name)
          .map((holiday) => ({
            name: holiday.name,
            date: new Date(holiday.date),
            description: holiday.description || "",
          })),
      );
    }

    console.log("Data Imported!");
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

importData();
