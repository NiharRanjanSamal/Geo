/**
 * ============================================================================
 * GEO-FENCING ATTENDANCE SYSTEM - COMPLETE DATABASE SCHEMA
 * ============================================================================
 * Version: 1.0.0
 * Database: SQLite (via expo-sqlite)
 * Architecture: Multi-tenant SaaS
 * Purpose: Attendance engine with geo-fencing capabilities
 * ============================================================================
 */

export const SCHEMA_VERSION = 1;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

// --- Enums as Types ---

export type TenantStatus = 'active' | 'suspended' | 'trial' | 'cancelled';
export type SubscriptionTier = 'basic' | 'standard' | 'premium' | 'enterprise';
export type EntityStatus = 'active' | 'inactive';
export type UserStatus = 'active' | 'inactive' | 'locked' | 'pending_verification';
export type UserRole = 'super_admin' | 'tenant_admin' | 'company_admin' | 'site_admin' | 'employee';
export type EmployeeStatus = 'active' | 'inactive' | 'on_leave' | 'terminated';
export type SiteStatus = 'active' | 'inactive' | 'maintenance';
export type ZoneType = 'circle' | 'polygon' | 'digipin';
export type ZoneStatus = 'active' | 'inactive' | 'testing';
export type AttendanceStatus = 'present' | 'absent' | 'partial' | 'holiday' | 'leave' | 'pending';
export type ApprovalStatus = 'pending' | 'auto_approved' | 'approved' | 'rejected';
export type SessionStatus = 'active' | 'completed' | 'cancelled' | 'auto_closed';
export type SessionType = 'regular' | 'overtime' | 'break' | 'offsite';
export type CheckMethod = 'gps' | 'wifi' | 'manual' | 'qr' | 'nfc' | 'beacon' | 'auto';
export type EventType = 'check_in' | 'check_out' | 'location_update' | 'zone_enter' | 'zone_exit' | 'anomaly_detected' | 'manual_override' | 'auto_checkout';
export type DeviceStatus = 'active' | 'inactive' | 'blocked' | 'pending_approval';
export type OSType = 'ios' | 'android' | 'other';
export type SyncStatus = 'synced' | 'pending' | 'conflict';
export type AccessLevel = 'full' | 'readonly' | 'limited';

// --- Entity Interfaces ---

export interface Tenant {
  id?: number;
  tenant_code: string;
  name: string;
  status: TenantStatus;
  subscription_tier: SubscriptionTier;
  settings?: string; // JSON
  created_at?: number;
  updated_at?: number;
}

export interface Company {
  id?: number;
  tenant_id: number;
  company_code: string;
  name: string;
  status: EntityStatus;
  timezone: string;
  settings?: string; // JSON
  created_at?: number;
  updated_at?: number;
}

export interface UserAccount {
  id?: number;
  tenant_id: number;
  email: string;
  phone?: string;
  password_hash: string;
  status: UserStatus;
  role: UserRole;
  email_verified: number;
  phone_verified: number;
  last_login_at?: number;
  last_login_ip?: string;
  failed_login_count: number;
  locked_until?: number;
  reset_token?: string;
  reset_token_expires?: number;
  created_at?: number;
  updated_at?: number;
}

export interface Employee {
  id?: number;
  company_id: number;
  external_id?: string;
  employee_code: string;
  first_name: string;
  last_name?: string;
  display_name?: string;
  email?: string;
  phone?: string;
  status: EmployeeStatus;
  attendance_settings?: string; // JSON
  created_at?: number;
  updated_at?: number;
}

export interface EmployeeUserMap {
  id?: number;
  employee_id: number;
  user_id: number;
  is_primary: number;
  access_level: AccessLevel;
  status: EntityStatus;
  created_at?: number;
  updated_at?: number;
}

export interface Site {
  id?: number;
  company_id: number;
  site_code: string;
  name: string;
  description?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  status: SiteStatus;
  settings?: string; // JSON
  created_at?: number;
  updated_at?: number;
}

