-- Email Verification Migration (Safe Update Mode Compatible)
-- Run this in MySQL Workbench

USE attendance_db;

-- Temporarily disable safe update mode
SET SQL_SAFE_UPDATES = 0;

-- Add columns (run each one separately if needed)
ALTER TABLE user_account ADD COLUMN email_verified TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER password_hash;
ALTER TABLE user_account ADD COLUMN email_verification_token VARCHAR(255) DEFAULT NULL AFTER email_verified;
ALTER TABLE user_account ADD COLUMN email_verification_expires_at INT UNSIGNED DEFAULT NULL AFTER email_verification_token;
ALTER TABLE user_account ADD COLUMN role_mobile VARCHAR(32) DEFAULT NULL AFTER role;

-- Add index
ALTER TABLE user_account ADD INDEX idx_verification_token (email_verification_token);

-- Update existing active users to have verified emails
-- This is now safe because we disabled safe update mode
UPDATE user_account 
SET email_verified = 1 
WHERE status = 'active';

-- Re-enable safe update mode
SET SQL_SAFE_UPDATES = 1;

SELECT 'Migration completed successfully!' AS Result;
