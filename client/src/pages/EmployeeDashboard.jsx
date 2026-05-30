import { format } from "date-fns";
import { ArrowRight, Calendar, Wallet } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import api from "../services/api";

const EmployeeDashboard = () => {
  const { user } = useContext(AuthContext);
  const [salaryPrediction, setSalaryPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalary = async () => {
      try {
        const res = await api.get("/salary/predict");
        setSalaryPrediction(res.data);
      } catch (error) {
        console.error("Error fetching salary", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSalary();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="animate-fade-in">
      <h1 style={{ fontSize: "2rem", marginBottom: "8px" }}>
        Welcome back, {user.name}
      </h1>
      <p
        style={{
          color: "var(--text-muted)",
          marginBottom: "8px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <Calendar size={16} />
        Appointed on:{" "}
        {user.joiningDate
          ? format(new Date(user.joiningDate), "MMMM dd, yyyy")
          : user.createdAt
            ? format(new Date(user.createdAt), "MMMM dd, yyyy")
            : "N/A"}
      </p>
      <p style={{ color: "var(--text-muted)", marginBottom: "32px" }}>
        Here is your personal attendance and salary overview for this month.
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <h2 style={{ fontSize: "1.5rem" }}>Salary Prediction</h2>
        <Link
          to="/salary"
          className="btn"
          style={{
            background: "rgba(59, 130, 246, 0.1)",
            color: "var(--primary)",
            display: "flex",
            gap: "8px",
            alignItems: "center",
          }}
        >
          View Detailed Breakdown <ArrowRight size={16} />
        </Link>
      </div>
      {salaryPrediction ? (
        <div className="glass-panel" style={{ padding: "32px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              marginBottom: "32px",
              borderBottom: "1px solid var(--glass-border)",
              paddingBottom: "32px",
            }}
          >
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "rgba(16, 185, 129, 0.1)",
                color: "var(--success)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Wallet size={40} />
            </div>
            <div>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "1.1rem",
                  marginBottom: "8px",
                }}
              >
                Estimated Net Pay
              </p>
              <h2
                style={{
                  fontSize: "3rem",
                  fontWeight: "bold",
                  color: "var(--success)",
                }}
              >
                {salaryPrediction.currency}
                {salaryPrediction.predictedSalary}
              </h2>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "24px",
            }}
          >
            <div>
              <p style={{ color: "var(--text-muted)" }}>Base Salary</p>
              <p style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
                {salaryPrediction.currency}
                {salaryPrediction.baseSalary}
              </p>
            </div>
            <div>
              <p style={{ color: "var(--text-muted)" }}>Present Days</p>
              <p
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  color: "var(--success)",
                }}
              >
                {salaryPrediction.presentDays} /{" "}
                {salaryPrediction.workingDaysInMonth}
              </p>
            </div>
            <div>
              <p style={{ color: "var(--text-muted)" }}>Late Days</p>
              <p
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  color: "var(--warning)",
                }}
              >
                {salaryPrediction.lateDays} ({salaryPrediction.totalLateMinutes}
                m)
              </p>
            </div>
            <div>
              <p style={{ color: "var(--text-muted)" }}>Deductions</p>
              <p
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  color: "var(--danger)",
                }}
              >
                {salaryPrediction.currency}
                {(
                  parseFloat(salaryPrediction.lateDeduction) +
                  parseFloat(salaryPrediction.absentDeduction)
                ).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p>Unable to load salary data.</p>
      )}
    </div>
  );
};

export default EmployeeDashboard;
