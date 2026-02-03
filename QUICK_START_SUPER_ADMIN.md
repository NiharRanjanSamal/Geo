# Quick Start: Setting Up super_admin

## 🎯 Goal
Create your first **super_admin** account to manage the entire GeoAttend platform.

---

## ⚡ Quick Setup (5 Minutes)

### **Step 1: Create super_admin**

Open MySQL and run this query (replace with your email):

```sql
UPDATE user_account 
SET 
  role = 'super_admin',
  company_id = NULL,
  site_id = NULL
WHERE email = 'your-email@example.com';
```

**Don't have an account yet?** Go to `/signup` and create one first, then run the above query.

---

### **Step 2: Verify**

```sql
SELECT email, role, company_id FROM user_account WHERE role = 'super_admin';
```

You should see your email with `super_admin` role and `NULL` company_id.

---

### **Step 3: Log In**

1. Go to http://localhost:5174/login
2. Sign in with your credentials
3. You should see **"Super Admin"** badge in sidebar
4. You should see **"Tenant Management"** link (🌐 icon)

---

### **Step 4: Test It**

1. Click **"Tenant Management"** in sidebar
2. You should see all organizations
3. Try creating a new tenant
4. Try switching between tenants
5. Go to Employees and assign roles
6. **You should see `super_admin` in role dropdown** ✅

---

## ✅ What's Different Now?

### **Before the Fix:**
- ❌ Anyone signing up could become super_admin
- ❌ No role restrictions
- ❌ Security risk

### **After the Fix:**
- ✅ Signup creates `tenant_admin` (organization admin only)
- ✅ Only super_admin can create other super_admins
- ✅ Role hierarchy enforced
- ✅ Secure platform

---

## 📊 Quick Reference

### **Public Users (via /signup)**
- Creates organization ✅
- Becomes `tenant_admin` ✅
- Manages their organization ✅
- **CANNOT** become super_admin ❌
- **CANNOT** access other organizations ❌

### **tenant_admin (Organization Admin)**
- Manages one organization ✅
- Can assign: company_admin, site_admin, employee ✅
- **CANNOT** assign: super_admin, tenant_admin ❌
- **CANNOT** access other organizations ❌

### **super_admin (Platform Admin - YOU)**
- Manages ALL organizations ✅
- Can switch between any tenant ✅
- Can assign ANY role including super_admin ✅
- Full platform access ✅

---

## 🔐 Security Rules

| Who | Can Assign |
|-----|-----------|
| **super_admin** | super_admin, tenant_admin, company_admin, site_admin, employee |
| **tenant_admin** | company_admin, site_admin, employee |
| **company_admin** | site_admin, employee |
| **site_admin** | site_admin, employee |
| **employee** | (cannot assign roles) |

---

## 🎯 Your Typical Workflow

### **As super_admin:**

1. **View All Organizations**
   - Go to Tenant Management
   - See all customer organizations

2. **Switch to Organization**
   - Click "Switch" on any tenant
   - View that organization's data
   - Manage as if you're their admin

3. **Create New Organization**
   - Click "+ Create Tenant"
   - Set up for new customer
   - Assign tenant_admin to them

4. **Grant super_admin Access**
   - Go to Employees
   - Assign `super_admin` role
   - Only do this for trusted platform admins

---

## 📝 SQL Helper Script

We've created a helper script for you:

**File:** `server/schema/create-super-admin.sql`

This script has all the queries you need to:
- Create super_admin
- Verify creation
- Clean up old 'admin' roles
- Security notes

---

## 🆘 Troubleshooting

### **"I don't see Tenant Management link"**
- You're not logged in as super_admin
- Run the SQL query in Step 1
- Log out and log back in

### **"I can't assign super_admin role"**
- You're logged in as tenant_admin or lower
- Only super_admin can assign super_admin
- This is correct security behavior

### **"Dropdown doesn't show all roles"**
- This is correct!
- Dropdown filters based on your role
- Only super_admin sees all roles

### **"I have old users with 'admin' role"**
```sql
-- Update them to tenant_admin
UPDATE user_account 
SET role = 'tenant_admin' 
WHERE role = 'admin';
```

---

## 🎊 You're Done!

You now have:
- ✅ A secure super_admin account
- ✅ Full platform access
- ✅ Ability to manage all organizations
- ✅ Proper role hierarchy
- ✅ Protection against unauthorized access

**Next:** Log in and try managing tenants! 🚀

---

## 📚 More Documentation

- **Full Details:** See `ROLE_SECURITY_IMPLEMENTATION.md`
- **Super Admin Features:** See `SUPER_ADMIN_FEATURES.md`
- **SQL Script:** See `server/schema/create-super-admin.sql`

---

**Need Help?** All security features are documented and tested!
