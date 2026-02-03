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

export interface AttendanceReportParams {
  date?: string; // YYYY-MM-DD
  from?: string;
  to?: string;
  siteId?: string;
  limit?: number;
  offset?: number;
}

export interface Company {
  id: string;
  companyCode: string;
  name: string;
  status: string;
  timezone: string;
}

export interface Site {
  id: string;
  companyId: string;
  companyName: string;
  siteCode: string;
  name: string;
  description: string;
  timezone: string;
  status: string;
}

export type ZoneType = 'circle' | 'polygon' | 'digipin';

export interface AttendanceZone {
  id: string;
  siteId: string;
  zoneCode: string;
  name: string;
  description: string;
  zoneType: ZoneType;
  centerLatitude: number | null;
  centerLongitude: number | null;
  radiusMeters: number | null;
  polygonBoundary: Array<{ latitude: number; longitude: number }> | null;
  digipinCode: string | null;
  status: string;
}

export interface Employee {
  id: string;
  companyId: string;
  companyName: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone: string;
  status: string;
}

export interface EmployeeZoneAssignment {
  id: string;
  zoneId: string | null;
  zoneName: string | null;
  siteId: string | null;
  siteName: string | null;
  noLocation: boolean;
}

export interface EmployeeAssignments {
  userId: string | null;
  userEmail: string | null;
  roleWeb: string | null;
  roleMobile: string | null;
  zones: EmployeeZoneAssignment[];
}
