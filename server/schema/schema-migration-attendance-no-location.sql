-- Migration: Allow NULL site_id in attendance_day for "no location required" attendance
-- Run after schema.sql and schema-migration-zones.sql

SET NAMES utf8mb4;

-- Make site_id nullable so we can store NULL for employees with "no location required"
ALTER TABLE attendance_day
  MODIFY site_id INT UNSIGNED NULL;

SELECT 'attendance_day.site_id is now nullable for no-location attendance' AS Result;
