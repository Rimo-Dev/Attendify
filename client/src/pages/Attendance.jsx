import { format } from "date-fns";
import { Download, Edit2, FileText, LogIn, LogOut, Trash2 } from "lucide-react";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import api from "../services/api";

const Attendance = () => {
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    checkIn: "",
    checkOut: "",
    status: "Present",
    lateDuration: 0,
  });
  const [selectedDate, setSelectedDate] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const { user } = useContext(AuthContext);
  const exportMenuRef = useRef(null);

  const isManager = user?.role === "Admin" || user?.role === "HR";
  const canCheckOwnAttendance =
    user?.role === "Employee" || user?.role === "HR";

  const fetchAttendance = useCallback(async () => {
    try {
      const endpoint = isManager ? "/attendance" : "/attendance/my";
      const res = await api.get(endpoint);
      setAttendanceLogs(res.data);
    } catch (error) {
      console.error("Failed to fetch attendance", error);
    } finally {
      setLoading(false);
    }
  }, [isManager]);

  useEffect(() => {
    (async () => {
      try {
        const endpoint = isManager ? "/attendance" : "/attendance/my";
        const res = await api.get(endpoint);
        setAttendanceLogs(res.data);
      } catch (error) {
        console.error("Failed to fetch attendance", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [isManager]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target)
      ) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCheckIn = async () => {
    try {
      await api.post("/attendance/check-in");
      fetchAttendance();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to check in");
    }
  };

  const handleCheckOut = async () => {
    try {
      await api.put("/attendance/check-out");
      fetchAttendance();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to check out");
    }
  };

  const openCsvInNewTab = (csvContent) => {
    const newWindow = window.open("", "_blank", "noopener,noreferrer");

    if (!newWindow) {
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `attendance_export_${format(new Date(), "yyyyMMdd")}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }

    newWindow.document.title = "Attendance Export CSV";
    newWindow.document.body.innerHTML = `<pre style="white-space: pre-wrap; word-break: break-word; font-family: monospace; padding: 16px;">${csvContent.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")}</pre>`;
  };

  const openCSV = () => {
    const headers = [
      "Date",
      "Employee",
      "Check In",
      "Check Out",
      "Status",
      "Late By (mins)",
    ];
    const rows = attendanceLogs.map((log) => [
      format(new Date(log.date), "yyyy-MM-dd"),
      log.employeeId?.name || user.name,
      log.checkIn ? format(new Date(log.checkIn), "HH:mm") : "--",
      log.checkOut ? format(new Date(log.checkOut), "HH:mm") : "--",
      log.status,
      log.lateDuration || 0,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
    openCsvInNewTab(csvContent);
    setShowExportMenu(false);
  };

  const handleEdit = (log) => {
    setFormData({
      checkIn: log.checkIn
        ? new Date(
            new Date(log.checkIn).getTime() -
              new Date().getTimezoneOffset() * 60000,
          )
            .toISOString()
            .slice(0, 16)
        : "",
      checkOut: log.checkOut
        ? new Date(
            new Date(log.checkOut).getTime() -
              new Date().getTimezoneOffset() * 60000,
          )
            .toISOString()
            .slice(0, 16)
        : "",
      status: log.status,
      lateDuration: log.lateDuration || 0,
    });
    setEditingId(log._id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (payload.checkIn === "") payload.checkIn = null;
      if (payload.checkOut === "") payload.checkOut = null;
      await api.put(`/attendance/${editingId}`, payload);
      setShowModal(false);
      setEditingId(null);
      fetchAttendance();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update attendance");
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm("Are you sure you want to delete this attendance record?")
    ) {
      try {
        await api.delete(`/attendance/${id}`);
        fetchAttendance();
      } catch (err) {
        console.error(err);
        alert("Failed to delete attendance record");
      }
    }
  };

  const uniqueEmployees = Array.from(
    new Set(
      attendanceLogs
        .filter((log) => log.employeeId)
        .map((log) => log.employeeId._id),
    ),
  ).map(
    (id) =>
      attendanceLogs.find((log) => log.employeeId?._id === id)?.employeeId,
  );

  const filteredLogs = attendanceLogs.filter((log) => {
    let match = true;
    if (selectedEmployee && log.employeeId?._id !== selectedEmployee)
      match = false;
    if (
      selectedDate &&
      format(new Date(log.date), "yyyy-MM-dd") !== selectedDate
    )
      match = false;
    return match;
  });

  if (loading) return <div>Loading attendance logs...</div>;

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
          <h1 style={{ fontSize: "2rem", marginBottom: "8px" }}>
            Attendance Log
          </h1>
          <p style={{ color: "var(--text-muted)" }}>
            Track daily check-ins and check-outs
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "16px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {isManager && (
            <>
              <input
                type="date"
                className="input-field"
                style={{
                  width: "auto",
                  margin: 0,
                  padding: "8px 16px",
                  height: "40px",
                }}
                value={selectedDate}
                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              <select
                className="input-field"
                style={{
                  width: "auto",
                  margin: 0,
                  padding: "8px 16px",
                  height: "40px",
                }}
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                <option value="">All Employees</option>
                {uniqueEmployees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name}
                  </option>
                ))}
              </select>
              {(selectedEmployee || selectedDate) && (
                <button
                  onClick={() => {
                    setSelectedEmployee("");
                    setSelectedDate("");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--primary)",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                >
                  Clear Filters
                </button>
              )}
            </>
          )}
          <div ref={exportMenuRef} style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setShowExportMenu((prev) => !prev)}
              className="btn"
              style={{
                background: "rgba(59, 130, 246, 0.2)",
                color: "var(--primary)",
                padding: "10px 18px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Download size={20} /> Export
            </button>
            {showExportMenu && (
              <div
                className="glass-panel animate-fade-in"
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "8px",
                  padding: "8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  zIndex: 10,
                  minWidth: "160px",
                  background: "rgba(20, 20, 20, 0.95)",
                }}
              >
                <button
                  type="button"
                  onClick={openCSV}
                  className="btn"
                  style={{
                    background: "transparent",
                    color: "var(--text-color)",
                    justifyContent: "flex-start",
                    padding: "8px 12px",
                    width: "100%",
                  }}
                >
                  <FileText size={16} style={{ color: "var(--primary)" }} />{" "}
                  Export as CSV
                </button>
                {/* PDF export removed per request */}
              </div>
            )}
          </div>
          {canCheckOwnAttendance && (
            <>
              <button
                onClick={handleCheckIn}
                className="btn btn-primary"
                style={{ background: "var(--success)" }}
              >
                <LogIn size={20} /> Check In Now
              </button>
              <button
                onClick={handleCheckOut}
                className="btn btn-primary"
                style={{ background: "var(--danger)" }}
              >
                <LogOut size={20} /> Check Out
              </button>
            </>
          )}
        </div>
      </div>

      <div className="glass-panel table-container" style={{ padding: "24px" }}>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              {isManager && <th>Employee</th>}
              <th>Check In</th>
              <th>Check Out</th>
              <th>Status</th>
              <th>Late By</th>
              {isManager && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log._id}>
                <td>{format(new Date(log.date), "MMM dd, yyyy")}</td>
                {isManager && (
                  <td style={{ fontWeight: "500" }}>{log.employeeId?.name}</td>
                )}
                <td>
                  {log.checkIn
                    ? format(new Date(log.checkIn), "hh:mm a")
                    : "--"}
                </td>
                <td>
                  {log.checkOut
                    ? format(new Date(log.checkOut), "hh:mm a")
                    : "--"}
                </td>
                <td>
                  <span className={`badge badge-${log.status}`}>
                    {log.status}
                  </span>
                </td>
                <td
                  style={{
                    color: log.lateDuration > 0 ? "var(--warning)" : "inherit",
                  }}
                >
                  {log.lateDuration > 0 ? `${log.lateDuration} mins` : "--"}
                </td>
                {isManager && (
                  <td>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => handleEdit(log)}
                        style={{
                          background: "none",
                          color: "var(--primary)",
                          border: "none",
                          padding: "6px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          backgroundColor: "rgba(139, 92, 246, 0.1)",
                        }}
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(log._id)}
                        style={{
                          background: "none",
                          color: "var(--danger)",
                          border: "none",
                          padding: "6px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          backgroundColor: "rgba(239, 68, 68, 0.1)",
                        }}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {showModal && user.role === "Admin" && (
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
            <h2 style={{ marginBottom: "24px" }}>Edit Attendance</h2>
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
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
                    Check In
                  </label>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={formData.checkIn}
                    onChange={(e) =>
                      setFormData({ ...formData, checkIn: e.target.value })
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
                    Check Out
                  </label>
                  <input
                    type="datetime-local"
                    className="input-field"
                    value={formData.checkOut}
                    onChange={(e) =>
                      setFormData({ ...formData, checkOut: e.target.value })
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
                    Status
                  </label>
                  <select
                    className="input-field"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                  >
                    <option value="Present">Present</option>
                    <option value="Late">Late</option>
                    <option value="Absent">Absent</option>
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
                    Late By (mins)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.lateDuration}
                    onChange={(e) =>
                      setFormData({ ...formData, lateDuration: e.target.value })
                    }
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Save Changes
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
        </div>
      )}
    </div>
  );
};

export default Attendance;
