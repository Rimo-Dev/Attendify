import {
  ArrowRight,
  Building2,
  CalendarDays,
  FileMinus,
  FileText,
  Megaphone,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div
    className="glass-panel"
    style={{
      padding: "24px",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        right: "-20px",
        top: "-20px",
        opacity: 0.04,
        transform: "scale(2.5)",
      }}
    >
      <Icon size={100} color={`rgb(${color})`} />
    </div>
    <div
      style={{
        width: "48px",
        height: "48px",
        borderRadius: "12px",
        background: `rgba(${color}, 0.1)`,
        color: `rgb(${color})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon size={24} />
    </div>
    <div>
      <h3
        style={{ fontSize: "2.2rem", fontWeight: "bold", marginBottom: "4px" }}
      >
        {value}
      </h3>
      <p
        style={{
          color: "var(--text-muted)",
          fontSize: "0.95rem",
          fontWeight: "500",
        }}
      >
        {title}
      </p>
    </div>
  </div>
);

const HRDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [summary, setSummary] = useState({
    announcements: 0,
    pendingLeaves: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showOnLeave, setShowOnLeave] = useState(false);
  const [onLeaveList, setOnLeaveList] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashboardRes, leavesRes, announcementsRes] = await Promise.all([
          api.get("/reports/dashboard"),
          api.get("/leaves"),
          api.get("/announcements"),
        ]);

        setStats(dashboardRes.data);
        setSummary({
          announcements: announcementsRes.data.length,
          pendingLeaves: leavesRes.data.filter(
            (leave) => leave.status === "Pending",
          ).length,
        });
      } catch (error) {
        console.error("Error fetching HR dashboard", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: "40px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "32px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "2.5rem", marginBottom: "8px" }}>
            HR Overview
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>
            Monitor attendance, leaves, employee records, and announcements.
          </p>
        </div>
      </div>

      {stats ? (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "24px",
              marginBottom: "32px",
            }}
          >
            <StatCard
              title="Total Employees"
              value={stats.totalEmployees}
              icon={Users}
              color="99, 102, 241"
            />
            <StatCard
              title="Present Today"
              value={stats.presentCount}
              icon={CalendarDays}
              color="16, 185, 129"
            />
            <StatCard
              title="Late Today"
              value={stats.lateCount}
              icon={FileText}
              color="245, 158, 11"
            />
            <StatCard
              title="Pending Leaves"
              value={summary.pendingLeaves}
              icon={Building2}
              color="244, 63, 94"
            />
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
            <div
              className="glass-panel"
              style={{ flex: "1 1 320px", padding: "32px" }}
            >
              <h2 style={{ fontSize: "1.5rem", marginBottom: "24px" }}>
                Quick Actions
              </h2>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <button
                  onClick={() => navigate("/employees")}
                  className="glass-panel"
                  style={{
                    padding: "20px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: "1px solid rgba(255,255,255,0.05)",
                    background: "rgba(255,255,255,0.02)",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    outline: "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                    }}
                  >
                    <div
                      style={{
                        color: "var(--primary)",
                        background: "rgba(99, 102, 241, 0.1)",
                        padding: "10px",
                        borderRadius: "10px",
                      }}
                    >
                      <Users size={20} />
                    </div>
                    <span
                      style={{
                        fontWeight: "500",
                        fontSize: "1.05rem",
                        color: "var(--text-color)",
                      }}
                    >
                      Employee Records
                    </span>
                  </div>
                  <ArrowRight
                    size={18}
                    style={{ color: "var(--text-muted)" }}
                  />
                </button>

                <button
                  onClick={() => navigate("/attendance")}
                  className="glass-panel"
                  style={{
                    padding: "20px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: "1px solid rgba(255,255,255,0.05)",
                    background: "rgba(255,255,255,0.02)",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    outline: "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                    }}
                  >
                    <div
                      style={{
                        color: "var(--success)",
                        background: "rgba(16, 185, 129, 0.1)",
                        padding: "10px",
                        borderRadius: "10px",
                      }}
                    >
                      <CalendarDays size={20} />
                    </div>
                    <span
                      style={{
                        fontWeight: "500",
                        fontSize: "1.05rem",
                        color: "var(--text-color)",
                      }}
                    >
                      Review Attendance
                    </span>
                  </div>
                  <ArrowRight
                    size={18}
                    style={{ color: "var(--text-muted)" }}
                  />
                </button>

                <button
                  onClick={() => navigate("/leaves")}
                  className="glass-panel"
                  style={{
                    padding: "20px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: "1px solid rgba(255,255,255,0.05)",
                    background: "rgba(255,255,255,0.02)",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    outline: "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                    }}
                  >
                    <div
                      style={{
                        color: "var(--warning)",
                        background: "rgba(245, 158, 11, 0.1)",
                        padding: "10px",
                        borderRadius: "10px",
                      }}
                    >
                      <FileText size={20} />
                    </div>
                    <span
                      style={{
                        fontWeight: "500",
                        fontSize: "1.05rem",
                        color: "var(--text-color)",
                      }}
                    >
                      Review Leave Requests
                    </span>
                  </div>
                  <ArrowRight
                    size={18}
                    style={{ color: "var(--text-muted)" }}
                  />
                </button>

                <button
                  onClick={async () => {
                    try {
                      const res = await api.get("/leaves/onleave");
                      setOnLeaveList(res.data);
                      setShowOnLeave(true);
                    } catch (e) {
                      console.error("Failed to fetch on-leave list", e);
                    }
                  }}
                  className="glass-panel"
                  style={{
                    padding: "20px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: "1px solid rgba(255,255,255,0.05)",
                    background: "rgba(255,255,255,0.02)",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    outline: "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                    }}
                  >
                    <div
                      style={{
                        color: "var(--danger)",
                        background: "rgba(244, 63, 94, 0.06)",
                        padding: "10px",
                        borderRadius: "10px",
                      }}
                    >
                      <FileMinus size={20} />
                    </div>
                    <span
                      style={{
                        fontWeight: "500",
                        fontSize: "1.05rem",
                        color: "var(--text-color)",
                      }}
                    >
                      On Leave
                    </span>
                  </div>
                  <ArrowRight
                    size={18}
                    style={{ color: "var(--text-muted)" }}
                  />
                </button>

                <button
                  onClick={() => navigate("/announcements")}
                  className="glass-panel"
                  style={{
                    padding: "20px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: "1px solid rgba(255,255,255,0.05)",
                    background: "rgba(255,255,255,0.02)",
                    cursor: "pointer",
                    textAlign: "left",
                    width: "100%",
                    outline: "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                    }}
                  >
                    <div
                      style={{
                        color: "#8b5cf6",
                        background: "rgba(139, 92, 246, 0.1)",
                        padding: "10px",
                        borderRadius: "10px",
                      }}
                    >
                      <Megaphone size={20} />
                    </div>
                    <span
                      style={{
                        fontWeight: "500",
                        fontSize: "1.05rem",
                        color: "var(--text-color)",
                      }}
                    >
                      Post Announcements
                    </span>
                  </div>
                  <ArrowRight
                    size={18}
                    style={{ color: "var(--text-muted)" }}
                  />
                </button>
              </div>
            </div>

            <div
              className="glass-panel"
              style={{ flex: "1 1 320px", padding: "32px" }}
            >
              <h2 style={{ fontSize: "1.5rem", marginBottom: "16px" }}>
                HR Focus
              </h2>
              <p style={{ color: "var(--text-muted)", lineHeight: 1.7 }}>
                Use this panel to review attendance irregularities, monitor
                leave approvals, update employee details, and publish internal
                notices. Employee account creation stays with Admin only.
              </p>
              <div
                style={{
                  marginTop: "24px",
                  padding: "16px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--text-muted)",
                    marginBottom: "8px",
                  }}
                >
                  Published announcements
                </p>
                <p style={{ fontSize: "1.8rem", fontWeight: "bold" }}>
                  {summary.announcements}
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div
          className="glass-panel"
          style={{
            padding: "60px",
            textAlign: "center",
            color: "var(--text-muted)",
          }}
        >
          <p style={{ fontSize: "1.2rem" }}>
            Unable to load HR overview. Please ensure the server is running.
          </p>
        </div>
      )}

      {showOnLeave && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: "100%",
              maxWidth: "600px",
              padding: "24px",
              position: "relative",
            }}
          >
            <button
              onClick={() => setShowOnLeave(false)}
              style={{
                position: "absolute",
                right: "16px",
                top: "16px",
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
              }}
            >
              Close
            </button>
            <h2 style={{ marginBottom: "16px" }}>Employees On Leave</h2>
            {onLeaveList.length === 0 ? (
              <p style={{ color: "var(--text-muted)" }}>
                No approved leaves for today.
              </p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {onLeaveList.map((l) => (
                  <li
                    key={l._id}
                    style={{
                      padding: "12px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {l.employeeId?.name || "Unknown"}
                        </div>
                        <div
                          style={{
                            color: "var(--text-muted)",
                            fontSize: "0.9rem",
                          }}
                        >
                          {l.employeeId?.email || ""}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 600 }}>
                          {new Date(l.startDate).toLocaleDateString()} -{" "}
                          {new Date(l.endDate).toLocaleDateString()}
                        </div>
                        <div
                          style={{
                            color: "var(--text-muted)",
                            fontSize: "0.9rem",
                          }}
                        >
                          {l.type}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HRDashboard;