export interface SiteZone {
  id?: number;
  site_id: number;
  zone_code: string;
  name: string;
  description?: string;
  zone_type: ZoneType;
  center_latitude?: number;
  center_longitude?: number;
  radius_meters?: number;
  polygon_boundary?: string; // JSON array of {lat, lng}
  digipin_code?: string;
  min_accuracy_meters: number;
  priority: number;
  status: ZoneStatus;
  is_primary: number;
  created_at?: number;
  updated_at?: number;
}

export interface EmployeeSite {
  id?: number;
  employee_id: number;
  site_id: number;
  is_primary: number;
  valid_from?: number;
  valid_until?: number;
  status: EntityStatus;
  access_restrictions?: string; // JSON
  created_at?: number;
  updated_at?: number;
}

export interface AttendanceDay {
  id?: number;
  employee_id: number;
  site_id: number;
  attendance_date: number; // YYYYMMDD format
  first_in_time?: number;
  last_out_time?: number;
  total_work_seconds: number;
  total_break_seconds: number;
  session_count: number;
  status: AttendanceStatus;
  has_anomaly: number;
  anomaly_notes?: string;
  approval_status: ApprovalStatus;
  approved_by?: number;
  approved_at?: number;
  sync_status: SyncStatus;
  last_synced_at?: number;
  created_at?: number;
  updated_at?: number;
}

export interface AttendanceSession {
  id?: number;
  attendance_day_id: number;
  employee_id: number;
  session_number: number;
  in_time: number;
  in_zone_id?: number;
  in_latitude: number;
  in_longitude: number;
  in_accuracy: number;
  in_method: CheckMethod;
  out_time?: number;
  out_zone_id?: number;
  out_latitude?: number;
  out_longitude?: number;
  out_accuracy?: number;
  out_method?: CheckMethod;
  duration_seconds?: number;
  session_type: SessionType;
  status: SessionStatus;
  in_mock_gps_flag: number;
  out_mock_gps_flag: number;
  in_outside_zone: number;
  out_outside_zone: number;
  notes?: string;
  sync_status: SyncStatus;
  created_at?: number;
  updated_at?: number;
}

export interface GeoAttendanceLog {
  id?: number;
  session_id?: number;
  employee_id: number;
  site_id: number;
  zone_id?: number;
  event_type: EventType;
  event_timestamp: number;
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy: number;
  heading?: number;
  speed?: number;
  gps_provider?: string;
  satellites_used?: number;
  is_mock_location: number;
  is_vpn_detected: number;
  is_rooted_device: number;
  device_id?: number;
  device_fingerprint?: string;
  ip_address?: string;
  wifi_ssid?: string;
  wifi_bssid?: string;
  network_type?: string;
  app_version?: string;
  os_version?: string;
  battery_level?: number;
  raw_location_data?: string;
  extra_metadata?: string; // JSON
  created_at?: number;
}

export interface EmployeeDevice {
  id?: number;
  employee_id: number;
  device_uuid: string;
  device_fingerprint?: string;
  device_name?: string;
  device_model?: string;
  device_manufacturer?: string;
  os_type: OSType;
  os_version?: string;
  app_version?: string;
  fcm_token?: string;
  apns_token?: string;
  status: DeviceStatus;
  is_primary: number;
  is_bound: number;
  bound_at?: number;
  is_rooted_jailbroken: number;
  allows_mock_location: number;
  last_active_at?: number;
  last_ip_address?: string;
  last_latitude?: number;
  last_longitude?: number;
  registered_at?: number;
  registered_ip?: string;
  created_at?: number;
  updated_at?: number;
}

// ============================================================================
// SQL CREATE TABLE STATEMENTS
// ============================================================================

export const CREATE_TENANT_TABLE = `
CREATE TABLE IF NOT EXISTS tenant (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_code         TEXT NOT NULL UNIQUE,
    name                TEXT NOT NULL,
    status              TEXT NOT NULL DEFAULT 'active' 
                        CHECK(status IN ('active', 'suspended', 'trial', 'cancelled')),
    subscription_tier   TEXT NOT NULL DEFAULT 'basic'
                        CHECK(subscription_tier IN ('basic', 'standard', 'premium', 'enterprise')),
    settings            TEXT DEFAULT '{}',
    created_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);
`;

