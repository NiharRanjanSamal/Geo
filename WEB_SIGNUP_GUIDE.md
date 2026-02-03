# Web Application Signup Feature - Complete Guide

Your GeoAttend web application now includes a beautiful, multi-step signup flow for creating new organizations (tenants)!

## 🎉 What's New

### 1. Modern Signup Page with 3-Step Process

**Step 1: Organization Details**
- Organization name (e.g., "Acme Corporation")
- Organization code (unique identifier, e.g., "acme-corp")

**Step 2: Company Details**
- Company name (e.g., "Acme Inc.")
- Company code (unique identifier, e.g., "acme-inc")

**Step 3: Admin Account**
- Admin email address
- Password (minimum 6 characters)
- Password confirmation

### 2. Improved Login Page UI
- Modern gradient background
- Better form styling
- Loading spinner animation
- Improved error messages
- Link to signup page

### 3. Backend API
- New `/api/auth/signup` endpoint
- Creates tenant, company, and admin user atomically
- Validates all input data
- Checks for duplicate codes/emails

---

## 🎨 UI Improvements

### Modern Design Features

✅ **Beautiful Gradients**
- Emerald and blue gradient backgrounds
- Smooth color transitions
- Professional appearance

✅ **Enhanced Form Elements**
- Rounded corners (xl borders)
- Better spacing and padding
- Focus states with ring effects
- Improved typography

✅ **Progress Indicator**
- Visual step counter (1, 2, 3)
- Progress bars between steps
- Active state highlighting
- Completion checkmarks

✅ **Better UX**
- Clear validation messages
- Inline field descriptions
- Back/Next navigation
- Loading states with spinners

---

## 📱 User Flow

### Creating a New Organization

1. **Navigate to Signup**
   - Go to `http://localhost:5173/signup`
   - Or click "Create organization" link on login page

2. **Step 1: Organization Details**
   - Enter your organization name
   - Choose a unique organization code
   - Code format: letters, numbers, hyphens, underscores
   - Click "Next Step"

3. **Step 2: Company Details**
   - Enter your first company name
   - Choose a unique company code
   - Code format: letters, numbers, hyphens, underscores
   - Click "Next Step" or "Back" to edit

4. **Step 3: Admin Account**
   - Enter admin email address
   - Create a password (min 6 chars)
   - Confirm password
   - Click "Create Account"

5. **Success!**
   - Account created successfully
   - Redirected to login page
   - Sign in with your admin credentials

---

## 🔧 Technical Details

### Files Created/Modified

**Frontend:**
1. `web/src/pages/SignUp.tsx` - New signup page component
2. `web/src/pages/Login.tsx` - Updated with improved UI
3. `web/src/api/auth.ts` - Added signup function
4. `web/src/App.tsx` - Added signup route

**Backend:**
1. `server/src/routes/auth.ts` - Added `/signup` endpoint

### Database Schema

The signup process creates records in these tables:

```sql
-- 1. Tenant (Organization)
INSERT INTO tenant (tenant_code, name, status, subscription_tier)

-- 2. Company (Under the tenant)
INSERT INTO company (tenant_id, company_code, name, status, timezone)

-- 3. Admin User
INSERT INTO user_account (tenant_id, email, password_hash, status, role, company_id)
```

### API Endpoint

**POST** `/api/auth/signup`

**Request Body:**
```json
{
  "tenant_name": "Acme Corporation",
  "tenant_code": "acme-corp",
  "company_name": "Acme Inc.",
  "company_code": "acme-inc",
  "admin_email": "admin@acme.com",
  "admin_password": "secure_password"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Organization created successfully! You can now sign in with your admin account."
}
```

**Error Responses:**

- **400**: Missing required fields or invalid format
- **409**: Duplicate tenant code, company code, or email
- **500**: Internal server error

---

## ✅ Validation Rules

### Organization Code
- ✅ Required
- ✅ Only letters, numbers, hyphens, underscores
- ✅ Must be unique across all tenants
- ✅ Case insensitive (stored as lowercase)

### Company Code
- ✅ Required
- ✅ Only letters, numbers, hyphens, underscores
- ✅ Must be unique within tenant
- ✅ Case insensitive (stored as lowercase)

### Email
- ✅ Required
- ✅ Valid email format (regex validation)
- ✅ Must be unique across all users
- ✅ Case insensitive (stored as lowercase)

### Password
- ✅ Required
- ✅ Minimum 6 characters
- ✅ Must match confirmation
- ✅ Hashed with bcrypt before storage

---

## 🚀 Testing the Signup Flow

### 1. Start the Servers

**Terminal 1 - Backend:**
```bash
cd server
npm start
```

**Terminal 2 - Frontend:**
```bash
cd web
npm run dev
```

### 2. Open the Web App

Navigate to: `http://localhost:5173/login`

### 3. Test Signup

**Click "Create organization"**

**Step 1 - Organization:**
- Name: `Test Organization`
- Code: `test-org`
- Click "Next Step"

**Step 2 - Company:**
- Name: `Test Company`
- Code: `test-company`
- Click "Next Step"

**Step 3 - Admin:**
- Email: `admin@test.com`
- Password: `password123`
- Confirm: `password123`
- Click "Create Account"

