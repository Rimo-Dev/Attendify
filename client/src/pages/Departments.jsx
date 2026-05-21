import { Building2, Users } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import api from "../services/api";

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === "Admin";
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await api.get("/departments");
        setDepartments(res.data);
      } catch (error) {
        console.error("Failed to fetch departments", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  if (loading) return <div>Loading departments...</div>;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "8px" }}>Departments</h1>
        <p style={{ color: "var(--text-muted)" }}>
          Overview of organizational departments
        </p>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div />
        {isAdmin && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingDept(null);
              setFormData({ name: "", description: "" });
              setShowModal(true);
            }}
          >
            Add Department
          </button>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 24,
        }}
      >
        {departments.length === 0 ? (
          <div
            className="glass-panel"
            style={{
              padding: 32,
              textAlign: "center",
              color: "var(--text-muted)",
            }}
          >
            No departments defined.
          </div>
        ) : (
          departments.map((dept) => (
            <div
              key={dept._id}
              className="glass-panel"
              style={{ padding: 24, position: "relative" }}
            >
              {isAdmin && (
                <div
                  style={{
                    position: "absolute",
                    right: 12,
                    top: 12,
                    display: "flex",
                    gap: 8,
                  }}
                >
                  <button
                    className="btn"
                    onClick={() => {
                      setEditingDept(dept);
                      setFormData({
                        name: dept.name,
                        description: dept.description || "",
                      });
                      setShowModal(true);
                    }}
                    style={{ padding: 8 }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn"
                    onClick={async () => {
                      if (!confirm("Delete department?")) return;
                      try {
                        await api.delete(`/departments/${dept._id}`);
                        setDepartments(
                          departments.filter((d) => d._id !== dept._id),
                        );
                      } catch (e) {
                        alert("Failed to delete");
                      }
                    }}
                    style={{
                      padding: 8,
                      background: "rgba(239,68,68,0.1)",
                      color: "var(--danger)",
                    }}
                  >
                    Delete
                  </button>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: "rgba(59,130,246,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--primary)",
                  }}
                >
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: "bold" }}>
                    {dept.name}
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      color: "var(--text-muted)",
                      fontSize: "0.9rem",
                      marginTop: 4,
                    }}
                  >
                    <Users size={14} />
                    <span>
                      {dept.employeeCount ?? dept.count ?? 0} Employee
                      {(dept.employeeCount ?? dept.count ?? 0) !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "0.9rem",
                      marginTop: 6,
                    }}
                  >
                    {dept.description || ""}
                  </div>
                </div>
              </div>

              <button
                className="btn"
                style={{ width: "100%", background: "rgba(255,255,255,0.05)" }}
                onClick={() =>
                  navigate(`/departments/${encodeURIComponent(dept.name)}`)
                }
              >
                View Employees
              </button>
            </div>
          ))
        )}
      </div>

      {/* Admin Create/Edit Modal */}
      {showModal &&
        createPortal(
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 2000,
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              overflowY: "auto",
            }}
          >
            <div
              className="glass-panel"
              style={{
                padding: 32,
                width: "100%",
                maxWidth: 600,
                marginTop: 50,
              }}
            >
              <h2 style={{ marginBottom: 16 }}>
                {editingDept ? "Edit Department" : "Create Department"}
              </h2>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <input
                  className="input-field"
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
                <textarea
                  className="input-field"
                  placeholder="Description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
                <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                  <button
                    className="btn btn-primary"
                    onClick={async () => {
                      try {
                        if (!formData.name) return alert("Name required");
                        if (editingDept) {
                          const res = await api.put(
                            `/departments/${editingDept._id}`,
                            formData,
                          );
                          setDepartments(
                            departments.map((d) =>
                              d._id === res.data._id ? res.data : d,
                            ),
                          );
                        } else {
                          const res = await api.post("/departments", formData);
                          setDepartments([...departments, res.data]);
                        }
                        setShowModal(false);
                      } catch (err) {
                        alert(err.response?.data?.message || "Failed");
                      }
                    }}
                  >
                    {editingDept ? "Save" : "Create"}
                  </button>
                  <button className="btn" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

export default Departments;
