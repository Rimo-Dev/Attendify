import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { api, downloadCsv } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { DataTable } from "../components/DataTable";
import { SectionCard } from "../components/SectionCard";
import { StatCard } from "../components/StatCard";
import { TrendChart } from "../components/TrendChart";
import type { AttendanceRecord, EmployeeRecord, LeaveRecord, OfficeSettings, SalarySummary } from "../types";

interface EmployeeForm {
  name: string;
  email: string;
  password: string;
  role: "employee" | "hr" | "manager";
  employeeId: string;
  department: string;
  designation: string;
  joiningDate: string;
  monthlySalary: number;
}

interface LeaveForm {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
}

interface SettingsForm {
  officeName: string;
  startTime: string;
  endTime: string;
  gracePeriodMinutes: number;
  latePenaltyPerMinute: number;
  absenceDeductionPerDay: number;
  halfDayThresholdMinutes: number;
}

export function DashboardPage() {
  const { user, logout } = useAuth();
  const [overview, setOverview] = useState<any>(null);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [salary, setSalary] = useState<SalarySummary | null>(null);
  const [salaryReport, setSalaryReport] = useState<any[]>([]);
  const [settings, setSettings] = useState<OfficeSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const employeeForm = useForm<EmployeeForm>({
    defaultValues: {
      role: "employee",
      joiningDate: new Date().toISOString().slice(0, 10),
    },
  });
  const leaveForm = useForm<LeaveForm>({ defaultValues: { leaveType: "casual" } });
  const settingsForm = useForm<SettingsForm>();
  const passwordForm = useForm<{ currentPassword: string; newPassword: string }>();

  const rolePath = useMemo(() => user?.role || "employee", [user]);

  async function loadData() {
    if (!user) return;
    setLoading(true);

    try {
      const common = [api.get(`/dashboard/${rolePath}`), api.get("/leaves")];
      const employeeCalls = [api.get("/attendance/me?range=month"), api.get("/salary/me")];
      const leadershipCalls = [api.get("/employees?limit=50"), api.get("/attendance")];

      const responses =
        user.role === "employee"
          ? await Promise.all([...common, ...employeeCalls])
          : await Promise.all([
              ...common,
              ...leadershipCalls,
              ...(user.role === "admin" || user.role === "hr" ? [api.get("/salary/report")] : []),
              api.get("/settings/office"),
            ]);

      setOverview(responses[0].data.data);
      setLeaves(responses[1].data.data);

      if (user.role === "employee") {
        setAttendance(responses[2].data.data);
        setSalary(responses[3].data.data);
      } else {
        setEmployees(responses[2].data.data.items);
        setAttendance(responses[3].data.data);
        if (user.role === "admin" || user.role === "hr") {
          setSalaryReport(responses[4].data.data);
          setSettings(responses[5].data.data);
          settingsForm.reset(responses[5].data.data);
        } else {
          setSettings(responses[4].data.data);
        }
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [user]);

  const submitEmployee = employeeForm.handleSubmit(async (values) => {
    try {
      await api.post("/employees", values);
      toast.success("Employee created.");
      employeeForm.reset({ role: "employee", joiningDate: new Date().toISOString().slice(0, 10) } as EmployeeForm);
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not create employee.");
    }
  });

  const submitLeave = leaveForm.handleSubmit(async (values) => {
    try {
      await api.post("/leaves", values);
      toast.success("Leave request submitted.");
      leaveForm.reset({ leaveType: "casual", startDate: "", endDate: "", reason: "" });
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not apply for leave.");
    }
  });

  const submitSettings = settingsForm.handleSubmit(async (values) => {
    try {
      await api.patch("/settings/office", values);
      toast.success("Office settings updated.");
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not update settings.");
    }
  });

  const submitPassword = passwordForm.handleSubmit(async (values) => {
    try {
      await api.patch("/auth/change-password", values);
      toast.success("Password updated.");
      passwordForm.reset();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not update password.");
    }
  });

  async function handleAttendanceAction(path: string) {
    try {
      await api.post(path);
      toast.success(path.includes("check-in") ? "Checked in." : "Checked out.");
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Attendance action failed.");
    }
  }

  async function handleLeaveDecision(id: string, decision: "approve" | "reject") {
    try {
      await api.patch(`/leaves/${id}/${decision}`, {
        decisionNote: decision === "approve" ? "Approved in dashboard." : "Rejected in dashboard.",
      });
      toast.success(`Leave ${decision}d.`);
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not process leave.");
    }
  }

  async function toggleStatus(employee: EmployeeRecord) {
    try {
      await api.patch(`/employees/${employee._id}/status`, { isActive: !employee.isActive });
      toast.success("Employee status updated.");
      loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not update employee.");
    }
  }

  if (!user) return null;

  const stats =
    user.role === "employee"
      ? [
          { label: "Working Days", value: salary?.workingDays ?? 0 },
          { label: "Present Days", value: salary?.presentDays ?? 0, accent: "#0f766e" },
          { label: "Approved Leave", value: salary?.approvedLeaveDays ?? 0, accent: "#2563eb" },
          { label: "Predicted Salary", value: `৳${salary?.predictedPayableSalary ?? 0}`, accent: "#ca8a04" },
        ]
      : [
          { label: "Employees", value: overview?.totalEmployees ?? 0 },
          { label: "Present Today", value: overview?.presentCount ?? 0, accent: "#0f766e" },
          { label: "Absent Today", value: overview?.absentCount ?? 0, accent: "#dc2626" },
          { label: "Late Today", value: overview?.lateCount ?? 0, accent: "#d97706" },
        ];

  return (
    <main className="dashboard-page">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Attendify</p>
          <h2>{user.role.toUpperCase()}</h2>
          <p className="sidebar-copy">{user.name}</p>
          <p className="sidebar-copy">{user.email}</p>
        </div>
        <div className="sidebar-actions">
          <button className="secondary-button" onClick={loadData}>Refresh</button>
          <button className="secondary-button" onClick={() => logout()}>Logout</button>
        </div>
      </aside>

      <section className="dashboard-content">
        <header className="page-header">
          <div>
            <p className="eyebrow">Role Based Dashboard</p>
            <h1>{user.role === "employee" ? "My Attendance Workspace" : "Operations Command Center"}</h1>
            <p className="hero-copy">Track attendance, review leave, monitor salary impact, and export operational snapshots.</p>
          </div>
        </header>

        {loading ? <p className="empty-state">Loading dashboard...</p> : null}

        <div className="stats-grid">
          {stats.map((item) => (
            <StatCard key={item.label} label={item.label} value={item.value} accent={item.accent} />
          ))}
        </div>

        {user.role !== "employee" && overview?.monthlyTrend ? (
          <SectionCard title="Attendance Trend">
            <TrendChart data={overview.monthlyTrend} />
          </SectionCard>
        ) : null}

        {user.role === "employee" ? (
          <div className="content-grid">
            <SectionCard
              title="Today’s Actions"
              action={
                <div className="button-row">
                  <button onClick={() => handleAttendanceAction("/attendance/check-in")}>Check In</button>
                  <button className="secondary-button" onClick={() => handleAttendanceAction("/attendance/check-out")}>Check Out</button>
                </div>
              }
            >
              <p className="helper-text">Late arrivals and early exits are calculated automatically from office settings.</p>
              {salary ? (
                <div className="summary-grid">
                  <div><span>Late Minutes</span><strong>{salary.lateMinutes}</strong></div>
                  <div><span>Absence Days</span><strong>{salary.absenceDays}</strong></div>
                  <div><span>Total Deduction</span><strong>৳{salary.deductions.totalDeduction}</strong></div>
                </div>
              ) : null}
            </SectionCard>

            <SectionCard title="Apply for Leave">
              <form className="form-grid compact-grid" onSubmit={submitLeave}>
                <label><span>Type</span><select {...leaveForm.register("leaveType")}><option value="casual">Casual</option><option value="sick">Sick</option><option value="annual">Annual</option><option value="unpaid">Unpaid</option></select></label>
                <label><span>Start Date</span><input type="date" {...leaveForm.register("startDate", { required: true })} /></label>
                <label><span>End Date</span><input type="date" {...leaveForm.register("endDate", { required: true })} /></label>
                <label className="full-span"><span>Reason</span><textarea rows={3} {...leaveForm.register("reason", { required: true })} /></label>
                <button type="submit">Submit Leave</button>
              </form>
            </SectionCard>

            <SectionCard title="Attendance History">
              <DataTable
                rows={attendance}
                emptyMessage="No attendance records yet."
                columns={[
                  { key: "date", header: "Date", render: (row) => row.dateKey },
                  { key: "status", header: "Status", render: (row) => row.status },
                  { key: "in", header: "Check In", render: (row) => row.checkInAt ? new Date(row.checkInAt).toLocaleTimeString() : "--" },
                  { key: "out", header: "Check Out", render: (row) => row.checkOutAt ? new Date(row.checkOutAt).toLocaleTimeString() : "--" },
                  { key: "late", header: "Late", render: (row) => `${row.lateMinutes} min` },
                ]}
              />
            </SectionCard>

            <SectionCard title="Leave History">
              <DataTable
                rows={leaves}
                emptyMessage="No leave requests yet."
                columns={[
                  { key: "type", header: "Type", render: (row) => row.leaveType },
                  { key: "days", header: "Days", render: (row) => row.days },
                  { key: "range", header: "Range", render: (row) => `${row.startDate.slice(0, 10)} to ${row.endDate.slice(0, 10)}` },
                  { key: "status", header: "Status", render: (row) => row.status },
                ]}
              />
            </SectionCard>
          </div>
        ) : (
          <div className="content-grid">
            {(user.role === "admin" || user.role === "hr") && (
              <SectionCard title="Create Employee">
                <form className="form-grid compact-grid" onSubmit={submitEmployee}>
                  <label><span>Name</span><input {...employeeForm.register("name", { required: true })} /></label>
                  <label><span>Email</span><input type="email" {...employeeForm.register("email", { required: true })} /></label>
                  <label><span>Password</span><input type="password" {...employeeForm.register("password", { required: true })} /></label>
                  <label><span>Role</span><select {...employeeForm.register("role")}><option value="employee">Employee</option><option value="hr">HR</option><option value="manager">Manager</option></select></label>
                  <label><span>Employee ID</span><input {...employeeForm.register("employeeId", { required: true })} /></label>
                  <label><span>Department</span><input {...employeeForm.register("department", { required: true })} /></label>
                  <label><span>Designation</span><input {...employeeForm.register("designation", { required: true })} /></label>
                  <label><span>Joining Date</span><input type="date" {...employeeForm.register("joiningDate", { required: true })} /></label>
                  <label><span>Monthly Salary</span><input type="number" {...employeeForm.register("monthlySalary", { required: true, valueAsNumber: true })} /></label>
                  <button type="submit">Create Employee</button>
                </form>
              </SectionCard>
            )}

            <SectionCard
              title="Employees"
              action={<div className="button-row"><button className="secondary-button" onClick={() => downloadCsv("/reports/attendance?download=csv", "attendance-report.csv")}>Attendance CSV</button><button className="secondary-button" onClick={() => downloadCsv("/reports/leaves?download=csv", "leave-report.csv")}>Leave CSV</button></div>}
            >
              <DataTable
                rows={employees}
                emptyMessage="No employees found."
                columns={[
                  { key: "id", header: "Employee ID", render: (row) => row.employeeId },
                  { key: "name", header: "Name", render: (row) => row.user?.name || "--" },
                  { key: "dept", header: "Department", render: (row) => row.department },
                  { key: "role", header: "Role", render: (row) => row.user?.role || "--" },
                  { key: "salary", header: "Salary", render: (row) => `৳${row.monthlySalary}` },
                  { key: "status", header: "Status", render: (row) => user.role === "manager" ? (row.isActive ? "Active" : "Inactive") : <button className="tag-button" onClick={() => toggleStatus(row)}>{row.isActive ? "Deactivate" : "Activate"}</button> },
                ]}
              />
            </SectionCard>

            <SectionCard
              title="Leave Requests"
              action={<button className="secondary-button" onClick={() => downloadCsv("/reports/late-summary?download=csv", "late-summary.csv")}>Late Summary CSV</button>}
            >
              <DataTable
                rows={leaves}
                emptyMessage="No leave requests found."
                columns={[
                  { key: "employee", header: "Employee", render: (row) => row.employee?.user?.name || "--" },
                  { key: "type", header: "Type", render: (row) => row.leaveType },
                  { key: "days", header: "Days", render: (row) => row.days },
                  { key: "status", header: "Status", render: (row) => row.status },
                  { key: "action", header: "Action", render: (row) => row.status === "pending" && (user.role === "hr" || user.role === "manager") ? <div className="button-row"><button className="tag-button" onClick={() => handleLeaveDecision(row._id, "approve")}>Approve</button><button className="tag-button danger-tag" onClick={() => handleLeaveDecision(row._id, "reject")}>Reject</button></div> : "Processed" },
                ]}
              />
            </SectionCard>

            <SectionCard title="Attendance Monitor">
              <DataTable
                rows={attendance}
                emptyMessage="No attendance records found."
                columns={[
                  { key: "employee", header: "Employee", render: (row) => row.employee?.user?.name || "--" },
                  { key: "date", header: "Date", render: (row) => row.dateKey },
                  { key: "status", header: "Status", render: (row) => row.status },
                  { key: "late", header: "Late", render: (row) => `${row.lateMinutes} min` },
                  { key: "worked", header: "Worked", render: (row) => `${row.workedMinutes} min` },
                ]}
              />
            </SectionCard>

            {(user.role === "admin" || user.role === "hr") && (
              <SectionCard
                title="Salary Report"
                action={<button className="secondary-button" onClick={() => downloadCsv("/reports/salary?download=csv", "salary-report.csv")}>Salary CSV</button>}
              >
                <DataTable
                  rows={salaryReport}
                  emptyMessage="No salary summaries available."
                  columns={[
                    { key: "employee", header: "Employee", render: (row) => row.employee?.user?.name || row.employee?.employeeId || "--" },
                    { key: "month", header: "Month", render: (row) => row.salary.month },
                    { key: "present", header: "Present", render: (row) => row.salary.presentDays },
                    { key: "deduction", header: "Deduction", render: (row) => `৳${row.salary.deductions.totalDeduction}` },
                    { key: "salary", header: "Predicted Pay", render: (row) => `৳${row.salary.predictedPayableSalary}` },
                  ]}
                />
              </SectionCard>
            )}

            {user.role === "admin" && settings && (
              <SectionCard title="Office Settings">
                <form className="form-grid compact-grid" onSubmit={submitSettings}>
                  <label><span>Office Name</span><input {...settingsForm.register("officeName")} /></label>
                  <label><span>Start Time</span><input type="time" {...settingsForm.register("startTime")} /></label>
                  <label><span>End Time</span><input type="time" {...settingsForm.register("endTime")} /></label>
                  <label><span>Grace Minutes</span><input type="number" {...settingsForm.register("gracePeriodMinutes", { valueAsNumber: true })} /></label>
                  <label><span>Late Penalty / Min</span><input type="number" {...settingsForm.register("latePenaltyPerMinute", { valueAsNumber: true })} /></label>
                  <label><span>Absence Deduction / Day</span><input type="number" {...settingsForm.register("absenceDeductionPerDay", { valueAsNumber: true })} /></label>
                  <label><span>Half Day Threshold</span><input type="number" {...settingsForm.register("halfDayThresholdMinutes", { valueAsNumber: true })} /></label>
                  <button type="submit">Save Settings</button>
                </form>
              </SectionCard>
            )}
          </div>
        )}

        <SectionCard title="Security">
          <form className="form-grid compact-grid" onSubmit={submitPassword}>
            <label><span>Current Password</span><input type="password" {...passwordForm.register("currentPassword", { required: true })} /></label>
            <label><span>New Password</span><input type="password" {...passwordForm.register("newPassword", { required: true })} /></label>
            <button type="submit">Change Password</button>
          </form>
        </SectionCard>
      </section>
    </main>
  );
}