**Result:**
- ✅ Success message appears
- ✅ Redirected to login page
- ✅ Can now sign in with admin@test.com

### 4. Verify in Database

```sql
-- Check tenant created
SELECT * FROM tenant WHERE tenant_code = 'test-org';

-- Check company created
SELECT * FROM company WHERE company_code = 'test-company';

-- Check admin user created
SELECT * FROM user_account WHERE email = 'admin@test.com';
```

---

## 🎨 UI Components Used

### Colors
- **Emerald (Green)**: Primary actions, success states
- **Slate (Gray)**: Text, borders, backgrounds
- **Red**: Error messages
- **Blue**: Accent colors in gradients

### Typography
- **Font Family**: DM Sans (body), Outfit (headings)
- **Sizes**: text-xs to text-3xl
- **Weights**: Regular, medium, semibold, bold

### Spacing
- **Padding**: p-4, p-6, p-8 for cards
- **Gaps**: space-y-4, space-y-6 for forms
- **Margins**: mt-2, mb-4, etc.

### Shadows
- **shadow-lg**: Large shadow for buttons
- **shadow-xl**: Extra large for cards
- **shadow-emerald-200**: Colored shadows for emphasis

---

## 🔒 Security Features

### Password Security
- ✅ Hashed with bcrypt (10 salt rounds)
- ✅ Never stored in plain text
- ✅ Minimum length enforcement
- ✅ Confirmation required

### Input Validation
- ✅ Server-side validation for all fields
- ✅ Client-side validation for UX
- ✅ Format validation (email, codes)
- ✅ SQL injection prevention (parameterized queries)

### Error Handling
- ✅ Duplicate detection
- ✅ Graceful error messages
- ✅ Transaction support (atomic operations)
- ✅ Detailed logging for debugging

---

## 🐛 Troubleshooting

### Issue: "Organization code already exists"

**Cause:** The tenant code you entered is already in use

**Solution:** Choose a different organization code

### Issue: "Company code already exists"

**Cause:** The company code is already used in your organization

**Solution:** Choose a different company code

### Issue: "Email already registered"

**Cause:** An account with this email already exists

**Solution:** Use a different email or sign in with existing account

### Issue: Signup button does nothing

**Cause:** Validation failed

**Solution:** Check all fields are filled correctly:
- Valid email format
- Passwords match
- Codes use only allowed characters
- All required fields filled

### Issue: "Internal server error"

**Cause:** Database connection issue or missing tables

**Solution:**
1. Check server is running (`cd server && npm start`)
2. Verify database connection in `server/.env`
3. Run database migrations if needed
4. Check server console for detailed error

---

## 📊 What Happens After Signup?

### Tenant Created
- Status: `active`
- Subscription tier: `basic`
- Unique tenant code assigned

### Company Created
- Linked to tenant
- Status: `active`
- Timezone: `UTC` (default)
- Unique company code assigned

### Admin User Created
- Role: `admin`
- Status: `active`
- Email verified: `false` (can be enhanced later)
- Linked to company

### Admin Can Now:
- ✅ Sign in to the web application
- ✅ View and manage the dashboard
- ✅ Create and manage employees
- ✅ Create sites and zones
- ✅ Approve pending users
- ✅ View attendance records

---

## 🎯 Next Steps After Signup

1. **Sign In**
   - Use admin email and password
   - Access full admin dashboard

2. **Create Sites**
   - Go to Sites page
   - Add your office locations
   - Define GPS coordinates

3. **Create Zones**
   - Add geofence zones for each site
   - Set radius and location

4. **Add Employees**
   - Go to Employees page
   - Create employee records
   - Assign to sites

5. **Invite Users**
   - Employees can register via mobile app
   - Review and approve registrations
   - Users can start marking attendance

---

## 🌟 Future Enhancements

Possible improvements to consider:

### Email Verification
- Send verification email after signup
- Require email confirmation before login
- Resend verification link option

### Enhanced Onboarding
- Welcome tour after first login
- Step-by-step setup wizard
- Sample data for testing

### Multi-Step Improvements
- Save progress between steps
- Allow skipping optional fields
- Preview before submission

### Tenant Settings
- Customize subscription tier during signup
- Set timezone preference
- Upload organization logo
- Configure default settings

### Social Signup
- Sign up with Google
- Sign up with Microsoft
- Sign up with Apple
- OAuth integration

---

## 📞 Need Help?

### Check These First
1. Server is running on port 3000
2. Web app is running on port 5173
3. Database is accessible
4. All required tables exist
5. .env file is configured

### Common Commands

```bash
# Start backend server
cd server
npm start

# Start web app
cd web
npm run dev

# Check database
mysql -u root -p attendance_db
```

---

## 🎊 Summary

You now have a **fully functional tenant signup system** with:

✅ **Beautiful UI** - Modern, professional design  
✅ **Multi-step Form** - Easy, guided process  
✅ **Complete Validation** - Client and server-side  
✅ **Secure** - Password hashing, SQL injection protection  
✅ **User-friendly** - Clear errors, progress indicators  
✅ **Production-ready** - Error handling, logging

Your users can now:
1. Visit your web app
2. Create their organization
3. Set up their first company
4. Create an admin account
5. Start using GeoAttend immediately!

Happy managing! 🚀