export const CREATE_COMPANY_TABLE = `
CREATE TABLE IF NOT EXISTS company (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id           INTEGER NOT NULL,
    company_code        TEXT NOT NULL,
    name                TEXT NOT NULL,
    status              TEXT NOT NULL DEFAULT 'active'
                        CHECK(status IN ('active', 'inactive', 'suspended')),
    timezone            TEXT NOT NULL DEFAULT 'UTC',
    settings            TEXT DEFAULT '{}',
    created_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE CASCADE,
    UNIQUE(tenant_id, company_code)
);
`;

export const CREATE_USER_ACCOUNT_TABLE = `
CREATE TABLE IF NOT EXISTS user_account (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id           INTEGER NOT NULL,
    email               TEXT NOT NULL,
    phone               TEXT,
    password_hash       TEXT NOT NULL,
    status              TEXT NOT NULL DEFAULT 'active'
                        CHECK(status IN ('active', 'inactive', 'locked', 'pending_verification')),
    role                TEXT NOT NULL DEFAULT 'employee'
                        CHECK(role IN ('super_admin', 'tenant_admin', 'company_admin', 'site_admin', 'employee')),
    email_verified      INTEGER NOT NULL DEFAULT 0 CHECK(email_verified IN (0, 1)),
    phone_verified      INTEGER NOT NULL DEFAULT 0 CHECK(phone_verified IN (0, 1)),
    last_login_at       INTEGER,
    last_login_ip       TEXT,
    failed_login_count  INTEGER NOT NULL DEFAULT 0,
    locked_until        INTEGER,
    reset_token         TEXT,
    reset_token_expires INTEGER,
    created_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE CASCADE,
    UNIQUE(tenant_id, email)
);
`;

export const CREATE_EMPLOYEE_TABLE = `
CREATE TABLE IF NOT EXISTS employee (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id          INTEGER NOT NULL,
    external_id         TEXT,
    employee_code       TEXT NOT NULL,
    first_name          TEXT NOT NULL,
    last_name           TEXT,
    display_name        TEXT,
    email               TEXT,
    phone               TEXT,
    status              TEXT NOT NULL DEFAULT 'active'
                        CHECK(status IN ('active', 'inactive', 'on_leave', 'terminated')),
    attendance_settings TEXT DEFAULT '{}',
    created_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    UNIQUE(company_id, employee_code)
);
`;

export const CREATE_EMPLOYEE_USER_MAP_TABLE = `
CREATE TABLE IF NOT EXISTS employee_user_map (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id         INTEGER NOT NULL,
    user_id             INTEGER NOT NULL,
    is_primary          INTEGER NOT NULL DEFAULT 1 CHECK(is_primary IN (0, 1)),
    access_level        TEXT NOT NULL DEFAULT 'full'
                        CHECK(access_level IN ('full', 'readonly', 'limited')),
    status              TEXT NOT NULL DEFAULT 'active'
                        CHECK(status IN ('active', 'inactive')),
    created_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user_account(id) ON DELETE CASCADE,
    UNIQUE(employee_id, user_id)
);
`;

export const CREATE_SITE_TABLE = `
CREATE TABLE IF NOT EXISTS site (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id          INTEGER NOT NULL,
    site_code           TEXT NOT NULL,
    name                TEXT NOT NULL,
    description         TEXT,
    address_line1       TEXT,
    address_line2       TEXT,
    city                TEXT,
    state               TEXT,
    country             TEXT,
    postal_code         TEXT,
    latitude            REAL,
    longitude           REAL,
    timezone            TEXT,
    status              TEXT NOT NULL DEFAULT 'active'
                        CHECK(status IN ('active', 'inactive', 'maintenance')),
    settings            TEXT DEFAULT '{}',
    created_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    UNIQUE(company_id, site_code)
);
`;

