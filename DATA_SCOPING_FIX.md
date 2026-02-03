# Data Scoping Fix - Company-Level Filtering

## 🐛 Issue Fixed

**Problem:** Dashboard and other pages were showing data from ALL companies in the tenant, even for users assigned to a specific company.

**Example:** An admin user assigned to "Company A" was seeing employees from "Company B" and "Company C" as well.

---

## ✅ Solution Implemented

Updated the data filtering logic to **prioritize user's assigned company** over their role.

### New Filtering Logic

```
1. If user is assigned to a SITE → Show only that site's data
2. If user is assigned to a COMPANY → Show only that company's data
3. If user is super_admin/tenant_admin WITHOUT company → Show all tenant data
4. Otherwise → No access
```

---

## 📝 Files Updated

### 1. **Attendance Reports** (`server/src/routes/attendance.ts`)

**Before:**
```typescript
if (role === 'site_admin' && siteId != null) {
  // Filter by site
} else if (role === 'company_admin' && companyId != null) {
  // Filter by company
}
// tenant_admin and super_admin saw ALL companies
```

**After:**
```typescript
if (role === 'site_admin' && siteId != null) {
  // Filter by site
} else if (companyId != null) {
  // Filter by company (regardless of role)
}
// Only tenant_admin/super_admin WITHOUT companyId see all companies
```

---

### 2. **Employees List** (`server/src/routes/employees.ts`)

**Updated Function:** `scopeEmployeeWhere()`

**Changes:**
- Now checks for `companyId` BEFORE checking role
- If user has `companyId`, they only see that company's employees
- Only role-based filtering kicks in if no company assignment

**New Priority:**
1. Site-based scoping (if `siteId` exists)
2. Company-based scoping (if `companyId` exists)
3. Role-based scoping (for unassigned admins)

---

### 3. **Sites List** (`server/src/routes/sites.ts`)

**Updated Function:** `scopeWhere()`

**Changes:**
- Same logic as employees
- Users with `companyId` only see their company's sites
- Tenant-wide access only for admins without company assignment

---

### 4. **Pending Users** (`server/src/routes/pending-users.ts`)

**Changes:**
- Removed role check for company filtering
- Now filters by `companyId` if present, regardless of role
- Added clarifying comments

---

## 🎯 Impact by Role

### For Users WITH Company Assignment

| Role | Company Assigned | What They See Now |
|------|------------------|-------------------|
| **tenant_admin** | ✅ Company A | Only Company A data |
| **company_admin** | ✅ Company A | Only Company A data |
| **site_admin** | ✅ Company A (via Site) | Only that site's data |
| **employee** | ✅ Company A | Only their own data |

### For Users WITHOUT Company Assignment

| Role | Company Assigned | What They See Now |
|------|------------------|-------------------|
| **super_admin** | ❌ None | ALL tenants (after switching) |
| **tenant_admin** | ❌ None | ALL companies in their tenant |

---

## 💡 Key Principle

**Company assignment takes precedence over role permissions.**

Even if a user has `tenant_admin` role, if they're assigned to a specific company in the database, they'll only see that company's data.

---

## 🔍 How to Check User's Company Assignment

### In Database:
```sql
SELECT id, email, role, company_id, site_id 
FROM user_account 
WHERE email = 'user@example.com';
```

### Key Fields:
- `role`: User's role (super_admin, tenant_admin, company_admin, etc.)
- `company_id`: If set, user is scoped to this company
- `site_id`: If set, user is scoped to this site

---

## 🎨 User Experience Changes

### Dashboard View

**Before:**
```
Present today: 15  (across all companies)
- Admin User (Company A)
- Aman Rajak (Company B)
- Ram Kishan (Company C)
- ...
```

**After (for user assigned to Company A):**
```
Present today: 5  (only Company A)
- Admin User (Company A)
- Employee 1 (Company A)
- Employee 2 (Company A)
- ...
```

### Employees Page

**Before:**
- Listed employees from all companies in tenant

**After:**
- Lists only employees from user's assigned company
- Clean, focused view

