import { format } from "date-fns";
import { Edit2, FileText, Plus, Trash2, TrendingUp, X } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import api from "../services/api";

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [originalJoiningDate, setOriginalJoiningDate] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Employee",
    baseSalary: 0,
    shiftStartTime: "09:00",
    shiftEndTime: "17:00",
    department: "",
    joiningDate: format(new Date(), "yyyy-MM-dd"),
  });
  const [performanceData, setPerformanceData] = useState(null);
  const [loadingPerformance, setLoadingPerformance] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const existingDepartments = Array.from(
    new Set(employees.map((emp) => emp.department).filter((d) => d)),
  );
  const standardDepartments = [
    "IT",
    "HR",
    "Sales",
    "Marketing",
    "Finance",
    "Operations",
    "Engineering",
    "Support",
  ];
  const departmentOptions = Array.from(
    new Set([...standardDepartments, ...existingDepartments]),
  ).sort();
  const today = new Date();
  const minJoiningDate = format(today, "yyyy-MM-dd");
  const maxJoiningDate = format(
    new Date(today.getFullYear(), 11, 31),
    "yyyy-MM-dd",
  );

  const isJoiningDateAllowed = (value) => {
    if (!value) return false;
    return value >= minJoiningDate && value <= maxJoiningDate;
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get("/employees");
      setEmployees(res.data);
    } catch (error) {
      console.error("Failed to fetch employees", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const joiningDateChanged = formData.joiningDate !== originalJoiningDate;

      if (!editingId || joiningDateChanged) {
        if (!isJoiningDateAllowed(formData.joiningDate)) {
          alert(
            "Joining date must be from today through the end of the current year.",
          );
          return;
        }
      }

      if (editingId) {
        await api.put(`/employees/${editingId}`, formData);
      } else {
        await api.post("/employees", formData);
      }
      setShowModal(false);
      setEditingId(null);
      setOriginalJoiningDate("");
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "Employee",
        baseSalary: 0,
        shiftStartTime: "09:00",
        shiftEndTime: "17:00",
        department: "",
        joiningDate: format(new Date(), "yyyy-MM-dd"),
      });
      fetchEmployees();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to save employee");
    }
  };

  const handleEdit = (emp) => {
    setFormData({
      name: emp.name,
      email: emp.email,
      password: "", // Leave blank for edit unless changing
      role: emp.role,
      baseSalary: emp.baseSalary,
      shiftStartTime: emp.shiftStartTime,
      shiftEndTime: emp.shiftEndTime,
      department: emp.department || "",
      joiningDate: emp.joiningDate
        ? format(new Date(emp.joiningDate), "yyyy-MM-dd")
        : format(new Date(emp.createdAt), "yyyy-MM-dd"),
    });
    setOriginalJoiningDate(
      emp.joiningDate
        ? format(new Date(emp.joiningDate), "yyyy-MM-dd")
        : format(new Date(emp.createdAt), "yyyy-MM-dd"),
    );
    setEditingId(emp._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        await api.delete(`/employees/${id}`);
        fetchEmployees();
      } catch (error) {
        alert("Failed to delete");
      }
    }
  };

  const handleViewPerformance = async (empId) => {
    setLoadingPerformance(true);
    setPerformanceData({ loading: true });
    try {
      const res = await api.get(`/reports/employee/${empId}`);
      setPerformanceData(res.data);
    } catch (error) {
      alert("Failed to load performance data");
      setPerformanceData(null);
    } finally {
      setLoadingPerformance(false);
    }
  };

  if (loading) return <div>Loading employees...</div>;

  return (
    <div className="animate-fade-in">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "8px" }}>Employees</h1>
          <p style={{ color: "var(--text-muted)" }}>
            Manage your organization's staff
          </p>
        </div>
        {user?.role === "Admin" && (
          <button
            onClick={() => {
              setEditingId(null);
              setOriginalJoiningDate("");
              setFormData({
                name: "",
                email: "",
                password: "",
                role: "Employee",
                baseSalary: 0,
                shiftStartTime: "09:00",
                shiftEndTime: "17:00",
                department: "",
                joiningDate: format(new Date(), "yyyy-MM-dd"),
              });
              setShowModal(true);
            }}
            className="btn btn-primary"
          >
            <Plus size={20} /> Add Employee
          </button>
        )}
      </div>

      <div className="glass-panel table-container" style={{ padding: "24px" }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Role</th>
              <th>Base Salary</th>
              <th>Shift</th>
              <th>Joined On</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp._id}>
                <td style={{ fontWeight: "500" }}>{emp.name}</td>
                <td style={{ color: "var(--text-muted)" }}>{emp.email}</td>
                <td>{emp.department || "N/A"}</td>
                <td>
                  <span className="badge badge-Present">{emp.role}</span>
                </td>
                <td>৳ {emp.baseSalary}</td>
                <td>
                  {emp.shiftStartTime} - {emp.shiftEndTime}
                </td>
                <td>
                  {emp.joiningDate
                    ? format(new Date(emp.joiningDate), "MMM dd, yyyy")
                    : format(new Date(emp.createdAt), "MMM dd, yyyy")}
                </td>
                <td>
                  {(user?.role === "Admin" || user?.role === "HR") &&
                    emp.role !== "Admin" && (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => navigate(`/salary/${emp._id}`)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--warning)",
                            cursor: "pointer",
                          }}
                          title="View Payslip"
                        >
                          <FileText size={18} />
                        </button>
                        <button
                          onClick={() => handleViewPerformance(emp._id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--success)",
                            cursor: "pointer",
                          }}
                          title="View Performance"
                        >
                          <TrendingUp size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(emp)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--primary)",
                            cursor: "pointer",
                          }}
                          title="Edit Employee"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(emp._id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--danger)",
                            cursor: "pointer",
                          }}
                          title="Delete Employee"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 1000,
              overflowY: "auto",
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
            }}
          >
            <div
              className="glass-panel animate-fade-in"
              style={{
                padding: "32px",
                width: "100%",
                maxWidth: "500px",
                marginTop: "50px",
                marginBottom: "50px",
              }}
            >
              <h2 style={{ marginBottom: "24px" }}>
                {editingId ? "Edit Employee" : "Create New Employee"}
              </h2>
              <form
                onSubmit={handleSubmit}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <input
                  type="text"
                  placeholder="Full Name"
                  className="input-field"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="input-field"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
                <input
                  type="password"
                  placeholder={
                    editingId ? "New Password (Optional)" : "Temporary Password"
                  }
                  className="input-field"
                  required={!editingId}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-muted)",
                        marginBottom: "8px",
                        display: "block",
                      }}
                    >
                      Role
                    </label>
                    <select
                      className="input-field"
                      value={formData.role}
                      onChange={(e) => {
                        const newRole = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          role: newRole,
                          department:
                            newRole === "HR"
                              ? "HR"
                              : newRole === "Admin"
                                ? ""
                                : prev.department,
                        }));
                      }}
                    >
                      <option value="Employee">Employee</option>
                      <option value="HR">HR</option>
                      {user?.role === "Admin" && (
                        <option value="Admin">Admin</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-muted)",
                        marginBottom: "8px",
                        display: "block",
                      }}
                    >
                      Department
                    </label>
                    <select
                      className="input-field"
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({ ...formData, department: e.target.value })
                      }
                      disabled={
                        formData.role === "HR" || formData.role === "Admin"
                      }
                      style={{
                        opacity:
                          formData.role === "HR" || formData.role === "Admin"
                            ? 0.6
                            : 1,
                        cursor:
                          formData.role === "HR" || formData.role === "Admin"
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      <option value="">Unassigned</option>
                      {departmentOptions.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-muted)",
                        marginBottom: "8px",
                        display: "block",
                      }}
                    >
                      Base Salary (৳)
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      required
                      value={formData.baseSalary}
                      onChange={(e) =>
                        setFormData({ ...formData, baseSalary: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-muted)",
                        marginBottom: "8px",
                        display: "block",
                      }}
                    >
                      Joined On
                    </label>
                    <input
                      type="date"
                      className="input-field"
                      required
                      value={formData.joiningDate}
                      min={editingId ? undefined : minJoiningDate}
                      max={editingId ? undefined : maxJoiningDate}
                      onClick={(e) =>
                        e.target.showPicker && e.target.showPicker()
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          joiningDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-muted)",
                        marginBottom: "8px",
                        display: "block",
                      }}
                    >
                      Shift Start
                    </label>
                    <input
                      type="time"
                      className="input-field"
                      required
                      value={formData.shiftStartTime}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shiftStartTime: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-muted)",
                        marginBottom: "8px",
                        display: "block",
                      }}
                    >
                      Shift End
                    </label>
                    <input
                      type="time"
                      className="input-field"
                      required
                      value={formData.shiftEndTime}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shiftEndTime: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div
                  style={{ display: "flex", gap: "12px", marginTop: "16px" }}
                >
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => setShowModal(false)}
                    style={{
                      flex: 1,
                      background: "rgba(255,255,255,0.1)",
                      color: "white",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* Performance Modal */}
      {performanceData &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.6)",
              zIndex: 1000,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              className="glass-panel animate-fade-in"
              style={{
                padding: "32px",
                width: "100%",
                maxWidth: "500px",
                position: "relative",
              }}
            >
              <button
                onClick={() => setPerformanceData(null)}
                style={{
                  position: "absolute",
                  top: "24px",
                  right: "24px",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                <X size={24} />
              </button>

              {performanceData.loading ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  Loading performance data...
                </div>
              ) : (
                <>
                  <h2 style={{ marginBottom: "8px", fontSize: "1.8rem" }}>
                    Attendance Report
                  </h2>
                  <p
                    style={{ color: "var(--text-muted)", marginBottom: "32px" }}
                  >
                    {performanceData.employeeName} - {performanceData.month}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      marginBottom: "32px",
                    }}
                  >
                    <div
                      style={{
                        width: "120px",
                        height: "120px",
                        borderRadius: "50%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        border: `4px solid rgb(${performanceData.color})`,
                        background: `rgba(${performanceData.color}, 0.1)`,
                        boxShadow: `0 0 20px rgba(${performanceData.color}, 0.3)`,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "2.5rem",
                          fontWeight: "bold",
                          color: `rgb(${performanceData.color})`,
                        }}
                      >
                        {performanceData.score}
                      </span>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        / 100
                      </span>
                    </div>
                    <h3
                      style={{
                        marginTop: "16px",
                        fontSize: "1.5rem",
                        color: `rgb(${performanceData.color})`,
                      }}
                    >
                      {performanceData.rating}
                    </h3>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "16px",
                      marginBottom: "24px",
                    }}
                  >
                    <div
                      className="glass-panel"
                      style={{
                        padding: "16px",
                        textAlign: "center",
                        background: "rgba(16, 185, 129, 0.05)",
                      }}
                    >
                      <p
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.9rem",
                        }}
                      >
                        Days Present
                      </p>
                      <p
                        style={{
                          fontSize: "1.8rem",
                          fontWeight: "bold",
                          color: "var(--success)",
                        }}
                      >
                        {performanceData.presentDays}
                      </p>
                    </div>
                    <div
                      className="glass-panel"
                      style={{
                        padding: "16px",
                        textAlign: "center",
                        background: "rgba(244, 63, 94, 0.05)",
                      }}
                    >
                      <p
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.9rem",
                        }}
                      >
                        Days Absent
                      </p>
                      <p
                        style={{
                          fontSize: "1.8rem",
                          fontWeight: "bold",
                          color: "var(--danger)",
                        }}
                      >
                        {performanceData.absentDays}
                      </p>
                    </div>
                    <div
                      className="glass-panel"
                      style={{
                        padding: "16px",
                        textAlign: "center",
                        gridColumn: "1 / -1",
                        background: "rgba(245, 158, 11, 0.05)",
                      }}
                    >
                      <p
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.9rem",
                        }}
                      >
                        Days Late
                      </p>
                      <p
                        style={{
                          fontSize: "1.8rem",
                          fontWeight: "bold",
                          color: "var(--warning)",
                        }}
                      >
                        {performanceData.lateDays}
                      </p>
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-muted)",
                          marginTop: "4px",
                        }}
                      >
                        Total {performanceData.totalLateMinutes} minutes
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default Employees;