export const CREATE_SITE_ZONE_TABLE = `
CREATE TABLE IF NOT EXISTS site_zone (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id             INTEGER NOT NULL,
    zone_code           TEXT NOT NULL,
    name                TEXT NOT NULL,
    description         TEXT,
    zone_type           TEXT NOT NULL
                        CHECK(zone_type IN ('circle', 'polygon', 'digipin')),
    center_latitude     REAL,
    center_longitude    REAL,
    radius_meters       REAL,
    polygon_boundary    TEXT,
    digipin_code        TEXT,
    min_accuracy_meters REAL DEFAULT 50.0,
    priority            INTEGER NOT NULL DEFAULT 0,
    status              TEXT NOT NULL DEFAULT 'active'
                        CHECK(status IN ('active', 'inactive', 'testing')),
    is_primary          INTEGER NOT NULL DEFAULT 0 CHECK(is_primary IN (0, 1)),
    created_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (site_id) REFERENCES site(id) ON DELETE CASCADE,
    UNIQUE(site_id, zone_code)
);
`;

export const CREATE_EMPLOYEE_SITE_TABLE = `
CREATE TABLE IF NOT EXISTS employee_site (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id         INTEGER NOT NULL,
    site_id             INTEGER NOT NULL,
    is_primary          INTEGER NOT NULL DEFAULT 0 CHECK(is_primary IN (0, 1)),
    valid_from          INTEGER,
    valid_until         INTEGER,
    status              TEXT NOT NULL DEFAULT 'active'
                        CHECK(status IN ('active', 'inactive', 'pending')),
    access_restrictions TEXT DEFAULT '{}',
    created_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES site(id) ON DELETE CASCADE,
    UNIQUE(employee_id, site_id)
);
`;

export const CREATE_ATTENDANCE_DAY_TABLE = `
CREATE TABLE IF NOT EXISTS attendance_day (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id         INTEGER NOT NULL,
    site_id             INTEGER NOT NULL,
    attendance_date     INTEGER NOT NULL,
    first_in_time       INTEGER,
    last_out_time       INTEGER,
    total_work_seconds  INTEGER DEFAULT 0,
    total_break_seconds INTEGER DEFAULT 0,
    session_count       INTEGER DEFAULT 0,
    status              TEXT NOT NULL DEFAULT 'present'
                        CHECK(status IN ('present', 'absent', 'partial', 'holiday', 'leave', 'pending')),
    has_anomaly         INTEGER NOT NULL DEFAULT 0 CHECK(has_anomaly IN (0, 1)),
    anomaly_notes       TEXT,
    approval_status     TEXT DEFAULT 'auto_approved'
                        CHECK(approval_status IN ('pending', 'auto_approved', 'approved', 'rejected')),
    approved_by         INTEGER,
    approved_at         INTEGER,
    sync_status         TEXT NOT NULL DEFAULT 'synced'
                        CHECK(sync_status IN ('synced', 'pending', 'conflict')),
    last_synced_at      INTEGER,
    created_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES site(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES user_account(id) ON DELETE SET NULL,
    UNIQUE(employee_id, site_id, attendance_date)
);
`;

export const CREATE_ATTENDANCE_SESSION_TABLE = `
CREATE TABLE IF NOT EXISTS attendance_session (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    attendance_day_id   INTEGER NOT NULL,
    employee_id         INTEGER NOT NULL,
    session_number      INTEGER NOT NULL DEFAULT 1,
    in_time             INTEGER NOT NULL,
    in_zone_id          INTEGER,
    in_latitude         REAL NOT NULL,
    in_longitude        REAL NOT NULL,
    in_accuracy         REAL NOT NULL,
    in_method           TEXT NOT NULL DEFAULT 'gps'
                        CHECK(in_method IN ('gps', 'wifi', 'manual', 'qr', 'nfc', 'beacon')),
    out_time            INTEGER,
    out_zone_id         INTEGER,
    out_latitude        REAL,
    out_longitude       REAL,
    out_accuracy        REAL,
    out_method          TEXT
                        CHECK(out_method IN ('gps', 'wifi', 'manual', 'qr', 'nfc', 'beacon', 'auto')),
    duration_seconds    INTEGER,
    session_type        TEXT NOT NULL DEFAULT 'regular'
                        CHECK(session_type IN ('regular', 'overtime', 'break', 'offsite')),
    status              TEXT NOT NULL DEFAULT 'active'
                        CHECK(status IN ('active', 'completed', 'cancelled', 'auto_closed')),
    in_mock_gps_flag    INTEGER DEFAULT 0 CHECK(in_mock_gps_flag IN (0, 1)),
    out_mock_gps_flag   INTEGER DEFAULT 0 CHECK(out_mock_gps_flag IN (0, 1)),
    in_outside_zone     INTEGER DEFAULT 0 CHECK(in_outside_zone IN (0, 1)),
    out_outside_zone    INTEGER DEFAULT 0 CHECK(out_outside_zone IN (0, 1)),
    notes               TEXT,
    sync_status         TEXT NOT NULL DEFAULT 'synced'
                        CHECK(sync_status IN ('synced', 'pending', 'conflict')),
    created_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (attendance_day_id) REFERENCES attendance_day(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
    FOREIGN KEY (in_zone_id) REFERENCES site_zone(id) ON DELETE SET NULL,
    FOREIGN KEY (out_zone_id) REFERENCES site_zone(id) ON DELETE SET NULL
);
`;

