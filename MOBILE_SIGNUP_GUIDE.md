# Mobile App Self-Registration Guide

This guide explains how the mobile app self-registration feature works and how to test it.

## Features

### Employee Self-Registration
- Employees can create their own accounts through the mobile app
- No need for manual creation by admins
- Accounts are created with **pending** status and require admin approval
- Email verification support (infrastructure ready)

### Registration Fields

**Required Fields:**
- First Name
- Last Name
- Email Address
- Phone Number
- Employee Code (self-chosen by employee)
- Company Code (provided by company admin)
- Password
- Confirm Password

**Optional Fields:**
- Display Name

## Setup Instructions

### 1. Database Migration

Run the email verification migration to add support for email verification:

**Windows (PowerShell):**
```powershell
cd server
Get-Content .\schema\schema-migration-email-verification.sql -Raw | mysql -u root -p attendance_db
```

**Mac/Linux:**
```bash
cd server
mysql -u root -p attendance_db < schema/schema-migration-email-verification.sql
```

### 2. Get Your Company Code

Employees need a company code to register. To find your company code:

**Option 1: Query the database**
```sql
SELECT company_code, name FROM company WHERE status = 'active';
```

**Option 2: Check the seed data**
The default company code from seed data is typically `DEMO-COMPANY` or `DEMO001`.

Example output:
```
+---------------+------------------+
| company_code  | name             |
+---------------+------------------+
| DEMO001       | Demo Company     |
+---------------+------------------+
```

Share this code with employees who need to register.

## Testing the Registration Flow

### Step 1: Start the Backend Server

```bash
cd server
npm run dev
```

Server should be running at `http://localhost:3000`

### Step 2: Start the Mobile App

```bash
# From project root
npm start
```

### Step 3: Navigate to Sign Up

1. Open the app (press `i` for iOS simulator or `a` for Android emulator)
2. On the login screen, tap **"Don't have an account? Sign Up"**
3. You'll be taken to the signup screen

### Step 4: Fill in Registration Form

Enter test data:
- **First Name:** John
- **Last Name:** Doe
- **Email:** john.doe@example.com
- **Phone:** +1 234 567 8900
- **Employee Code:** EMP999
- **Company Code:** DEMO001 (or your actual company code)
- **Display Name:** Johnny (optional)
- **Password:** password123
- **Confirm Password:** password123

### Step 5: Submit Registration

Tap **"Create Account"**

You should see a success alert:
```
Registration Successful!
Your account is pending approval. You will receive an email once approved by your administrator.
```

### Step 6: Verify Database Entry

Check the database to confirm the user was created:

```sql
-- Check employee record
SELECT id, employee_code, first_name, last_name, email, status 
FROM employee 
WHERE email = 'john.doe@example.com';

-- Check user account
SELECT id, email, status, role, email_verified 
FROM user_account 
WHERE email = 'john.doe@example.com';

-- Check the link between employee and user
SELECT eum.*, e.employee_code, u.email 
FROM employee_user_map eum
JOIN employee e ON e.id = eum.employee_id
JOIN user_account u ON u.id = eum.user_id
WHERE u.email = 'john.doe@example.com';
```

Expected results:
- Employee status: **pending**
- User account status: **pending**
- Email verified: **0** (false)

### Step 7: Try to Login (Should Fail)

1. Go back to the login screen
2. Try to login with: john.doe@example.com / password123
3. Login should fail because account is pending approval

## Admin Approval Process

### Option 1: Manual SQL Approval (Quick Testing)

To approve a pending user manually:

```sql
-- Approve the user account and employee
UPDATE user_account 
SET status = 'active', email_verified = 1 
WHERE email = 'john.doe@example.com';

UPDATE employee 
SET status = 'active' 
WHERE email = 'john.doe@example.com';
```

### Option 2: Web Admin Dashboard (Recommended for Production)

**Note:** You'll need to add an approval interface to the web admin dashboard.

Suggested implementation:
1. Create a "Pending Users" page in the web app
2. Show list of users with status = 'pending'
3. Add "Approve" and "Reject" buttons
4. Approve: Update status to 'active'
5. Reject: Delete the records or set status to 'rejected'

Example query for pending users:
```sql
SELECT 
  u.id,
  u.email,
  u.created_at,
  e.employee_code,
  e.first_name,
  e.last_name,
  e.phone,
  c.name as company_name
FROM user_account u
JOIN employee_user_map eum ON eum.user_id = u.id AND eum.is_primary = 1
JOIN employee e ON e.id = eum.employee_id
JOIN company c ON c.id = u.company_id
WHERE u.status = 'pending'
ORDER BY u.created_at DESC;
```

### Step 8: Login After Approval

After approval:
1. Go to login screen
2. Login with: john.doe@example.com / password123
3. Login should succeed!
4. You'll be taken to the dashboard

## Error Scenarios to Test

### 1. Duplicate Email
Try to register with an email that already exists:
- Expected: "Email already registered. Please login or use a different email."

### 2. Duplicate Employee Code
Try to register with an employee code that already exists for the same company:
- Expected: "Employee code already exists. Please choose a different code."

### 3. Invalid Company Code
Try to register with a non-existent company code:
- Expected: "Company code not found. Please check with your administrator."

### 4. Password Mismatch
Enter different passwords in password and confirm password fields:
- Expected: "Passwords do not match"

### 5. Invalid Email Format
Enter an invalid email (e.g., "notanemail"):
- Expected: "Please enter a valid email"

### 6. Missing Required Fields
Try to submit without filling all required fields:
- Expected: Field-specific error messages

## Email Verification (Future Enhancement)

The infrastructure for email verification is in place. To implement:

1. **Set up email service** (e.g., SendGrid, AWS SES, Nodemailer)
2. **Send verification email** in the registration endpoint
3. **Create verification endpoint**: `GET /api/auth/verify-email?token=xxx`
4. **Update status** once email is verified

Example verification endpoint:
```typescript
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  // Verify token and update email_verified = 1
});
```

## Production Considerations

### Security
1. **Rate Limiting:** Add rate limiting to prevent spam registrations
2. **CAPTCHA:** Consider adding CAPTCHA to the signup form
3. **Password Strength:** Enforce stronger password requirements
4. **Email Validation:** Implement actual email verification before approval

### User Experience
1. **Email Notifications:**
   - Send confirmation email on registration
   - Send approval notification email
   - Send rejection notification if applicable

2. **Status Checking:**
   - Allow users to check their approval status
   - Show pending status in the app

3. **Admin Dashboard:**
   - Create dedicated approval interface
   - Show pending registrations count
   - Allow bulk approval/rejection

## Troubleshooting

### Backend errors
- Check server logs for detailed error messages
- Ensure database migrations are applied
- Verify company_code exists in the database

### Mobile app issues
- Ensure API_BASE_URL in `constants/api.ts` is correct
- For physical devices, use your computer's IP address (not localhost)
- Check network connectivity

### Database issues
- Ensure all migrations are applied
- Check for foreign key constraints
- Verify user permissions

## Support

For questions or issues:
1. Check the server console logs
2. Review the database records
3. Test with the provided seed data first
4. Ensure all required fields are filled correctly
