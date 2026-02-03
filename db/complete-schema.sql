-- ============================================================================
-- GEO-FENCING ATTENDANCE SYSTEM - COMPLETE DATABASE SCHEMA
-- ============================================================================
-- Version: 1.0.0
-- Database: SQLite
-- Architecture: Multi-tenant SaaS
-- Purpose: Attendance engine (NOT HR system) with geo-fencing capabilities
-- ============================================================================

-- Enable foreign key enforcement (MUST be run for each connection)
PRAGMA foreign_keys = ON;

-- ============================================================================
-- ENTITY RELATIONSHIP OVERVIEW
-- ============================================================================
-- 
-- HIERARCHY:
--   Tenant (1) ─────────────────┬─── (N) Company
--                               │
--   Company (1) ────────────────┬─── (N) Site
--                               │
--                               └─── (N) Employee
--
--   Site (1) ───────────────────┬─── (N) Zone (geo-fencing boundaries)
--
-- MANY-TO-MANY RELATIONSHIPS:
--   Employee (N) ◄─────────────► (M) Site      (via employee_site)
--   Employee (N) ◄─────────────► (M) UserAccount (via employee_user_map)
--
-- ATTENDANCE FLOW:
--   Employee → AttendanceDay → AttendanceSession(s) → GeoAttendanceLog(s)
--
-- ============================================================================


