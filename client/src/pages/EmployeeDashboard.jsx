import { Wallet } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import api from "../services/api";

const buildDayKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

const getAnnouncementMonthHolidays = (announcements) => {
  const monthNow = new Date();
  const monthStart = new Date(monthNow.getFullYear(), monthNow.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);

  const monthEnd = new Date(monthNow.getFullYear(), monthNow.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);

  const holidayMap = new Map();

  (announcements || []).forEach((announcement) => {
    if (
      !announcement?.isHoliday &&
      !announcement?.holidayDate &&
      !announcement?.holidayStartDate &&
      !announcement?.holidayEndDate
    ) {
      return;
    }

    let start =
      announcement.holidayStartDate ||
      announcement.holidayDate ||
      announcement.holidayEndDate ||
      null;
    let end =
      announcement.holidayEndDate ||
      announcement.holidayDate ||
      announcement.holidayStartDate ||
      null;

    if (!start || !end) {
      return;
    }

    start = new Date(start);
    end = new Date(end);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (start > end) {
      const temp = start;
      start = end;
      end = temp;
    }

    const effectiveStart = start < monthStart ? new Date(monthStart) : start;
    const effectiveEnd = end > monthEnd ? new Date(monthEnd) : end;
    effectiveStart.setHours(0, 0, 0, 0);
    effectiveEnd.setHours(0, 0, 0, 0);

    if (effectiveStart > effectiveEnd) {
      return;
    }

    for (
      let day = new Date(effectiveStart);
      day <= effectiveEnd;
      day.setDate(day.getDate() + 1)
    ) {
      const key = buildDayKey(day);
      if (!holidayMap.has(key)) {
        holidayMap.set(
          key,
          announcement.holidayName || announcement.title || "Holiday",
        );
      }
    }
  });

  return Array.from(holidayMap.entries())
    .map(([date, name]) => ({ date, name }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

const EmployeeDashboard = () => {
  const { user } = useContext(AuthContext);
  const [salaryPrediction, setSalaryPrediction] = useState(null);
  const [announcementHolidayList, setAnnouncementHolidayList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCutModal, setShowCutModal] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchSalary = async () => {
      try {
        const [salaryRes, announcementsRes] = await Promise.all([
          api.get("/salary/predict"),
          api.get("/announcements"),
        ]);
        if (isMounted) {
          setSalaryPrediction(salaryRes.data);
          setAnnouncementHolidayList(
            getAnnouncementMonthHolidays(announcementsRes.data),
          );
        }
      } catch (error) {
        console.error("Error fetching salary", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSalary();

    const intervalId = setInterval(fetchSalary, 60000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  if (loading) return <div>Loading dashboard...</div>;

  const totalWorkingDays = salaryPrediction?.totalWorkingDays || 0;
  const workingDaysSoFar = salaryPrediction?.workingDaysSoFar || 0;
  const workingProgressPercent = Math.min(
    100,
    Number(salaryPrediction?.workingProgressPercent || 0),
  );
  const liveSalary =
    salaryPrediction?.finalSalary || salaryPrediction?.predictedSalary;
  const salaryLabel = salaryPrediction?.isSalaryFinalized
    ? "Final salary"
    : "Live estimated salary";
  const salaryHolidayMap = new Map(
    (salaryPrediction?.companyHolidaysThisMonth || []).map((holiday) => [
      holiday.date,
      holiday.name || "Holiday",
    ]),
  );
  announcementHolidayList.forEach((holiday) => {
    if (!salaryHolidayMap.has(holiday.date)) {
      salaryHolidayMap.set(holiday.date, holiday.name || "Holiday");
    }
  });

  const monthlyHolidayList = Array.from(salaryHolidayMap.entries())
    .map(([date, name]) => ({ date, name }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const monthlyHolidayCount = monthlyHolidayList.length;

  return (
    <div className="animate-fade-in">
      <h1 style={{ fontSize: "2rem", marginBottom: "8px" }}>
        Welcome back, {user.name}
      </h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "8px" }}>
        Here is your attendance and salary cut overview so far this month.
      </p>
      {salaryPrediction && (
        <p
          style={{
            color: "var(--text-muted)",
            marginBottom: "24px",
            fontSize: "0.95rem",
          }}
        >
          Salary period: {salaryPrediction.salaryPeriodStart} →{" "}
          {salaryPrediction.salaryPeriodEnd} •{" "}
          {salaryPrediction.isSalaryFinalized
            ? "Finalized"
            : `Live until ${salaryPrediction.salaryPeriodEnd}`}
        </p>
      )}

      <h2 style={{ fontSize: "1.5rem", marginBottom: "24px" }}>
        Live Payroll Snapshot
      </h2>
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
                Net Pay After Current Deductions
              </p>
              <h2
                style={{
                  fontSize: "3rem",
                  fontWeight: "bold",
                  color: "var(--success)",
                }}
              >
                {salaryPrediction.currency}
                {liveSalary}
              </h2>
              <p style={{ color: "var(--text-muted)", marginTop: "10px" }}>
                {salaryLabel}
              </p>
              <p style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
                {salaryPrediction.currency}
                {salaryPrediction.baseSalary}
              </p>
            </div>
            <div>
              <p style={{ color: "var(--text-muted)" }}>Working Progress</p>
              <p
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  color: "var(--success)",
                }}
              >
                {workingDaysSoFar} / {totalWorkingDays}
              </p>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                  marginTop: "6px",
                }}
              >
                {workingProgressPercent.toFixed(0)}% of the month's working days
                completed
              </p>
            </div>
            <div>
              <p style={{ color: "var(--text-muted)" }}>Late Summary</p>
              <p
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  color: "var(--warning)",
                }}
              >
                {salaryPrediction.lateDays} days,{" "}
                {salaryPrediction.totalLateMinutes} mins
              </p>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                  marginTop: "6px",
                }}
              >
                Chargeable after {salaryPrediction.gracePeriodMinutes || 5}{" "}
                grace minutes
              </p>
            </div>
            <div>
              <p style={{ color: "var(--text-muted)" }}>
                Salary Cut This Month
              </p>
              <p
                style={{
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  color: "var(--danger)",
                }}
              >
                {salaryPrediction.currency}
                {salaryPrediction.salaryCutSoFar ||
                  salaryPrediction.monthlySalaryCut ||
                  (
                    parseFloat(salaryPrediction.lateDeduction) +
                    parseFloat(salaryPrediction.absentDeduction)
                  ).toFixed(2)}
              </p>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                  marginTop: "6px",
                }}
              >
                Daily rate: {salaryPrediction.currency}
                {Number(salaryPrediction.dailyRate || 0).toFixed(2)} |
                Per-minute rate: {salaryPrediction.currency}
                {Number(salaryPrediction.perMinuteSalaryRate || 0).toFixed(4)}
              </p>
            </div>
          </div>

          {showCutModal && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1200,
              }}
              onClick={() => setShowCutModal(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: "480px",
                  background: "var(--bg)",
                  padding: "20px",
                  borderRadius: 12,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                }}
              >
                <h3 style={{ marginTop: 0 }}>Salary Cut Breakdown</h3>
                <div style={{ display: "grid", gap: 12 }}>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span>Late Deduction</span>
                    <strong>
                      {salaryPrediction.currency}
                      {salaryPrediction.lateDeduction || "0.00"}
                    </strong>
                  </div>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span>Absent Deduction</span>
                    <strong>
                      {salaryPrediction.currency}
                      {salaryPrediction.absentDeduction || "0.00"}
                    </strong>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      borderTop: "1px dashed var(--glass-border)",
                      paddingTop: 8,
                    }}
                  >
                    <span>Total Cut</span>
                    <strong>
                      {salaryPrediction.currency}
                      {(
                        parseFloat(salaryPrediction.lateDeduction || 0) +
                        parseFloat(salaryPrediction.absentDeduction || 0)
                      ).toFixed(2)}
                    </strong>
                  </div>
                  {salaryPrediction.leaveDates &&
                    salaryPrediction.leaveDates.length > 0 && (
                      <div>
                        <div
                          style={{
                            marginTop: 8,
                            fontSize: "0.95rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          Approved leave days (no deduction):
                        </div>
                        <ul style={{ margin: "8px 0 0 16px" }}>
                          {salaryPrediction.leaveDates.map((d) => (
                            <li key={d}>{d}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: 14,
                  }}
                >
                  <button
                    className="btn"
                    onClick={() => setShowCutModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              marginTop: "28px",
              paddingTop: "24px",
              borderTop: "1px solid var(--glass-border)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "18px",
            }}
          >
            <div>
              <p style={{ color: "var(--text-muted)" }}>Present Days</p>
              <p style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                {salaryPrediction.presentDays}
              </p>
            </div>
            <div>
              <p style={{ color: "var(--text-muted)" }}>Absent Days</p>
              <p style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                {salaryPrediction.absentDays}
              </p>
            </div>
            <div>
              <p style={{ color: "var(--text-muted)" }}>Company Holidays</p>
              <p style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                {monthlyHolidayCount}
              </p>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.8rem",
                  marginTop: "6px",
                }}
              >
                This month
              </p>
            </div>
            <div>
              <p style={{ color: "var(--text-muted)" }}>Salary Status</p>
              <p style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                {salaryPrediction.isSalaryFinalized
                  ? "Finalized"
                  : "Live estimate"}
              </p>
            </div>
          </div>

          <div
            style={{
              marginTop: "28px",
              paddingTop: "24px",
              borderTop: "1px solid var(--glass-border)",
            }}
          >
            <h3 style={{ marginBottom: "12px", fontSize: "1.1rem" }}>
              Company Holidays This Month
            </h3>

            {monthlyHolidayList.length > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {monthlyHolidayList.map((holiday) => (
                  <div
                    key={`${holiday.date}-${holiday.name}`}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      background: "rgba(148, 163, 184, 0.08)",
                      border: "1px solid var(--glass-border)",
                      borderRadius: "10px",
                      padding: "10px 12px",
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{holiday.name}</span>
                    <span
                      style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}
                    >
                      {new Date(holiday.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
                No company holidays announced for this month.
              </p>
            )}
          </div>
        </div>
      ) : (
        <p>Unable to load salary data.</p>
      )}
    </div>
  );
};

export default EmployeeDashboard;
