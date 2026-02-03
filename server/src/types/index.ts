export type UserRole =
  | 'super_admin'
  | 'tenant_admin'
  | 'company_admin'
  | 'site_admin'
  | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  role?: UserRole;
  roleMobile?: string;
  companyId?: string;
  siteId?: string;
  department?: string;
  position?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface SiteBreakdownRow {
  siteName: string;
  checkInTime: string | null;
  checkOutTime: string | null;
}

export interface AttendanceReportRow {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  siteId: string;
  siteName: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  totalMinutes: number | null;
  status: 'present' | 'absent' | 'partial' | 'leave';
  /** Per-site check-in/check-out when siteName is "Multiple" */
  siteBreakdown?: SiteBreakdownRow[];
}
