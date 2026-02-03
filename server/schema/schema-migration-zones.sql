-- Migration: Attendance zones, employee zone assignments, role_mobile
-- Run after schema.sql. Safe to run multiple times (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS via procedure).

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Attendance zone within a site (circle = lat/long + radius; polygon = lat/long points; digipin = pin code)
CREATE TABLE IF NOT EXISTS site_zone (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  site_id INT UNSIGNED NOT NULL,
  zone_code VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description VARCHAR(512) DEFAULT NULL,
  zone_type VARCHAR(32) NOT NULL DEFAULT 'circle' COMMENT 'circle, polygon, digipin',
  center_latitude DOUBLE DEFAULT NULL,
  center_longitude DOUBLE DEFAULT NULL,
  radius_meters INT UNSIGNED DEFAULT NULL,
  polygon_boundary JSON DEFAULT NULL COMMENT 'Array of {latitude, longitude}',
  digipin_code VARCHAR(64) DEFAULT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  created_at INT UNSIGNED NOT NULL DEFAULT (UNIX_TIMESTAMP()),
  updated_at INT UNSIGNED NOT NULL DEFAULT (UNIX_TIMESTAMP()),
  PRIMARY KEY (id),
  UNIQUE KEY uq_site_zone (site_id, zone_code),
  FOREIGN KEY (site_id) REFERENCES site(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Employee can have multiple zones or "no location" (attendance not tied to location)
CREATE TABLE IF NOT EXISTS employee_zone_assignment (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  employee_id INT UNSIGNED NOT NULL,
  zone_id INT UNSIGNED DEFAULT NULL COMMENT 'NULL when no_location = 1',
  no_location TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '1 = no location required for attendance',
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  created_at INT UNSIGNED NOT NULL DEFAULT (UNIX_TIMESTAMP()),
  updated_at INT UNSIGNED NOT NULL DEFAULT (UNIX_TIMESTAMP()),
  PRIMARY KEY (id),
  KEY idx_emp_zone_emp (employee_id),
  KEY idx_emp_zone_zone (zone_id),
  FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE CASCADE,
  FOREIGN KEY (zone_id) REFERENCES site_zone(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add role_mobile to user_account (role = web role, role_mobile = mobile app role)
-- If column already exists, ignore: run "ALTER TABLE user_account ADD COLUMN role_mobile ..." manually once.
ALTER TABLE user_account ADD COLUMN role_mobile VARCHAR(32) DEFAULT NULL AFTER role;

SET FOREIGN_KEY_CHECKS = 1;
