-- =====================================================
-- Create First super_admin User
-- =====================================================
-- 
-- This script helps you create your first super_admin user
-- for the GeoAttend platform.
--
-- IMPORTANT: Only run this ONCE to create your platform admin
-- 
-- =====================================================

-- Option 1: Update Existing User to super_admin
-- (Recommended if you already have an account)
-- Replace 'your-email@example.com' with your actual email

UPDATE user_account 
SET 
  role = 'super_admin',
  company_id = NULL,  -- Remove company restriction (tenant-wide access)
  site_id = NULL,     -- Remove site restriction
  status = 'active'   -- Ensure account is active
WHERE email = 'your-email@example.com';

-- Verify the update
SELECT id, email, role, company_id, site_id, status 
FROM user_account 
WHERE email = 'your-email@example.com';


-- =====================================================
-- Option 2: Create New super_admin User
-- (If you don't have an account yet)
-- =====================================================

-- Step 1: Generate password hash using Node.js:
-- cd server
-- node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('YourPasswordHere', 10));"

-- Step 2: Insert new super_admin (replace placeholders)
/*
INSERT INTO user_account 
  (tenant_id, email, password_hash, status, role, company_id, site_id, created_at, updated_at)
VALUES 
  (
    1,  -- tenant_id (use 1 or your tenant ID)
    'superadmin@yourdomain.com',  -- Your email
    '$2a$10$...YOUR_HASHED_PASSWORD...',  -- Replace with bcrypt hash
    'active',
    'super_admin',
    NULL,  -- No company restriction
    NULL,  -- No site restriction
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP()
  );
*/


-- =====================================================
-- Verify super_admin Creation
-- =====================================================

-- Check all super_admin users
SELECT id, email, role, status, created_at
FROM user_account
WHERE role = 'super_admin';


-- =====================================================
-- Clean Up Invalid 'admin' Roles
-- (Run this if you have users with 'admin' role from before the fix)
-- =====================================================

-- Find users with invalid 'admin' role
SELECT id, email, role, company_id 
FROM user_account 
WHERE role = 'admin';

-- Update them to 'tenant_admin'
-- UPDATE user_account 
-- SET role = 'tenant_admin' 
-- WHERE role = 'admin';


-- =====================================================
-- Security Notes
-- =====================================================
-- 
-- 1. super_admin has full platform access including:
--    - Access to ALL tenants/organizations
--    - Ability to switch between any tenant
--    - Can create other super_admin users
--    - Can manage all organizations
--
-- 2. Keep super_admin credentials VERY secure:
--    - Use strong password (minimum 12 characters)
--    - Store password in secure password manager
--    - Do NOT share super_admin access
--    - Consider enabling 2FA in future
--
-- 3. Regular organization admins should be 'tenant_admin':
--    - Created automatically via signup
--    - Can manage their own organization only
--    - Cannot access other organizations
--    - Cannot create super_admin users
--
-- =====================================================
