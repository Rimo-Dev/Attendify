process.env.JWT_SECRET = "test-secret";
process.env.JWT_EXPIRES_IN = "7d";
process.env.CLIENT_URL = "http://localhost:5173";
process.env.NODE_ENV = "test";

jest.mock("../src/services/emailService", () => ({
  sendLateArrivalEmail: jest.fn().mockResolvedValue({ status: "failed", errorMessage: "SMTP unavailable" }),
}));

const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const { connectDb, disconnectDb } = require("../src/config/db");
const { ensureSeedData } = require("../src/data/seed");
const NotificationLog = require("../src/models/NotificationLog");
const Employee = require("../src/models/Employee");
const OfficeSettings = require("../src/models/OfficeSettings");

let mongoServer;
let employeeToken;
let hrToken;
let adminToken;

async function login(email, password) {
  const response = await request(app).post("/api/auth/login").send({ email, password });
  return response.body.data.token;
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await connectDb(mongoServer.getUri());
  await ensureSeedData();

  employeeToken = await login("employee@attendify.com", "Employee123!");
  hrToken = await login("hr@attendify.com", "Hr123456!");
  adminToken = await login("admin@attendify.com", "Admin123!");
});

afterAll(async () => {
  await disconnectDb();
  await mongoServer.stop();
  await mongoose.connection.close();
});

test("rejects invalid login", async () => {
  const response = await request(app).post("/api/auth/login").send({
    email: "employee@attendify.com",
    password: "wrong-pass",
  });

  expect(response.statusCode).toBe(401);
});

test("prevents duplicate attendance and keeps late notification failure non-blocking", async () => {
  await OfficeSettings.updateOne({ key: "default" }, { startTime: "00:00", gracePeriodMinutes: 0, latePenaltyPerMinute: 2 });

  const first = await request(app).post("/api/attendance/check-in").set("Authorization", `Bearer ${employeeToken}`);
  const second = await request(app).post("/api/attendance/check-in").set("Authorization", `Bearer ${employeeToken}`);

  expect(first.statusCode).toBe(201);
  expect(first.body.data.lateMinutes).toBeGreaterThan(0);
  expect(second.statusCode).toBe(409);
  expect(await NotificationLog.countDocuments({ category: "late-arrival" })).toBe(1);
});

test("rejects check-out without a prior check-in for a fresh employee", async () => {
  const createResponse = await request(app)
    .post("/api/employees")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      name: "New Employee",
      email: "new.employee@attendify.com",
      password: "NewEmployee123!",
      role: "employee",
      employeeId: "ATD-EMP-002",
      department: "Support",
      designation: "Support Engineer",
      joiningDate: "2025-01-10",
      monthlySalary: 30000,
    });

  expect(createResponse.statusCode).toBe(201);

  const loginToken = await login("new.employee@attendify.com", "NewEmployee123!");
  const response = await request(app).post("/api/attendance/check-out").set("Authorization", `Bearer ${loginToken}`);
  expect(response.statusCode).toBe(400);
});

test("supports leave approval and excludes approved leave from absence count", async () => {
  const leaveResponse = await request(app)
    .post("/api/leaves")
    .set("Authorization", `Bearer ${employeeToken}`)
    .send({
      leaveType: "annual",
      startDate: "2026-04-15",
      endDate: "2026-04-16",
      reason: "Family event",
    });

  expect(leaveResponse.statusCode).toBe(201);

  const approvalResponse = await request(app)
    .patch(`/api/leaves/${leaveResponse.body.data._id}/approve`)
    .set("Authorization", `Bearer ${hrToken}`)
    .send({ decisionNote: "Approved" });

  expect(approvalResponse.statusCode).toBe(200);

  const salaryResponse = await request(app).get("/api/salary/me?month=2026-04").set("Authorization", `Bearer ${employeeToken}`);
  expect(salaryResponse.statusCode).toBe(200);
  expect(salaryResponse.body.data.approvedLeaveDays).toBeGreaterThanOrEqual(2);
});

test("provides admin dashboard and CSV reports", async () => {
  const dashboardResponse = await request(app).get("/api/dashboard/admin").set("Authorization", `Bearer ${adminToken}`);
  expect(dashboardResponse.statusCode).toBe(200);
  expect(dashboardResponse.body.data).toHaveProperty("totalEmployees");

  const reportResponse = await request(app)
    .get("/api/reports/attendance?download=csv")
    .set("Authorization", `Bearer ${hrToken}`);

  expect(reportResponse.statusCode).toBe(200);
  expect(reportResponse.headers["content-type"]).toContain("text/csv");
});

test("allows admin employee CRUD and status update", async () => {
  const createResponse = await request(app)
    .post("/api/employees")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      name: "Inactive Employee",
      email: "inactive@attendify.com",
      password: "Inactive123!",
      role: "employee",
      employeeId: "ATD-EMP-003",
      department: "Finance",
      designation: "Analyst",
      joiningDate: "2025-03-01",
      monthlySalary: 45000,
    });

  expect(createResponse.statusCode).toBe(201);

  const employee = await Employee.findOne({ employeeId: "ATD-EMP-003" });
  const statusResponse = await request(app)
    .patch(`/api/employees/${employee._id}/status`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ isActive: false });

  expect(statusResponse.statusCode).toBe(200);
  expect(statusResponse.body.data.isActive).toBe(false);
});
