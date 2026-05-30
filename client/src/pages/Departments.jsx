import { Building2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const Departments = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
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
    fetchEmployees();
  }, []);

  if (loading) return <div>Loading departments...</div>;

  // Group employees by department
  const departmentsMap = {};
  employees.forEach((emp) => {
    const dept =
      emp.department && emp.department.trim() !== ""
        ? emp.department
        : "Unassigned";
    if (!departmentsMap[dept]) {
      departmentsMap[dept] = [];
    }
    departmentsMap[dept].push(emp);
  });

  const departments = Object.keys(departmentsMap).map((name) => ({
    name,
    count: departmentsMap[name].length,
    employees: departmentsMap[name],
  }));

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
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "24px",
        }}
      >
        {departments.map((dept) => (
          <div
            key={dept.name}
            className="glass-panel"
            style={{
              padding: "24px",
              cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onClick={() =>
              navigate(`/departments/${encodeURIComponent(dept.name)}`)
            }
            onMouseOver={(e) =>
              (e.currentTarget.style.transform = "translateY(-4px)")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.transform = "translateY(0)")
            }
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  background: "rgba(59, 130, 246, 0.1)",
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
                    gap: "6px",
                    color: "var(--text-muted)",
                    fontSize: "0.9rem",
                    marginTop: "4px",
                  }}
                >
                  <Users size={14} />
                  <span>
                    {dept.count} Employee{dept.count !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>

            <button
              className="btn"
              style={{ width: "100%", background: "rgba(255,255,255,0.05)" }}
            >
              View Employees
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Departments;
