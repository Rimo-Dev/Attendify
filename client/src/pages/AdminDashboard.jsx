import {
  ArrowRight,
  CalendarDays,
  CalendarMinus,
  FileText,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
} from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
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
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
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

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/reports/dashboard");
        setStats(res.data);
      } catch (error) {
        console.error("Error fetching stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  const presentPercentage =
    stats && stats.totalEmployees > 0
      ? Math.round((stats.presentCount / stats.totalEmployees) * 100)
      : 0;
  const absentPercentage =
    stats && stats.totalEmployees > 0
      ? Math.round((stats.absentCount / stats.totalEmployees) * 100)
      : 0;
  const latePercentage =
    stats && stats.totalEmployees > 0
      ? Math.round((stats.lateCount / stats.totalEmployees) * 100)
      : 0;
  const onLeavePercentage =
    stats && stats.totalEmployees > 0
      ? Math.round((stats.onLeaveCount / stats.totalEmployees) * 100)
      : 0;

  return (
    <>
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
            <h1
              style={{
                fontSize: "2.5rem",
                marginBottom: "8px",
                background: "linear-gradient(to right, #ffffff, #a1a1aa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Company Overview
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>
              Welcome back, {user.name}. Here's what's happening today.
            </p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={() => setShowLeaveModal(true)}
              className="btn"
              style={{
                background: "rgba(139, 92, 246, 0.1)",
                color: "#8b5cf6",
                padding: "10px 18px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <CalendarMinus size={18} /> On Leave ({stats?.onLeaveCount || 0})
            </button>
            <button
              onClick={() => navigate("/employees")}
              className="btn btn-primary"
              style={{ padding: "10px 18px" }}
            >
              <UserPlus size={18} /> Manage Staff
            </button>
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
                icon={UserCheck}
                color="16, 185, 129"
              />
              <StatCard
                title="Absent Today"
                value={stats.absentCount}
                icon={UserX}
                color="244, 63, 94"
              />
              <StatCard
                title="On Leave"
                value={stats.onLeaveCount}
                icon={CalendarMinus}
                color="139, 92, 246"
              />
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
              {/* Attendance Visualizer */}
              <div
                className="glass-panel"
                style={{
                  flex: "2 1 400px",
                  padding: "32px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <h2 style={{ fontSize: "1.5rem", marginBottom: "32px" }}>
                  Today's Attendance Overview
                </h2>

                <div
                  style={{
                    height: "36px",
                    width: "100%",
                    borderRadius: "18px",
                    display: "flex",
                    overflow: "hidden",
                    marginBottom: "32px",
                    background: "rgba(255,255,255,0.05)",
                    boxShadow: "inset 0 2px 10px rgba(0,0,0,0.2)",
                  }}
                >
                  {presentPercentage > 0 && (
                    <div
                      style={{
                        width: `${presentPercentage}%`,
                        background: "var(--success)",
                        transition: "width 1.5s ease-in-out",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                      }}
                    >
                      {presentPercentage > 5 ? `${presentPercentage}%` : ""}
                    </div>
                  )}
                  {latePercentage > 0 && (
                    <div
                      style={{
                        width: `${latePercentage}%`,
                        background: "var(--warning)",
                        transition: "width 1.5s ease-in-out",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                      }}
                    >
                      {latePercentage > 5 ? `${latePercentage}%` : ""}
                    </div>
                  )}
                  {absentPercentage > 0 && (
                    <div
                      style={{
                        width: `${absentPercentage}%`,
                        background: "var(--danger)",
                        transition: "width 1.5s ease-in-out",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                      }}
                    >
                      {absentPercentage > 5 ? `${absentPercentage}%` : ""}
                    </div>
                  )}
                  {onLeavePercentage > 0 && (
                    <div
                      style={{
                        width: `${onLeavePercentage}%`,
                        background: "#8b5cf6",
                        transition: "width 1.5s ease-in-out",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                      }}
                    >
                      {onLeavePercentage > 5 ? `${onLeavePercentage}%` : ""}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "16px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        background: "var(--success)",
                        boxShadow: "0 0 10px rgba(16, 185, 129, 0.4)",
                      }}
                    ></div>
                    <span
                      style={{ color: "var(--text-color)", fontWeight: "500" }}
                    >
                      Present{" "}
                      <span style={{ color: "var(--text-muted)" }}>
                        ({stats.presentCount})
                      </span>
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        background: "var(--warning)",
                        boxShadow: "0 0 10px rgba(245, 158, 11, 0.4)",
                      }}
                    ></div>
                    <span
                      style={{ color: "var(--text-color)", fontWeight: "500" }}
                    >
                      Late{" "}
                      <span style={{ color: "var(--text-muted)" }}>
                        ({stats.lateCount})
                      </span>
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        background: "var(--danger)",
                        boxShadow: "0 0 10px rgba(244, 63, 94, 0.4)",
                      }}
                    ></div>
                    <span
                      style={{ color: "var(--text-color)", fontWeight: "500" }}
                    >
                      Absent{" "}
                      <span style={{ color: "var(--text-muted)" }}>
                        ({stats.absentCount})
                      </span>
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        background: "#8b5cf6",
                        boxShadow: "0 0 10px rgba(139, 92, 246, 0.4)",
                      }}
                    ></div>
                    <span
                      style={{ color: "var(--text-color)", fontWeight: "500" }}
                    >
                      On Leave{" "}
                      <span style={{ color: "var(--text-muted)" }}>
                        ({stats.onLeaveCount})
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div
                className="glass-panel"
                style={{ flex: "1 1 300px", padding: "32px" }}
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
                          color: "var(--primary)",
                          background: "rgba(99, 102, 241, 0.1)",
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
                        Manage Leaves
                      </span>
                    </div>
                    <ArrowRight
                      size={18}
                      style={{ color: "var(--text-muted)" }}
                    />
                  </button>
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
              Unable to load statistics. Please ensure the server is running.
            </p>
          </div>
        )}
      </div>

      {/* On Leave Modal */}
      {showLeaveModal &&
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
                maxHeight: "80vh",
                overflowY: "auto",
              }}
            >
              <button
                onClick={() => setShowLeaveModal(false)}
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

              <h2
                style={{
                  marginBottom: "8px",
                  fontSize: "1.8rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <CalendarMinus size={28} color="#8b5cf6" /> Employees On Leave
              </h2>
              <p style={{ color: "var(--text-muted)", marginBottom: "32px" }}>
                Currently approved leaves for today.
              </p>

              {stats?.onLeaveEmployees?.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  {stats.onLeaveEmployees.map((emp) => (
                    <div
                      key={emp.id}
                      className="glass-panel"
                      style={{
                        padding: "16px",
                        background: "rgba(255,255,255,0.02)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <p
                          style={{
                            fontWeight: "bold",
                            fontSize: "1.1rem",
                            marginBottom: "4px",
                          }}
                        >
                          {emp.name}
                        </p>
                        <p
                          style={{
                            color: "var(--text-muted)",
                            fontSize: "0.9rem",
                          }}
                        >
                          {emp.department || "No Department"}
                        </p>
                      </div>
                      <span
                        className="badge"
                        style={{
                          background: "rgba(139, 92, 246, 0.2)",
                          color: "#8b5cf6",
                        }}
                      >
                        {emp.type} Leave
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: "40px 0",
                    textAlign: "center",
                    color: "var(--text-muted)",
                  }}
                >
                  <CalendarMinus
                    size={48}
                    style={{ opacity: 0.2, marginBottom: "16px" }}
                  />
                  <p>No employees are currently on leave today.</p>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default AdminDashboard;
