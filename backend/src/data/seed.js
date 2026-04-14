const env = require("../config/env");
const { connectDb, disconnectDb } = require("../config/db");
const User = require("../models/User");
const Employee = require("../models/Employee");
const { getOfficeSettings } = require("../services/officeSettingsService");

async function ensureLinkedUser({
  name,
  email,
  password,
  role,
  employeeId,
  department,
  designation,
  monthlySalary,
}) {
  let user = await User.findOne({ email });
  if (user) {
    return user;
  }

  const employee = await Employee.create({
    employeeId,
    department,
    designation,
    joiningDate: new Date(),
    monthlySalary,
    leaveBalance: 18,
  });

  user = await User.create({
    name,
    email,
    password,
    role,
    employee: employee._id,
  });

  employee.user = user._id;
  await employee.save();
  return user;
}

async function ensureSeedData() {
  await getOfficeSettings();

  const existingAdmin = await User.findOne({ email: env.defaultAdminEmail });
  if (!existingAdmin) {
    await User.create({
      name: env.defaultAdminName,
      email: env.defaultAdminEmail,
      password: env.defaultAdminPassword,
      role: "admin",
      isActive: true,
    });
  }

  await ensureLinkedUser({
    name: "HR Manager",
    email: "hr@attendify.com",
    password: "Hr123456!",
    role: "hr",
    employeeId: "ATD-HR-001",
    department: "Human Resources",
    designation: "HR Lead",
    monthlySalary: 60000,
  });

  await ensureLinkedUser({
    name: "Team Manager",
    email: "manager@attendify.com",
    password: "Manager123!",
    role: "manager",
    employeeId: "ATD-MG-001",
    department: "Operations",
    designation: "Operations Manager",
    monthlySalary: 70000,
  });

  await ensureLinkedUser({
    name: "Demo Employee",
    email: "employee@attendify.com",
    password: "Employee123!",
    role: "employee",
    employeeId: "ATD-EMP-001",
    department: "Engineering",
    designation: "Software Engineer",
    monthlySalary: 50000,
  });
}

async function run() {
  await connectDb();
  await ensureSeedData();
  console.log("Attendify seed completed.");
  await disconnectDb();
}

if (require.main === module) {
  run().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  ensureSeedData,
};