export const CREATE_GEO_ATTENDANCE_LOG_TABLE = `
CREATE TABLE IF NOT EXISTS geo_attendance_log (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id          INTEGER,
    employee_id         INTEGER NOT NULL,
    site_id             INTEGER NOT NULL,
    zone_id             INTEGER,
    event_type          TEXT NOT NULL
                        CHECK(event_type IN ('check_in', 'check_out', 'location_update', 
                                             'zone_enter', 'zone_exit', 'anomaly_detected',
                                             'manual_override', 'auto_checkout')),
    event_timestamp     INTEGER NOT NULL,
    latitude            REAL NOT NULL,
    longitude           REAL NOT NULL,
    altitude            REAL,
    accuracy            REAL NOT NULL,
    heading             REAL,
    speed               REAL,
    gps_provider        TEXT,
    satellites_used     INTEGER,
    is_mock_location    INTEGER NOT NULL DEFAULT 0 CHECK(is_mock_location IN (0, 1)),
    is_vpn_detected     INTEGER NOT NULL DEFAULT 0 CHECK(is_vpn_detected IN (0, 1)),
    is_rooted_device    INTEGER NOT NULL DEFAULT 0 CHECK(is_rooted_device IN (0, 1)),
    device_id           INTEGER,
    device_fingerprint  TEXT,
    ip_address          TEXT,
    wifi_ssid           TEXT,
    wifi_bssid          TEXT,
    network_type        TEXT,
    app_version         TEXT,
    os_version          TEXT,
    battery_level       INTEGER,
    raw_location_data   TEXT,
    extra_metadata      TEXT DEFAULT '{}',
    created_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);
`;

export const CREATE_EMPLOYEE_DEVICE_TABLE = `
CREATE TABLE IF NOT EXISTS employee_device (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id         INTEGER NOT NULL,
    device_uuid         TEXT NOT NULL,
    device_fingerprint  TEXT,
    device_name         TEXT,
    device_model        TEXT,
    device_manufacturer TEXT,
    os_type             TEXT NOT NULL CHECK(os_type IN ('ios', 'android', 'other')),
    os_version          TEXT,
    app_version         TEXT,
    fcm_token           TEXT,
    apns_token          TEXT,
    status              TEXT NOT NULL DEFAULT 'active'
                        CHECK(status IN ('active', 'inactive', 'blocked', 'pending_approval')),
    is_primary          INTEGER NOT NULL DEFAULT 0 CHECK(is_primary IN (0, 1)),
    is_bound            INTEGER NOT NULL DEFAULT 0 CHECK(is_bound IN (0, 1)),
    bound_at            INTEGER,
    is_rooted_jailbroken INTEGER NOT NULL DEFAULT 0 CHECK(is_rooted_jailbroken IN (0, 1)),
    allows_mock_location INTEGER NOT NULL DEFAULT 0 CHECK(allows_mock_location IN (0, 1)),
    last_active_at      INTEGER,
    last_ip_address     TEXT,
    last_latitude       REAL,
    last_longitude      REAL,
    registered_at       INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    registered_ip       TEXT,
    created_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
    UNIQUE(employee_id, device_uuid)
);
`;

// ============================================================================
// INDEXES
// ============================================================================

