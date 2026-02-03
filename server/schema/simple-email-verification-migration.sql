-- Simple Email Verification Migration (Alternative)
-- Copy and paste this entire script into MySQL Workbench and execute

USE attendance_db;

-- Add columns (ignore errors if they already exist)
ALTER TABLE user_account ADD COLUMN email_verified TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER password_hash;
ALTER TABLE user_account ADD COLUMN email_verification_token VARCHAR(255) DEFAULT NULL AFTER email_verified;
ALTER TABLE user_account ADD COLUMN email_verification_expires_at INT UNSIGNED DEFAULT NULL AFTER email_verification_token;
ALTER TABLE user_account ADD COLUMN role_mobile VARCHAR(32) DEFAULT NULL AFTER role;

-- Add index
ALTER TABLE user_account ADD INDEX idx_verification_token (email_verification_token);

-- Update existing active users to have verified emails
UPDATE user_account SET email_verified = 1 WHERE status = 'active';

SELECT 'Migration completed! Columns added successfully.' AS Result;