-- ============================================================================
-- TABLE 1: TENANT
-- ============================================================================
-- Root entity representing a global organization subscribing to the SaaS.
-- One tenant can have multiple companies (subsidiaries, divisions, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Unique identifier for API/external references
    tenant_code         TEXT NOT NULL UNIQUE,
    
    -- Display name
    name                TEXT NOT NULL,
    
    -- Subscription status
    status              TEXT NOT NULL DEFAULT 'active' 
                        CHECK(status IN ('active', 'suspended', 'trial', 'cancelled')),
    
    -- Subscription tier for feature gating
    subscription_tier   TEXT NOT NULL DEFAULT 'basic'
                        CHECK(subscription_tier IN ('basic', 'standard', 'premium', 'enterprise')),
    
    -- Configuration (JSON) - timezone, locale, feature flags
    settings            TEXT DEFAULT '{}',
    
    -- Audit timestamps (Unix epoch seconds)
    created_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Index for tenant lookup by code (API access)
CREATE INDEX IF NOT EXISTS idx_tenant_code ON tenant(tenant_code);
CREATE INDEX IF NOT EXISTS idx_tenant_status ON tenant(status);


-- ============================================================================
-- TABLE 2: COMPANY
-- ============================================================================
-- A company within a tenant. Represents a legal entity or business unit.
-- Employees and sites belong to a company.
-- ============================================================================
CREATE TABLE IF NOT EXISTS company (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Parent tenant
    tenant_id           INTEGER NOT NULL,
    
    -- Unique code within tenant for API references
    company_code        TEXT NOT NULL,
    
    -- Display name
    name                TEXT NOT NULL,
    
    -- Company status
    status              TEXT NOT NULL DEFAULT 'active'
                        CHECK(status IN ('active', 'inactive', 'suspended')),
    
    -- Default timezone for this company (IANA format)
    timezone            TEXT NOT NULL DEFAULT 'UTC',
    
    -- Configuration (JSON) - working hours, attendance rules
    settings            TEXT DEFAULT '{}',
    
    -- Audit timestamps
    created_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    
    -- Foreign key constraint
    FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE CASCADE,
    
    -- Unique company code per tenant
    UNIQUE(tenant_id, company_code)
);

-- Indexes for company queries
CREATE INDEX IF NOT EXISTS idx_company_tenant ON company(tenant_id);
CREATE INDEX IF NOT EXISTS idx_company_code ON company(company_code);
CREATE INDEX IF NOT EXISTS idx_company_status ON company(status);


-- ============================================================================
-- TABLE 3: USER_ACCOUNT
-- ============================================================================
-- Authentication and login accounts. Separate from employee to allow:
-- - One user managing multiple employees (admin scenarios)
-- - Service accounts without employee association
-- - Clean separation of auth from business logic
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_account (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Parent tenant (for data isolation)
    tenant_id           INTEGER NOT NULL,
    
    -- Login credentials
    email               TEXT NOT NULL,
    phone               TEXT,
    password_hash       TEXT NOT NULL,
    
    -- Account status
    status              TEXT NOT NULL DEFAULT 'active'
                        CHECK(status IN ('active', 'inactive', 'locked', 'pending_verification')),
    
    -- Role for basic access control
    role                TEXT NOT NULL DEFAULT 'employee'
                        CHECK(role IN ('super_admin', 'tenant_admin', 'company_admin', 'site_admin', 'employee')),
    
    -- Email/phone verification
    email_verified      INTEGER NOT NULL DEFAULT 0 CHECK(email_verified IN (0, 1)),
    phone_verified      INTEGER NOT NULL DEFAULT 0 CHECK(phone_verified IN (0, 1)),
    
    -- Security: last login tracking
    last_login_at       INTEGER,
    last_login_ip       TEXT,
    failed_login_count  INTEGER NOT NULL DEFAULT 0,
    locked_until        INTEGER,
    
    -- Token management (for password reset, etc.)
    reset_token         TEXT,
    reset_token_expires INTEGER,
    
    -- Audit timestamps
    created_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    
    -- Foreign key
    FOREIGN KEY (tenant_id) REFERENCES tenant(id) ON DELETE CASCADE,
    
    -- Unique email per tenant
    UNIQUE(tenant_id, email)
);

-- Indexes for authentication queries
CREATE INDEX IF NOT EXISTS idx_user_tenant ON user_account(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_email ON user_account(email);
CREATE INDEX IF NOT EXISTS idx_user_phone ON user_account(phone);
CREATE INDEX IF NOT EXISTS idx_user_status ON user_account(status);


-- ============================================================================
-- TABLE 4: EMPLOYEE
-- ============================================================================
-- Lightweight employee identity for attendance tracking.
-- NOT an HR record - only essential fields for attendance operations.
-- Full employee data lives in external HR systems.
-- ============================================================================
CREATE TABLE IF NOT EXISTS employee (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Parent company
    company_id          INTEGER NOT NULL,
    
    -- External reference ID (from HR system)
    external_id         TEXT,
    
    -- Employee code (badge number, etc.)
    employee_code       TEXT NOT NULL,
    
    -- Basic identity (display purposes only)
    first_name          TEXT NOT NULL,
    last_name           TEXT,
    display_name        TEXT,
    
    -- Contact (for notifications)
    email               TEXT,
    phone               TEXT,
    
    -- Employment status
    status              TEXT NOT NULL DEFAULT 'active'
                        CHECK(status IN ('active', 'inactive', 'on_leave', 'terminated')),
    
    -- Attendance settings (JSON) - shift type, flex hours, etc.
    attendance_settings TEXT DEFAULT '{}',
    
    -- Audit timestamps
    created_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    
    -- Foreign key
    FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    
    -- Unique employee code per company
    UNIQUE(company_id, employee_code)
);

-- Indexes for employee queries
CREATE INDEX IF NOT EXISTS idx_employee_company ON employee(company_id);
CREATE INDEX IF NOT EXISTS idx_employee_code ON employee(employee_code);
CREATE INDEX IF NOT EXISTS idx_employee_external ON employee(external_id);
CREATE INDEX IF NOT EXISTS idx_employee_status ON employee(status);


-- ============================================================================
-- TABLE 5: EMPLOYEE_USER_MAP
-- ============================================================================
-- Maps employees to user accounts.
-- Supports:
-- - One user logging in as multiple employees
-- - One employee having multiple user accounts (rare but possible)
-- ============================================================================
CREATE TABLE IF NOT EXISTS employee_user_map (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- The employee
    employee_id         INTEGER NOT NULL,
    
    -- The user account
    user_id             INTEGER NOT NULL,
    
    -- Is this the primary mapping for the user?
    is_primary          INTEGER NOT NULL DEFAULT 1 CHECK(is_primary IN (0, 1)),
    
    -- Access level for this specific mapping
    access_level        TEXT NOT NULL DEFAULT 'full'
                        CHECK(access_level IN ('full', 'readonly', 'limited')),
    
    -- Status
    status              TEXT NOT NULL DEFAULT 'active'
                        CHECK(status IN ('active', 'inactive')),
    
    -- Audit timestamps
    created_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    
    -- Foreign keys
    FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user_account(id) ON DELETE CASCADE,
    
    -- Prevent duplicate mappings
    UNIQUE(employee_id, user_id)
);

-- Indexes for mapping lookups
CREATE INDEX IF NOT EXISTS idx_emp_user_employee ON employee_user_map(employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_user_user ON employee_user_map(user_id);


-- ============================================================================
-- TABLE 6: SITE
-- ============================================================================
-- Physical location where attendance is tracked.
-- A site has a general location and contains multiple geo-fencing zones.
-- ============================================================================
CREATE TABLE IF NOT EXISTS site (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Parent company
    company_id          INTEGER NOT NULL,
    
    -- Unique code for API references
    site_code           TEXT NOT NULL,
    
    -- Display name
    name                TEXT NOT NULL,
    
    -- Site description
    description         TEXT,
    
    -- Address information
    address_line1       TEXT,
    address_line2       TEXT,
    city                TEXT,
    state               TEXT,
    country             TEXT,
    postal_code         TEXT,
    
    -- Central coordinates (for map display)
    latitude            REAL,
    longitude           REAL,
    
    -- Site timezone (can override company default)
    timezone            TEXT,
    
    -- Site status
    status              TEXT NOT NULL DEFAULT 'active'
                        CHECK(status IN ('active', 'inactive', 'maintenance')),
    
    -- Configuration (JSON) - operating hours, site-specific rules
    settings            TEXT DEFAULT '{}',
    
    -- Audit timestamps
    created_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    
    -- Foreign key
    FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
    
    -- Unique site code per company
    UNIQUE(company_id, site_code)
);

-- Indexes for site queries
CREATE INDEX IF NOT EXISTS idx_site_company ON site(company_id);
CREATE INDEX IF NOT EXISTS idx_site_code ON site(site_code);
CREATE INDEX IF NOT EXISTS idx_site_status ON site(status);
CREATE INDEX IF NOT EXISTS idx_site_location ON site(latitude, longitude);


-- ============================================================================
-- TABLE 7: SITE_ZONE
-- ============================================================================
-- Geo-fencing zones within a site.
-- Supports three types of boundaries:
--   1. CIRCLE: Center point (lat/long) + radius in meters
--   2. POLYGON: Array of lat/long points forming a closed shape
--   3. DIGIPIN: India's digital addressing system code
-- ============================================================================
CREATE TABLE IF NOT EXISTS site_zone (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Parent site
    site_id             INTEGER NOT NULL,
    
    -- Unique code for API references
    zone_code           TEXT NOT NULL,
    
    -- Display name (e.g., "Main Entrance", "Building A", "Parking Lot")
    name                TEXT NOT NULL,
    
    -- Zone description
    description         TEXT,
    
    -- Geo-fencing type
    zone_type           TEXT NOT NULL
                        CHECK(zone_type IN ('circle', 'polygon', 'digipin')),
    
    -- For CIRCLE type: center coordinates
    center_latitude     REAL,
    center_longitude    REAL,
    
    -- For CIRCLE type: radius in meters
    radius_meters       REAL,
    
    -- For POLYGON type: JSON array of {lat, lng} points
    -- Example: [{"lat":28.6139,"lng":77.2090},{"lat":28.6140,"lng":77.2091},...]
    polygon_boundary    TEXT,
    
    -- For DIGIPIN type: the DigiPin code
    digipin_code        TEXT,
    
    -- Minimum accuracy required for this zone (in meters)
    -- GPS readings less accurate than this will be flagged
    min_accuracy_meters REAL DEFAULT 50.0,
    
    -- Zone priority (for overlapping zones)
    priority            INTEGER NOT NULL DEFAULT 0,
    
    -- Zone status
    status              TEXT NOT NULL DEFAULT 'active'
                        CHECK(status IN ('active', 'inactive', 'testing')),
    
    -- Is this the primary check-in zone for the site?
    is_primary          INTEGER NOT NULL DEFAULT 0 CHECK(is_primary IN (0, 1)),
    
    -- Audit timestamps
    created_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    
    -- Foreign key
    FOREIGN KEY (site_id) REFERENCES site(id) ON DELETE CASCADE,
    
    -- Unique zone code per site
    UNIQUE(site_id, zone_code)
);

-- Indexes for zone queries
CREATE INDEX IF NOT EXISTS idx_zone_site ON site_zone(site_id);
CREATE INDEX IF NOT EXISTS idx_zone_code ON site_zone(zone_code);
CREATE INDEX IF NOT EXISTS idx_zone_type ON site_zone(zone_type);
CREATE INDEX IF NOT EXISTS idx_zone_status ON site_zone(status);
CREATE INDEX IF NOT EXISTS idx_zone_location ON site_zone(center_latitude, center_longitude);
CREATE INDEX IF NOT EXISTS idx_zone_digipin ON site_zone(digipin_code);


-- ============================================================================
-- TABLE 8: EMPLOYEE_SITE
-- ============================================================================
-- Many-to-many mapping between employees and sites.
-- An employee can be assigned to multiple sites.
-- A site can have multiple employees.
-- ============================================================================
CREATE TABLE IF NOT EXISTS employee_site (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- The employee
    employee_id         INTEGER NOT NULL,
    
    -- The site they can access
    site_id             INTEGER NOT NULL,
    
    -- Is this the employee's primary/home site?
    is_primary          INTEGER NOT NULL DEFAULT 0 CHECK(is_primary IN (0, 1)),
    
    -- Assignment validity period (optional)
    valid_from          INTEGER,
    valid_until         INTEGER,
    
    -- Assignment status
    status              TEXT NOT NULL DEFAULT 'active'
                        CHECK(status IN ('active', 'inactive', 'pending')),
    
    -- Access restrictions (JSON) - specific zones, time windows
    access_restrictions TEXT DEFAULT '{}',
    
    -- Audit timestamps
    created_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    
    -- Foreign keys
    FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES site(id) ON DELETE CASCADE,
    
    -- Prevent duplicate assignments
    UNIQUE(employee_id, site_id)
);

-- Indexes for mapping lookups
CREATE INDEX IF NOT EXISTS idx_emp_site_employee ON employee_site(employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_site_site ON employee_site(site_id);
CREATE INDEX IF NOT EXISTS idx_emp_site_status ON employee_site(status);
CREATE INDEX IF NOT EXISTS idx_emp_site_validity ON employee_site(valid_from, valid_until);


-- ============================================================================
-- TABLE 9: ATTENDANCE_DAY
-- ============================================================================
-- Daily attendance summary for an employee.
-- One record per employee per day per site.
-- Aggregates all sessions for easy reporting.
-- ============================================================================
CREATE TABLE IF NOT EXISTS attendance_day (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- The employee
    employee_id         INTEGER NOT NULL,
    
    -- The site (attendance is site-specific)
    site_id             INTEGER NOT NULL,
    
    -- Date (stored as YYYYMMDD integer for efficient queries)
    attendance_date     INTEGER NOT NULL,
    
    -- Summary timestamps (Unix epoch)
    first_in_time       INTEGER,
    last_out_time       INTEGER,
    
    -- Calculated duration (seconds)
    total_work_seconds  INTEGER DEFAULT 0,
    total_break_seconds INTEGER DEFAULT 0,
    
    -- Session count
    session_count       INTEGER DEFAULT 0,
    
    -- Status flags
    status              TEXT NOT NULL DEFAULT 'present'
                        CHECK(status IN ('present', 'absent', 'partial', 'holiday', 'leave', 'pending')),
    
    -- Flags for anomalies
    has_anomaly         INTEGER NOT NULL DEFAULT 0 CHECK(has_anomaly IN (0, 1)),
    anomaly_notes       TEXT,
    
    -- Manager approval
    approval_status     TEXT DEFAULT 'auto_approved'
                        CHECK(approval_status IN ('pending', 'auto_approved', 'approved', 'rejected')),
    approved_by         INTEGER,
    approved_at         INTEGER,
    
    -- Sync status (for mobile offline support)
    sync_status         TEXT NOT NULL DEFAULT 'synced'
                        CHECK(sync_status IN ('synced', 'pending', 'conflict')),
    last_synced_at      INTEGER,
    
    -- Audit timestamps
    created_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    
    -- Foreign keys
    FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
    FOREIGN KEY (site_id) REFERENCES site(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES user_account(id) ON DELETE SET NULL,
    
    -- One record per employee per day per site
    UNIQUE(employee_id, site_id, attendance_date)
);

-- Indexes for attendance queries
CREATE INDEX IF NOT EXISTS idx_att_day_employee ON attendance_day(employee_id);
CREATE INDEX IF NOT EXISTS idx_att_day_site ON attendance_day(site_id);
CREATE INDEX IF NOT EXISTS idx_att_day_date ON attendance_day(attendance_date);
CREATE INDEX IF NOT EXISTS idx_att_day_status ON attendance_day(status);
CREATE INDEX IF NOT EXISTS idx_att_day_sync ON attendance_day(sync_status);
CREATE INDEX IF NOT EXISTS idx_att_day_emp_date ON attendance_day(employee_id, attendance_date);


-- ============================================================================
-- TABLE 10: ATTENDANCE_SESSION
-- ============================================================================
-- Individual IN/OUT session within a day.
-- Supports multiple sessions per day (lunch breaks, multiple shifts, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS attendance_session (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Parent day record
    attendance_day_id   INTEGER NOT NULL,
    
    -- The employee (denormalized for query efficiency)
    employee_id         INTEGER NOT NULL,
    
    -- Session sequence number within the day
    session_number      INTEGER NOT NULL DEFAULT 1,
    
    -- IN event
    in_time             INTEGER NOT NULL,
    in_zone_id          INTEGER,
    in_latitude         REAL NOT NULL,
    in_longitude        REAL NOT NULL,
    in_accuracy         REAL NOT NULL,
    in_method           TEXT NOT NULL DEFAULT 'gps'
                        CHECK(in_method IN ('gps', 'wifi', 'manual', 'qr', 'nfc', 'beacon')),
    
    -- OUT event (null until checked out)
    out_time            INTEGER,
    out_zone_id         INTEGER,
    out_latitude        REAL,
    out_longitude       REAL,
    out_accuracy        REAL,
    out_method          TEXT
                        CHECK(out_method IN ('gps', 'wifi', 'manual', 'qr', 'nfc', 'beacon', 'auto')),
    
    -- Duration (calculated on check-out, in seconds)
    duration_seconds    INTEGER,
    
    -- Session type
    session_type        TEXT NOT NULL DEFAULT 'regular'
                        CHECK(session_type IN ('regular', 'overtime', 'break', 'offsite')),
    
    -- Status
    status              TEXT NOT NULL DEFAULT 'active'
                        CHECK(status IN ('active', 'completed', 'cancelled', 'auto_closed')),
    
    -- Anomaly flags
    in_mock_gps_flag    INTEGER DEFAULT 0 CHECK(in_mock_gps_flag IN (0, 1)),
    out_mock_gps_flag   INTEGER DEFAULT 0 CHECK(out_mock_gps_flag IN (0, 1)),
    in_outside_zone     INTEGER DEFAULT 0 CHECK(in_outside_zone IN (0, 1)),
    out_outside_zone    INTEGER DEFAULT 0 CHECK(out_outside_zone IN (0, 1)),
    
    -- Notes
    notes               TEXT,
    
    -- Sync status (for mobile offline support)
    sync_status         TEXT NOT NULL DEFAULT 'synced'
                        CHECK(sync_status IN ('synced', 'pending', 'conflict')),
    
    -- Audit timestamps
    created_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    
    -- Foreign keys
    FOREIGN KEY (attendance_day_id) REFERENCES attendance_day(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
    FOREIGN KEY (in_zone_id) REFERENCES site_zone(id) ON DELETE SET NULL,
    FOREIGN KEY (out_zone_id) REFERENCES site_zone(id) ON DELETE SET NULL
);

-- Indexes for session queries
CREATE INDEX IF NOT EXISTS idx_att_session_day ON attendance_session(attendance_day_id);
CREATE INDEX IF NOT EXISTS idx_att_session_employee ON attendance_session(employee_id);
CREATE INDEX IF NOT EXISTS idx_att_session_in_time ON attendance_session(in_time);
CREATE INDEX IF NOT EXISTS idx_att_session_status ON attendance_session(status);
CREATE INDEX IF NOT EXISTS idx_att_session_sync ON attendance_session(sync_status);


-- ============================================================================
-- TABLE 11: GEO_ATTENDANCE_LOG
-- ============================================================================
-- Immutable audit log for all geo-attendance events.
-- This table is APPEND-ONLY - no updates or deletes.
-- Provides complete audit trail for compliance and dispute resolution.
-- ============================================================================
CREATE TABLE IF NOT EXISTS geo_attendance_log (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- Reference to session (optional - log can exist without session)
    session_id          INTEGER,
    
    -- The employee
    employee_id         INTEGER NOT NULL,
    
    -- The site
    site_id             INTEGER NOT NULL,
    
    -- The zone where event occurred (if determined)
    zone_id             INTEGER,
    
    -- Event type
    event_type          TEXT NOT NULL
                        CHECK(event_type IN ('check_in', 'check_out', 'location_update', 
                                             'zone_enter', 'zone_exit', 'anomaly_detected',
                                             'manual_override', 'auto_checkout')),
    
    -- Precise timestamp (Unix epoch with milliseconds stored as INTEGER)
    event_timestamp     INTEGER NOT NULL,
    
    -- GPS data
    latitude            REAL NOT NULL,
    longitude           REAL NOT NULL,
    altitude            REAL,
    accuracy            REAL NOT NULL,
    heading             REAL,
    speed               REAL,
    
    -- GPS quality indicators
    gps_provider        TEXT,  -- 'gps', 'network', 'fused'
    satellites_used     INTEGER,
    
    -- Security flags
    is_mock_location    INTEGER NOT NULL DEFAULT 0 CHECK(is_mock_location IN (0, 1)),
    is_vpn_detected     INTEGER NOT NULL DEFAULT 0 CHECK(is_vpn_detected IN (0, 1)),
    is_rooted_device    INTEGER NOT NULL DEFAULT 0 CHECK(is_rooted_device IN (0, 1)),
    
    -- Device information
    device_id           INTEGER,
    device_fingerprint  TEXT,
    
    -- Network information
    ip_address          TEXT,
    wifi_ssid           TEXT,
    wifi_bssid          TEXT,
    network_type        TEXT,  -- 'wifi', '4g', '5g', 'ethernet'
    
    -- App information
    app_version         TEXT,
    os_version          TEXT,
    
    -- Battery level at time of event (for anomaly detection)
    battery_level       INTEGER,
    
    -- Additional context (JSON)
    raw_location_data   TEXT,
    extra_metadata      TEXT DEFAULT '{}',
    
    -- Log creation timestamp (immutable)
    created_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    
    -- Note: NO updated_at - this table is append-only
    -- Note: Soft foreign keys (no CASCADE) to preserve audit integrity
);

-- Indexes for log queries (optimized for audit and reporting)
CREATE INDEX IF NOT EXISTS idx_geo_log_session ON geo_attendance_log(session_id);
CREATE INDEX IF NOT EXISTS idx_geo_log_employee ON geo_attendance_log(employee_id);
CREATE INDEX IF NOT EXISTS idx_geo_log_site ON geo_attendance_log(site_id);
CREATE INDEX IF NOT EXISTS idx_geo_log_zone ON geo_attendance_log(zone_id);
CREATE INDEX IF NOT EXISTS idx_geo_log_timestamp ON geo_attendance_log(event_timestamp);
CREATE INDEX IF NOT EXISTS idx_geo_log_type ON geo_attendance_log(event_type);
CREATE INDEX IF NOT EXISTS idx_geo_log_device ON geo_attendance_log(device_id);
CREATE INDEX IF NOT EXISTS idx_geo_log_mock ON geo_attendance_log(is_mock_location);
CREATE INDEX IF NOT EXISTS idx_geo_log_emp_time ON geo_attendance_log(employee_id, event_timestamp);


-- ============================================================================
-- TABLE 12: EMPLOYEE_DEVICE
-- ============================================================================
-- Registered mobile devices for employees.
-- Supports device binding for security.
-- One employee can have multiple devices (primary phone, backup, tablet).
-- ============================================================================
CREATE TABLE IF NOT EXISTS employee_device (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    
    -- The employee
    employee_id         INTEGER NOT NULL,
    
    -- Device identification
    device_uuid         TEXT NOT NULL,  -- Unique device identifier
    device_fingerprint  TEXT,           -- Hardware fingerprint for validation
    
    -- Device details
    device_name         TEXT,           -- User-friendly name
    device_model        TEXT,           -- e.g., "iPhone 14 Pro", "Samsung Galaxy S23"
    device_manufacturer TEXT,           -- e.g., "Apple", "Samsung"
    os_type             TEXT NOT NULL CHECK(os_type IN ('ios', 'android', 'other')),
    os_version          TEXT,
    
    -- App details
    app_version         TEXT,
    fcm_token           TEXT,           -- Firebase Cloud Messaging token for push notifications
    apns_token          TEXT,           -- Apple Push Notification Service token
    
    -- Device status
    status              TEXT NOT NULL DEFAULT 'active'
                        CHECK(status IN ('active', 'inactive', 'blocked', 'pending_approval')),
    
    -- Is this the primary device?
    is_primary          INTEGER NOT NULL DEFAULT 0 CHECK(is_primary IN (0, 1)),
    
    -- Device binding settings
    is_bound            INTEGER NOT NULL DEFAULT 0 CHECK(is_bound IN (0, 1)),
    bound_at            INTEGER,
    
    -- Security flags
    is_rooted_jailbroken INTEGER NOT NULL DEFAULT 0 CHECK(is_rooted_jailbroken IN (0, 1)),
    allows_mock_location INTEGER NOT NULL DEFAULT 0 CHECK(allows_mock_location IN (0, 1)),
    
    -- Last activity tracking
    last_active_at      INTEGER,
    last_ip_address     TEXT,
    last_latitude       REAL,
    last_longitude      REAL,
    
    -- Registration info
    registered_at       INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    registered_ip       TEXT,
    
    -- Audit timestamps
    created_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at          INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    
    -- Foreign key
    FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
    
    -- One device UUID per employee
    UNIQUE(employee_id, device_uuid)
);

-- Indexes for device queries
CREATE INDEX IF NOT EXISTS idx_device_employee ON employee_device(employee_id);
CREATE INDEX IF NOT EXISTS idx_device_uuid ON employee_device(device_uuid);
CREATE INDEX IF NOT EXISTS idx_device_status ON employee_device(status);
CREATE INDEX IF NOT EXISTS idx_device_fingerprint ON employee_device(device_fingerprint);


-- ============================================================================
-- ADDITIONAL UTILITY INDEXES FOR COMMON QUERY PATTERNS
-- ============================================================================

-- Tenant-wide employee search
CREATE INDEX IF NOT EXISTS idx_employee_name ON employee(first_name, last_name);

-- Quick lookup of active employees at a site
CREATE INDEX IF NOT EXISTS idx_emp_site_active ON employee_site(site_id, status) 
    WHERE status = 'active';

-- Recent attendance lookups
CREATE INDEX IF NOT EXISTS idx_att_day_recent ON attendance_day(attendance_date DESC);

-- Mock GPS detection queries
CREATE INDEX IF NOT EXISTS idx_session_mock ON attendance_session(in_mock_gps_flag, out_mock_gps_flag);


-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Active employees with their primary site
CREATE VIEW IF NOT EXISTS v_employee_primary_site AS
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
WHERE e.status = 'active';


-- View: Today's attendance summary (requires date parameter in query)
CREATE VIEW IF NOT EXISTS v_attendance_summary AS
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
JOIN site s ON ad.site_id = s.id;


-- View: Active sessions (employees currently checked in)
CREATE VIEW IF NOT EXISTS v_active_sessions AS
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
WHERE ase.status = 'active' AND ase.out_time IS NULL;


-- ============================================================================
-- TRIGGERS FOR DATA INTEGRITY
-- ============================================================================

-- Trigger: Update attendance_day summary when session is completed
CREATE TRIGGER IF NOT EXISTS trg_session_complete
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
END;


-- Trigger: Update updated_at timestamp on employee changes
CREATE TRIGGER IF NOT EXISTS trg_employee_updated
AFTER UPDATE ON employee
BEGIN
    UPDATE employee SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
END;


-- Trigger: Update updated_at timestamp on site changes
CREATE TRIGGER IF NOT EXISTS trg_site_updated
AFTER UPDATE ON site
BEGIN
    UPDATE site SET updated_at = strftime('%s', 'now') WHERE id = NEW.id;
END;


-- Trigger: Prevent updates to geo_attendance_log (immutable audit log)
CREATE TRIGGER IF NOT EXISTS trg_geo_log_immutable
BEFORE UPDATE ON geo_attendance_log
BEGIN
    SELECT RAISE(ABORT, 'geo_attendance_log is immutable - updates not allowed');
END;


-- Trigger: Prevent deletes from geo_attendance_log (immutable audit log)
CREATE TRIGGER IF NOT EXISTS trg_geo_log_no_delete
BEFORE DELETE ON geo_attendance_log
BEGIN
    SELECT RAISE(ABORT, 'geo_attendance_log is immutable - deletes not allowed');
END;


-- ============================================================================
-- SAMPLE DATA FOR TESTING (OPTIONAL)
-- ============================================================================
-- Uncomment to insert sample data

/*
-- Insert sample tenant
INSERT INTO tenant (tenant_code, name, status, subscription_tier) 
VALUES ('DEMO001', 'Demo Corporation', 'active', 'premium');

-- Insert sample company
INSERT INTO company (tenant_id, company_code, name, timezone) 
VALUES (1, 'DEMO-HQ', 'Demo Headquarters', 'Asia/Kolkata');

-- Insert sample site
INSERT INTO site (company_id, site_code, name, latitude, longitude, timezone)
VALUES (1, 'SITE001', 'Main Office', 28.6139, 77.2090, 'Asia/Kolkata');

-- Insert sample zone (circle)
INSERT INTO site_zone (site_id, zone_code, name, zone_type, center_latitude, center_longitude, radius_meters, is_primary)
VALUES (1, 'ZONE001', 'Main Entrance', 'circle', 28.6139, 77.2090, 100.0, 1);

-- Insert sample zone (polygon)
INSERT INTO site_zone (site_id, zone_code, name, zone_type, polygon_boundary)
VALUES (1, 'ZONE002', 'Parking Area', 'polygon', 
    '[{"lat":28.6140,"lng":77.2085},{"lat":28.6145,"lng":77.2095},{"lat":28.6138,"lng":77.2098},{"lat":28.6135,"lng":77.2088}]');

-- Insert sample zone (digipin)
INSERT INTO site_zone (site_id, zone_code, name, zone_type, digipin_code)
VALUES (1, 'ZONE003', 'Warehouse', 'digipin', '7J9W-CC56-X8PM');
*/


-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