### Sites Page

**Before:**
- Showed all sites across all companies

**After:**
- Shows only sites belonging to user's company

---

## 🔐 Security Implications

### Improved Data Isolation

✅ **Before:** Role-based access (loose boundaries)  
✅ **After:** Company-assignment-based access (strict boundaries)

### Benefits:

1. **Better Multi-Company Support:**
   - Each company admin sees only their data
   - No risk of cross-company data leaks

2. **Clearer Permissions:**
   - User's data scope is obvious from their company_id
   - No ambiguity based on role alone

3. **Flexible Role Assignment:**
   - Can give someone `tenant_admin` role but limit to one company
   - Useful for trial accounts or restricted admins

---

## 📊 Example Scenarios

### Scenario 1: Multi-Company Tenant

**Setup:**
- Tenant: "Enterprise Group"
- Company A: "Manufacturing Division"
- Company B: "Services Division"
- Company C: "Retail Division"

**Users:**
- User 1: tenant_admin, no company → Sees A, B, C
- User 2: tenant_admin, Company A → Sees only A
- User 3: company_admin, Company B → Sees only B

**Result:** Perfect data isolation per company!

---

### Scenario 2: Super Admin Testing

**Setup:**
- super_admin switches to "Acme Corp" tenant
- Acme Corp has multiple companies

**Behavior:**
- If super_admin's JWT has no companyId → Sees all companies
- If super_admin is assigned to specific company → Sees only that company

**Use Case:** Allows super_admin to test from a specific company's perspective

---

## 🛠️ Technical Details

### JWT Payload Structure

```typescript
{
  userId: number,
  email: string,
  role: 'super_admin' | 'tenant_admin' | 'company_admin' | 'site_admin' | 'employee',
  tenantId: number,
  companyId?: number,  // ← Key field for scoping
  siteId?: number      // ← Even more specific scoping
}
```

### Filtering Order

```typescript
// Pseudo-code for data filtering
if (user.siteId) {
  return data.where('site_id', user.siteId);
}
if (user.companyId) {
  return data.where('company_id', user.companyId);
}
if (user.role === 'super_admin' || user.role === 'tenant_admin') {
  return data.where('tenant_id', user.tenantId);
}
return []; // No access
```

---

## ✅ Testing Checklist

### Test Company-Level Filtering

1. **Create multiple companies in same tenant:**
   ```sql
   INSERT INTO company (tenant_id, company_code, name) 
   VALUES (1, 'company-a', 'Company A'),
          (1, 'company-b', 'Company B');
   ```

2. **Assign user to Company A:**
   ```sql
   UPDATE user_account 
   SET company_id = (SELECT id FROM company WHERE company_code = 'company-a')
   WHERE email = 'admin@demo.com';
   ```

3. **Create employees in both companies:**
   ```sql
   -- Company A employees
   INSERT INTO employee (company_id, employee_code, first_name, last_name)
   VALUES (1, 'EMP001', 'John', 'Doe');
   
   -- Company B employees
   INSERT INTO employee (company_id, employee_code, first_name, last_name)
   VALUES (2, 'EMP002', 'Jane', 'Smith');
   ```

4. **Test dashboard:**
   - Log in as admin@demo.com
   - Should see ONLY Company A employees
   - Should NOT see Company B employees

5. **Verify employees page:**
   - Should list only Company A employees
   - Filter/search should work within Company A only

6. **Verify sites page:**
   - Should show only Company A sites
   - Cannot access Company B sites

---

## 🎯 Summary

### What Changed:
✅ Company assignment now takes precedence over role  
✅ Users see only their assigned company's data  
✅ Cleaner, more focused dashboards  
✅ Better data isolation for multi-company tenants  

### What Stayed the Same:
✅ super_admin without company still sees all  
✅ tenant_admin without company still sees all  
✅ Role-based permissions still enforced  
✅ No breaking changes to existing functionality  

### Impact:
🎉 **Users now see exactly what they should see based on their company assignment!**

No more cross-company data leakage or confusion in the dashboard.
