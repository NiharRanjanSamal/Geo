# Role Security Implementation - Complete Guide

## 🔐 Security Issue Fixed

**Critical:** Prevented unauthorized super_admin access and implemented proper role hierarchy.

---

## ✅ What Was Fixed

### 1. **Signup Endpoint Security** ✅

**File:** `server/src/routes/auth.ts` (Line 125)

**Before:**
```typescript
role: 'admin'  // Bug: Invalid role, could be interpreted as super_admin
```

**After:**
```typescript
role: 'tenant_admin'  // Correct: Organization admin only
```

**Impact:** Users who sign up now become `tenant_admin` (organization administrator) instead of potentially getting super_admin access.

---

### 2. **Role Assignment Restrictions** ✅

**File:** `server/src/routes/employees.ts` (Lines 254-283)

**Added Security Checks:**

#### **Rule 1: Only super_admin can create super_admin**
```typescript
if (body.roleWeb === 'super_admin' && jwt.role !== 'super_admin') {
  res.status(403).json({ 
    message: 'Forbidden: Only super_admin can assign super_admin role' 
  });
  return;
}
```

#### **Rule 2: tenant_admin cannot assign admin roles**
```typescript
if (jwt.role === 'tenant_admin' && 
    (body.roleWeb === 'super_admin' || body.roleWeb === 'tenant_admin')) {
  res.status(403).json({ 
    message: 'Forbidden: You can only assign company_admin, site_admin, or employee roles' 
  });
  return;
}
```

#### **Rule 3: company_admin and site_admin have limited permissions**
```typescript
if ((jwt.role === 'company_admin' || jwt.role === 'site_admin') && 
    ['super_admin', 'tenant_admin', 'company_admin'].includes(body.roleWeb || '')) {
  res.status(403).json({ 
    message: 'Forbidden: You can only assign site_admin or employee roles' 
  });
  return;
}
```

---

### 3. **Frontend Role Filtering** ✅

**File:** `web/src/pages/Employees.tsx`

**Added Function:**
```typescript
function getAllowedRoles(currentUserRole?: UserRole): UserRole[] {
  switch (currentUserRole) {
    case 'super_admin':
      return ['super_admin', 'tenant_admin', 'company_admin', 'site_admin', 'employee'];
    case 'tenant_admin':
      return ['company_admin', 'site_admin', 'employee'];
    case 'company_admin':
    case 'site_admin':
      return ['site_admin', 'employee'];
    default:
      return ['employee'];
  }
}
```

**Impact:** Role dropdown in UI only shows roles the user is allowed to assign.

**Added UI Notice:**
```
"Note: Only super_admin can assign super_admin role"
```

---

## 📊 Role Assignment Matrix

| Current User Role | Can Assign These Roles |
|------------------|------------------------|
| **super_admin** | ✅ super_admin, tenant_admin, company_admin, site_admin, employee |
| **tenant_admin** | ✅ company_admin, site_admin, employee |
| **company_admin** | ✅ site_admin, employee |
| **site_admin** | ✅ site_admin, employee |
| **employee** | ❌ Cannot assign roles |

---

## 🎯 User Flow After Implementation

### **Scenario 1: Public Signup**
```
1. User visits /signup
2. Creates organization
3. Automatically becomes tenant_admin
4. Can manage their organization
5. CANNOT become super_admin
```

### **Scenario 2: tenant_admin Creates Users**
```
1. tenant_admin assigns roles to employees
2. Can assign: company_admin, site_admin, employee
3. CANNOT assign: super_admin, tenant_admin
4. Error shown if attempted
```

### **Scenario 3: super_admin Manages Platform**
```
1. super_admin accesses Tenant Management
2. Switches to any organization
3. Can assign ANY role including super_admin
4. Full platform access
```

---

## 🛠️ Setup: Creating Your First super_admin

Since public signup creates `tenant_admin`, you need to manually create your first `super_admin`:

### **Method 1: Update Existing User (Recommended)**

```sql
-- Replace with your email
UPDATE user_account 
SET 
  role = 'super_admin',
  company_id = NULL,  -- Remove company restriction
  site_id = NULL      -- Remove site restriction
WHERE email = 'your-admin@email.com';
```

**Verify:**
```sql
SELECT id, email, role, company_id, site_id 
FROM user_account 
WHERE email = 'your-admin@email.com';
```

---

### **Method 2: Create New super_admin**

```sql
-- Step 1: Hash a password (you need to do this separately)
-- Use bcrypt with 10 rounds, example password: 'SuperAdmin123!'

-- Step 2: Create the user (replace with your hashed password)
INSERT INTO user_account 
  (tenant_id, email, password_hash, status, role, created_at, updated_at)
VALUES 
  (1, 'superadmin@yourdomain.com', '$2a$10$...YOUR_HASHED_PASSWORD...', 'active', 'super_admin', UNIX_TIMESTAMP(), UNIX_TIMESTAMP());
```

**Generate password hash using Node.js:**
```bash
cd server
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('YourPassword123!', 10));"
```

---

### **Method 3: Modify Seed Script** (For Fresh Installs)

**File:** `server/src/seed.ts` (Line 76)

```typescript
// Change this line:
role: 'company_admin'

// To:
role: 'super_admin'
```

Then run:
```bash
cd server
npm run seed
```

**Default credentials:** admin@demo.com / admin123

---

## 🔍 Testing the Security

### **Test 1: Signup Creates tenant_admin**