export const CREATE_ALL_INDEXES = [
  // Tenant indexes
  'CREATE INDEX IF NOT EXISTS idx_tenant_code ON tenant(tenant_code);',
  'CREATE INDEX IF NOT EXISTS idx_tenant_status ON tenant(status);',
  
  // Company indexes
  'CREATE INDEX IF NOT EXISTS idx_company_tenant ON company(tenant_id);',
  'CREATE INDEX IF NOT EXISTS idx_company_code ON company(company_code);',
  'CREATE INDEX IF NOT EXISTS idx_company_status ON company(status);',
  
  // User Account indexes
  'CREATE INDEX IF NOT EXISTS idx_user_tenant ON user_account(tenant_id);',
  'CREATE INDEX IF NOT EXISTS idx_user_email ON user_account(email);',
  'CREATE INDEX IF NOT EXISTS idx_user_phone ON user_account(phone);',
  'CREATE INDEX IF NOT EXISTS idx_user_status ON user_account(status);',
  
  // Employee indexes
  'CREATE INDEX IF NOT EXISTS idx_employee_company ON employee(company_id);',
  'CREATE INDEX IF NOT EXISTS idx_employee_code ON employee(employee_code);',
  'CREATE INDEX IF NOT EXISTS idx_employee_external ON employee(external_id);',
  'CREATE INDEX IF NOT EXISTS idx_employee_status ON employee(status);',
  'CREATE INDEX IF NOT EXISTS idx_employee_name ON employee(first_name, last_name);',
  
  // Employee User Map indexes
  'CREATE INDEX IF NOT EXISTS idx_emp_user_employee ON employee_user_map(employee_id);',
  'CREATE INDEX IF NOT EXISTS idx_emp_user_user ON employee_user_map(user_id);',
  
  // Site indexes
  'CREATE INDEX IF NOT EXISTS idx_site_company ON site(company_id);',
  'CREATE INDEX IF NOT EXISTS idx_site_code ON site(site_code);',
  'CREATE INDEX IF NOT EXISTS idx_site_status ON site(status);',
  'CREATE INDEX IF NOT EXISTS idx_site_location ON site(latitude, longitude);',
  
  // Site Zone indexes
  'CREATE INDEX IF NOT EXISTS idx_zone_site ON site_zone(site_id);',
  'CREATE INDEX IF NOT EXISTS idx_zone_code ON site_zone(zone_code);',
  'CREATE INDEX IF NOT EXISTS idx_zone_type ON site_zone(zone_type);',
  'CREATE INDEX IF NOT EXISTS idx_zone_status ON site_zone(status);',
  'CREATE INDEX IF NOT EXISTS idx_zone_location ON site_zone(center_latitude, center_longitude);',
  'CREATE INDEX IF NOT EXISTS idx_zone_digipin ON site_zone(digipin_code);',
  
  // Employee Site indexes
  'CREATE INDEX IF NOT EXISTS idx_emp_site_employee ON employee_site(employee_id);',
  'CREATE INDEX IF NOT EXISTS idx_emp_site_site ON employee_site(site_id);',
  'CREATE INDEX IF NOT EXISTS idx_emp_site_status ON employee_site(status);',
  'CREATE INDEX IF NOT EXISTS idx_emp_site_validity ON employee_site(valid_from, valid_until);',
  
  // Attendance Day indexes
  'CREATE INDEX IF NOT EXISTS idx_att_day_employee ON attendance_day(employee_id);',
  'CREATE INDEX IF NOT EXISTS idx_att_day_site ON attendance_day(site_id);',
  'CREATE INDEX IF NOT EXISTS idx_att_day_date ON attendance_day(attendance_date);',
  'CREATE INDEX IF NOT EXISTS idx_att_day_status ON attendance_day(status);',
  'CREATE INDEX IF NOT EXISTS idx_att_day_sync ON attendance_day(sync_status);',
  'CREATE INDEX IF NOT EXISTS idx_att_day_emp_date ON attendance_day(employee_id, attendance_date);',
  'CREATE INDEX IF NOT EXISTS idx_att_day_recent ON attendance_day(attendance_date DESC);',
  
  // Attendance Session indexes
  'CREATE INDEX IF NOT EXISTS idx_att_session_day ON attendance_session(attendance_day_id);',
  'CREATE INDEX IF NOT EXISTS idx_att_session_employee ON attendance_session(employee_id);',
  'CREATE INDEX IF NOT EXISTS idx_att_session_in_time ON attendance_session(in_time);',
  'CREATE INDEX IF NOT EXISTS idx_att_session_status ON attendance_session(status);',
  'CREATE INDEX IF NOT EXISTS idx_att_session_sync ON attendance_session(sync_status);',
  'CREATE INDEX IF NOT EXISTS idx_session_mock ON attendance_session(in_mock_gps_flag, out_mock_gps_flag);',
  
  // Geo Attendance Log indexes
  'CREATE INDEX IF NOT EXISTS idx_geo_log_session ON geo_attendance_log(session_id);',
  'CREATE INDEX IF NOT EXISTS idx_geo_log_employee ON geo_attendance_log(employee_id);',
  'CREATE INDEX IF NOT EXISTS idx_geo_log_site ON geo_attendance_log(site_id);',
  'CREATE INDEX IF NOT EXISTS idx_geo_log_zone ON geo_attendance_log(zone_id);',
  'CREATE INDEX IF NOT EXISTS idx_geo_log_timestamp ON geo_attendance_log(event_timestamp);',
  'CREATE INDEX IF NOT EXISTS idx_geo_log_type ON geo_attendance_log(event_type);',
  'CREATE INDEX IF NOT EXISTS idx_geo_log_device ON geo_attendance_log(device_id);',
  'CREATE INDEX IF NOT EXISTS idx_geo_log_mock ON geo_attendance_log(is_mock_location);',
  'CREATE INDEX IF NOT EXISTS idx_geo_log_emp_time ON geo_attendance_log(employee_id, event_timestamp);',
  
  // Employee Device indexes
  'CREATE INDEX IF NOT EXISTS idx_device_employee ON employee_device(employee_id);',
  'CREATE INDEX IF NOT EXISTS idx_device_uuid ON employee_device(device_uuid);',
  'CREATE INDEX IF NOT EXISTS idx_device_status ON employee_device(status);',
  'CREATE INDEX IF NOT EXISTS idx_device_fingerprint ON employee_device(device_fingerprint);',
];

