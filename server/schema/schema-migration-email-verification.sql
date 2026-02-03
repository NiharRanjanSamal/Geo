-- Migration: Add email verification support to user_account table
-- Run this after the main schema.sql has been applied

-- Add email verification columns if they don't exist
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE table_name = 'user_account'
   AND table_schema = DATABASE()
   AND column_name = 'email_verified') > 0,
  'SELECT 1',
  'ALTER TABLE user_account ADD COLUMN email_verified TINYINT UNSIGNED NOT NULL DEFAULT 0 AFTER password_hash'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE table_name = 'user_account'
   AND table_schema = DATABASE()
   AND column_name = 'email_verification_token') > 0,
  'SELECT 1',
  'ALTER TABLE user_account ADD COLUMN email_verification_token VARCHAR(255) DEFAULT NULL AFTER email_verified'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE table_name = 'user_account'
   AND table_schema = DATABASE()
   AND column_name = 'email_verification_expires_at') > 0,
  'SELECT 1',
  'ALTER TABLE user_account ADD COLUMN email_verification_expires_at INT UNSIGNED DEFAULT NULL AFTER email_verification_token'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE table_name = 'user_account'
   AND table_schema = DATABASE()
   AND column_name = 'role_mobile') > 0,
  'SELECT 1',
  'ALTER TABLE user_account ADD COLUMN role_mobile VARCHAR(32) DEFAULT NULL AFTER role'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add index for faster lookups of verification tokens (if it doesn't exist)
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
   WHERE table_name = 'user_account'
   AND table_schema = DATABASE()
   AND index_name = 'idx_verification_token') > 0,
  'SELECT 1',
  'ALTER TABLE user_account ADD INDEX idx_verification_token (email_verification_token)'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Update existing active users to have verified emails (backward compatibility)
UPDATE user_account 
SET email_verified = 1 
WHERE status = 'active' AND email_verified = 0;

-- Note: For production, you should send verification emails to pending users
-- and only activate them after they verify their email AND get admin approval

SELECT 'Migration completed successfully!' AS message;