1. Go to `/signup`
2. Create new organization
3. Check database:
   ```sql
   SELECT email, role FROM user_account ORDER BY created_at DESC LIMIT 1;
   ```
4. **Expected:** Role should be `tenant_admin` (not super_admin)

---

### **Test 2: tenant_admin Cannot Assign super_admin**

1. Log in as tenant_admin
2. Go to Employees page
3. Try to assign roles to an employee
4. **Expected:** Role dropdown should NOT show `super_admin` or `tenant_admin`
5. **Expected:** API should reject if trying via console/API

---

### **Test 3: super_admin Can Assign Any Role**

1. Log in as super_admin
2. Go to Employees page
3. Assign roles to an employee
4. **Expected:** Role dropdown shows ALL roles including `super_admin`
5. **Expected:** Can successfully assign any role

---

### **Test 4: API-Level Protection**

Test via API/console to bypass frontend:

```javascript
// Try to assign super_admin as tenant_admin (should fail)
fetch('/api/employees/1/assignments/roles', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer tenant_admin_token'
  },
  body: JSON.stringify({
    roleWeb: 'super_admin'
  })
});
```

**Expected Response:** `403 Forbidden: Only super_admin can assign super_admin role`

---

## 🚨 Security Checklist

Before deploying to production:

- [ ] Signup creates `tenant_admin` (NOT super_admin)
- [ ] Created your first super_admin manually
- [ ] Tested: tenant_admin cannot assign super_admin
- [ ] Tested: company_admin has limited permissions
- [ ] Frontend role dropdown filters correctly
- [ ] API rejects unauthorized role assignments
- [ ] Changed seed script if using it
- [ ] Documented super_admin credentials securely
- [ ] Set strong password for super_admin
- [ ] Consider enabling 2FA for super_admin (future)

---

## 📁 Files Modified

### Backend
1. ✅ `server/src/routes/auth.ts` - Fixed signup role
2. ✅ `server/src/routes/employees.ts` - Added role assignment restrictions

### Frontend
3. ✅ `web/src/pages/Employees.tsx` - Added role filtering & UI notices

---

## 🔐 Security Best Practices Implemented

### ✅ **Defense in Depth**
- Frontend filters roles (UX)
- Backend validates roles (Security)
- Both layers prevent unauthorized access

### ✅ **Principle of Least Privilege**
- Users get minimal necessary permissions
- Role escalation requires higher-level admin
- Clear hierarchy enforced

### ✅ **Secure by Default**
- Signup creates least privileged admin (tenant_admin)
- super_admin must be manually created
- No backdoors or automatic escalation

### ✅ **Clear Error Messages**
- Users see helpful error messages
- Admins understand what they can/cannot do
- No confusing permissions

---

## 🎯 Role Hierarchy Explained

```
super_admin (Platform Admin)
    ↓ Can create all roles below
tenant_admin (Organization Admin)
    ↓ Can create company_admin and below
company_admin (Company Admin)
    ↓ Can create site_admin and below
site_admin (Site Manager)
    ↓ Can create site_admin and employee
employee (Regular User)
    ↓ No role assignment permissions
```

---

## 📝 Common Operations

### **Grant super_admin to Trusted User**

**As super_admin:**
1. Go to Employees page
2. Find the user
3. Click "Assign roles"
4. Select `super_admin` from Role (Web) dropdown
5. Save

**Via SQL:**
```sql
UPDATE user_account 
SET role = 'super_admin', company_id = NULL, site_id = NULL
WHERE email = 'trusted-user@email.com';
```

---

### **Revoke super_admin**

```sql
UPDATE user_account 
SET role = 'tenant_admin'
WHERE email = 'user@email.com';
```

---

### **Promote User to Organization Admin**

**As super_admin:**
1. Go to Tenant Management
2. Switch to target organization
3. Go to Employees
4. Assign `tenant_admin` role to user

---

## 🆘 Troubleshooting

### **Issue: Can't log in as super_admin**

**Cause:** super_admin not created yet

**Solution:** Run Method 1 SQL query above

---

### **Issue: "Forbidden" when assigning role**

**Cause:** Trying to assign role above your permission level

**Solution:** Check Role Assignment Matrix above

---

### **Issue: Dropdown doesn't show super_admin**

**Cause:** You're not logged in as super_admin

**Solution:** This is correct behavior! Only super_admin sees this option

---

### **Issue: Existing users have 'admin' role**

**Cause:** Created before this fix

**Solution:** Update them:
```sql
-- Change 'admin' to 'tenant_admin'
UPDATE user_account 
SET role = 'tenant_admin' 
WHERE role = 'admin';
```

---

## 🎊 Summary

### **Security Improvements:**
✅ **Signup Security:** Creates tenant_admin instead of super_admin  
✅ **Role Protection:** Only super_admin can create super_admin  
✅ **Frontend Filtering:** Users only see allowed roles  
✅ **Backend Validation:** API enforces role hierarchy  
✅ **Clear Hierarchy:** Well-defined permission levels  

### **Your System Now Has:**
- **3-Tier Access Model:** Public signup → tenant_admin → super_admin
- **Role-Based Restrictions:** Clear limits on who can assign what
- **Defense in Depth:** Both frontend and backend protection
- **Secure by Default:** No automatic super_admin creation

---

## 🚀 Next Steps

1. **Create your first super_admin** (use Method 1 above)
2. **Test the security** (follow testing section)
3. **Update existing 'admin' users** (if any)
4. **Document super_admin credentials** securely
5. **Deploy with confidence!** 🎉

Your platform is now secure with proper role hierarchy! 🔐