// ============================================================================
// TRIGGERS
// ============================================================================

export const CREATE_TRIGGERS = [
  // Update attendance_day summary when session is completed
  `CREATE TRIGGER IF NOT EXISTS trg_session_complete
   AFTER UPDATE ON attendance_session
   WHEN NEW.out_time IS NOT NULL AND OLD.out_time IS NULL
   BEGIN
       UPDATE attendance_day
       SET 
           last_out_time = NEW.out_time,
           total_work_seconds = total_work_seconds + NEW.duration_seconds,
           session_count = (
               SELECT COUNT(*) FROM attendance_session 
               WHERE attendance_day_id = NEW.attendance_day_id
           ),
           updated_at = strftime('%s', 'now')
       WHERE id = NEW.attendance_day_id;
   END;`,

  // Prevent updates to geo_attendance_log (immutable)
  `CREATE TRIGGER IF NOT EXISTS trg_geo_log_immutable
   BEFORE UPDATE ON geo_attendance_log
   BEGIN
       SELECT RAISE(ABORT, 'geo_attendance_log is immutable - updates not allowed');
   END;`,

  // Prevent deletes from geo_attendance_log (immutable)
  `CREATE TRIGGER IF NOT EXISTS trg_geo_log_no_delete
   BEFORE DELETE ON geo_attendance_log
   BEGIN
       SELECT RAISE(ABORT, 'geo_attendance_log is immutable - deletes not allowed');
   END;`,
];

// ============================================================================
// VIEWS
// ============================================================================

