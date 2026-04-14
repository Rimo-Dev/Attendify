export type Role = "admin" | "hr" | "manager" | "employee";

export interface EmployeeUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  employee?: EmployeeRecord | string | null;
}

export interface EmployeeRecord {
  _id: string;
  employeeId: string;
  department: string;
  designation: string;
  phone?: string;
  address?: string;
  joiningDate: string;
  monthlySalary: number;
  leaveBalance: number;
  avatar?: string;
  isActive: boolean;
  user?: EmployeeUser;
}

export interface AttendanceRecord {
  _id: string;
  employee?: EmployeeRecord;
  date: string;
  dateKey: string;
  checkInAt?: string | null;
  checkOutAt?: string | null;
  status: string;
  lateMinutes: number;
  earlyExitMinutes: number;
  workedMinutes: number;
  remarks?: string;
}

export interface LeaveRecord {
  _id: string;
  employee?: EmployeeRecord;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: string;
  decisionNote?: string;
}

export interface SalarySummary {
  month: string;
  workingDays: number;
  presentDays: number;
  approvedLeaveDays: number;
  absenceDays: number;
  lateCount: number;
  lateMinutes: number;
  monthlySalary: number;
  predictedPayableSalary: number;
  deductions: {
    absenceDeduction: number;
    lateDeduction: number;
    totalDeduction: number;
  };
}

export interface OfficeSettings {
  _id: string;
  officeName: string;
  workdays: number[];
  startTime: string;
  endTime: string;
  gracePeriodMinutes: number;
  latePenaltyPerMinute: number;
  absenceDeductionPerDay: number;
  halfDayThresholdMinutes: number;
  senderLabel: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
