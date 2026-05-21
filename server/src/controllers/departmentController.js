const Department = require("../models/Department");
const mongoose = require("mongoose");

// @desc Get all departments
// @route GET /api/departments
// @access Private (Admin, HR)
const getDepartments = async (req, res) => {
  try {
    // Aggregate departments and include a count of users assigned to each department
    const depts = await Department.aggregate([
      { $sort: { name: 1 } },
      {
        $lookup: {
          from: "users",
          let: { deptName: "$name" },
          pipeline: [
            { $match: { $expr: { $eq: ["$department", "$$deptName"] } } },
            { $count: "count" },
          ],
          as: "employeeCount",
        },
      },
      {
        $addFields: {
          employeeCount: {
            $ifNull: [{ $arrayElemAt: ["$employeeCount.count", 0] }, 0],
          },
        },
      },
    ]);

    res.json(depts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create department
// @route POST /api/departments
// @access Private/Admin
const createDepartment = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: "Name is required" });
    const exists = await Department.findOne({ name });
    if (exists)
      return res.status(400).json({ message: "Department already exists" });
    const dept = await Department.create({ name, description });
    res.status(201).json(dept);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update department
// @route PUT /api/departments/:id
// @access Private/Admin
const updateDepartment = async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ message: "Department not found" });
    const { name, description } = req.body;
    if (name) {
      const exists = await Department.findOne({ name, _id: { $ne: dept._id } });
      if (exists)
        return res
          .status(400)
          .json({ message: "Another department with that name exists" });
      dept.name = name;
    }
    if (description !== undefined) dept.description = description;
    await dept.save();
    res.json(dept);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete department
// @route DELETE /api/departments/:id
// @access Private/Admin
const deleteDepartment = async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ message: "Department not found" });
    await Department.deleteOne({ _id: dept._id });
    res.json({ message: "Department removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