export const CREATE_VIEWS = [
  // View: Active employees with their primary site
  `CREATE VIEW IF NOT EXISTS v_employee_primary_site AS
   SELECT 
       e.id AS employee_id,
       e.company_id,
       e.employee_code,
       e.first_name,
       e.last_name,
       e.status AS employee_status,
       s.id AS site_id,
       s.name AS site_name,
       s.site_code
   FROM employee e
   LEFT JOIN employee_site es ON e.id = es.employee_id AND es.is_primary = 1 AND es.status = 'active'
   LEFT JOIN site s ON es.site_id = s.id
   WHERE e.status = 'active';`,

  // View: Attendance summary
  `CREATE VIEW IF NOT EXISTS v_attendance_summary AS
   SELECT 
       ad.id,
       ad.employee_id,
       e.employee_code,
       e.first_name,
       e.last_name,
       ad.site_id,
       s.name AS site_name,
       ad.attendance_date,
       ad.first_in_time,
       ad.last_out_time,
       ad.total_work_seconds,
       ad.session_count,
       ad.status,
       ad.has_anomaly,
       ad.approval_status
   FROM attendance_day ad
   JOIN employee e ON ad.employee_id = e.id
   JOIN site s ON ad.site_id = s.id;`,

  // View: Active sessions (employees currently checked in)
  `CREATE VIEW IF NOT EXISTS v_active_sessions AS
   SELECT 
       ase.id AS session_id,
       ase.employee_id,
       e.employee_code,
       e.first_name,
       e.last_name,
       ase.in_time,
       ase.in_zone_id,
       sz.name AS zone_name,
       s.id AS site_id,
       s.name AS site_name,
       ase.in_latitude,
       ase.in_longitude,
       (strftime('%s', 'now') - ase.in_time) AS duration_so_far
   FROM attendance_session ase
   JOIN employee e ON ase.employee_id = e.id
   JOIN attendance_day ad ON ase.attendance_day_id = ad.id
   JOIN site s ON ad.site_id = s.id
   LEFT JOIN site_zone sz ON ase.in_zone_id = sz.id
   WHERE ase.status = 'active' AND ase.out_time IS NULL;`,
];

// ============================================================================
// ALL CREATE STATEMENTS IN ORDER
// ============================================================================

export const ALL_CREATE_TABLES = [
  CREATE_TENANT_TABLE,
  CREATE_COMPANY_TABLE,
  CREATE_USER_ACCOUNT_TABLE,
  CREATE_EMPLOYEE_TABLE,
  CREATE_EMPLOYEE_USER_MAP_TABLE,
  CREATE_SITE_TABLE,
  CREATE_SITE_ZONE_TABLE,
  CREATE_EMPLOYEE_SITE_TABLE,
  CREATE_ATTENDANCE_DAY_TABLE,
  CREATE_ATTENDANCE_SESSION_TABLE,
  CREATE_GEO_ATTENDANCE_LOG_TABLE,
  CREATE_EMPLOYEE_DEVICE_TABLE,
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get current date as YYYYMMDD integer for attendance_date field
 */
export function getDateAsInteger(date: Date = new Date()): number {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return parseInt(`${year}${month}${day}`, 10);
}

/**
 * Convert YYYYMMDD integer back to Date object
 */
export function integerToDate(dateInt: number): Date {
  const str = dateInt.toString();
  const year = parseInt(str.substring(0, 4), 10);
  const month = parseInt(str.substring(4, 6), 10) - 1;
  const day = parseInt(str.substring(6, 8), 10);
  return new Date(year, month, day);
}

/**
 * Get current Unix timestamp in seconds
 */
export function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Calculate Haversine distance between two points in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Check if a point is inside a circle zone
 */
export function isPointInCircle(
  pointLat: number,
  pointLon: number,
  centerLat: number,
  centerLon: number,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(pointLat, pointLon, centerLat, centerLon);
  return distance <= radiusMeters;
}

/**
 * Check if a point is inside a polygon zone
 * Uses ray casting algorithm
 */
export function isPointInPolygon(
  pointLat: number,
  pointLon: number,
  polygon: Array<{ lat: number; lng: number }>
): boolean {
  let inside = false;
  const n = polygon.length;
  
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].lat;
    const yi = polygon[i].lng;
    const xj = polygon[j].lat;
    const yj = polygon[j].lng;
    
    const intersect =
      yi > pointLon !== yj > pointLon &&
      pointLat < ((xj - xi) * (pointLon - yi)) / (yj - yi) + xi;
    
    if (intersect) inside = !inside;
  }
  
  return inside;
}
