-- Quick Admin Script: Approve Pending User Registrations
-- Use this script to approve pending users who registered through the mobile app

-- 1. VIEW ALL PENDING REGISTRATIONS
-- Run this first to see who's waiting for approval
SELECT 
  u.id as user_id,
  u.email,
  u.created_at as registered_at,
  e.id as employee_id,
  e.employee_code,
  CONCAT(e.first_name, ' ', e.last_name) as full_name,
  e.phone,
  c.name as company_name,
  c.company_code,
  CASE 
    WHEN u.email_verified = 1 THEN 'Verified'
    ELSE 'Not Verified'
  END as email_status
FROM user_account u
JOIN employee_user_map eum ON eum.user_id = u.id AND eum.is_primary = 1
JOIN employee e ON e.id = eum.employee_id
JOIN company c ON c.id = u.company_id
WHERE u.status = 'pending'
ORDER BY u.created_at DESC;

-- 2. APPROVE A SPECIFIC USER BY EMAIL
-- Replace 'user@example.com' with the actual email address
-- Uncomment the lines below and replace the email to approve a user:

/*
UPDATE user_account 
SET status = 'active', email_verified = 1, updated_at = UNIX_TIMESTAMP()
WHERE email = 'user@example.com' AND status = 'pending';

UPDATE employee e
JOIN user_account u ON u.company_id = e.company_id
SET e.status = 'active', e.updated_at = UNIX_TIMESTAMP()
WHERE u.email = 'user@example.com' AND e.email = 'user@example.com';

SELECT 'User approved successfully!' as message;
*/

-- 3. APPROVE A SPECIFIC USER BY USER ID
-- Replace 123 with the actual user_id from the first query
-- Uncomment the lines below to approve by ID:

/*
UPDATE user_account 
SET status = 'active', email_verified = 1, updated_at = UNIX_TIMESTAMP()
WHERE id = 123 AND status = 'pending';

UPDATE employee e
JOIN employee_user_map eum ON eum.employee_id = e.id
SET e.status = 'active', e.updated_at = UNIX_TIMESTAMP()
WHERE eum.user_id = 123 AND eum.is_primary = 1;

SELECT 'User approved successfully!' as message;
*/

-- 4. APPROVE ALL PENDING USERS (USE WITH CAUTION!)
-- This will approve ALL pending registrations
-- Only use this if you trust all pending registrations
-- Uncomment to use:

/*
UPDATE user_account 
SET status = 'active', email_verified = 1, updated_at = UNIX_TIMESTAMP()
WHERE status = 'pending';

UPDATE employee 
SET status = 'active', updated_at = UNIX_TIMESTAMP()
WHERE status = 'pending';

SELECT COUNT(*) as approved_count FROM user_account WHERE status = 'active';
*/

-- 5. REJECT A PENDING USER (Delete their registration)
-- Replace 'user@example.com' with the email to reject
-- This will delete the employee, user, and mapping records
-- Uncomment to use:

/*
-- Get the employee_id first
SET @emp_id = (SELECT e.id FROM employee e WHERE e.email = 'user@example.com' LIMIT 1);
SET @user_id = (SELECT u.id FROM user_account u WHERE u.email = 'user@example.com' LIMIT 1);

-- Delete mapping
DELETE FROM employee_user_map WHERE employee_id = @emp_id AND user_id = @user_id;

-- Delete user account
DELETE FROM user_account WHERE id = @user_id;

-- Delete employee
DELETE FROM employee WHERE id = @emp_id;

SELECT 'User registration rejected and removed!' as message;
*/

-- 6. VIEW RECENTLY APPROVED USERS (last 7 days)
-- Run this to see who was approved recently
SELECT 
  u.id as user_id,
  u.email,
  u.created_at as registered_at,
  u.updated_at as approved_at,
  e.employee_code,
  CONCAT(e.first_name, ' ', e.last_name) as full_name,
  c.name as company_name
FROM user_account u
JOIN employee_user_map eum ON eum.user_id = u.id AND eum.is_primary = 1
JOIN employee e ON e.id = eum.employee_id
JOIN company c ON c.id = u.company_id
WHERE u.status = 'active' 
  AND u.updated_at > (UNIX_TIMESTAMP() - (7 * 24 * 60 * 60))
  AND u.created_at < u.updated_at
ORDER BY u.updated_at DESC;
