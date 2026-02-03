import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, getEmployeeAssignments, updateEmployeeRoles, updateEmployeeZones } from '@/api/employees';
import { getCompanies } from '@/api/companies';
import { getSites } from '@/api/sites';
import { getZonesBySite } from '@/api/zones';
import { useAuth } from '@/contexts/AuthContext';
import type { Employee, Company, EmployeeAssignments, AttendanceZone, UserRole } from '@/types';

function useZonesForSites(siteIds: string[]): Record<string, AttendanceZone[]> {
  const results = useQueries({
    queries: siteIds.map((id) => ({
      queryKey: ['zones', id] as const,
      queryFn: () => getZonesBySite(id),
      enabled: !!id,
    })),
  });
  return useMemo(() => {
    const out: Record<string, AttendanceZone[]> = {};
    siteIds.forEach((id, i) => {
      const res = results[i];
      const data = res?.data as { data?: AttendanceZone[] } | undefined;
      out[id] = data?.data ?? [];
    });
    return out;
  }, [siteIds, results]);
}


const ROLE_LEVEL: Record<string, number> = {
  super_admin: 4,
  tenant_admin: 3,
  company_admin: 2,
  site_admin: 1,
  employee: 0,
};

function isTargetRoleAboveCurrentUser(currentUserRole?: UserRole, targetRoleWeb?: string | null): boolean {
  if (!targetRoleWeb) return false;
  const currentLevel = currentUserRole ? (ROLE_LEVEL[currentUserRole] ?? -1) : -1;
  const targetLevel = ROLE_LEVEL[targetRoleWeb] ?? -1;
  return targetLevel > currentLevel;
}

// Get allowed roles based on current user's role (own role and everyone below)
function getAllowedRoles(currentUserRole?: UserRole): UserRole[] {
  switch (currentUserRole) {
    case 'super_admin':
      return ['super_admin', 'tenant_admin', 'company_admin', 'site_admin', 'employee'];
    case 'tenant_admin':
      return ['tenant_admin', 'company_admin', 'site_admin', 'employee'];
    case 'company_admin':
      return ['company_admin', 'site_admin', 'employee'];
    case 'site_admin':
      return ['site_admin', 'employee'];
    default:
      return [];
  }
}

export function Employees() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [modal, setModal] = useState<'create' | 'edit' | 'assign' | null>(null);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [assignments, setAssignments] = useState<EmployeeAssignments | null>(null);

  const { data: employeesData, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  });
  const { data: companiesData } = useQuery({ queryKey: ['companies'], queryFn: getCompanies });
  const employees: Employee[] = (employeesData as { data?: Employee[] } | undefined)?.data ?? [];
  const companies: Company[] = ((companiesData as { data?: Company[] } | undefined)?.data ?? []).filter(
    (c) => c.status === 'active'
  );

  const createMutation = useMutation({
    mutationFn: (body: Parameters<typeof createEmployee>[0]) => createEmployee(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setModal(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateEmployee>[1] }) =>
      updateEmployee(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setModal(null);
      setSelected(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setModal(null);
      setSelected(null);
    },
  });

  const openEdit = (emp: Employee) => {
    setSelected(emp);
    setModal('edit');
  };

  const openAssign = async (emp: Employee) => {
    setSelected(emp);
    const a = await getEmployeeAssignments(emp.id);
    setAssignments(a);
    setModal('assign');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Employees</h1>
          <p className="text-slate-600 mt-0.5">Create with minimal details or manage assignments</p>
        </div>
        <button
          type="button"
          onClick={() => setModal('create')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-soft"
        >
          <span>+</span> Add Employee
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center">
          <div className="inline-block w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-card">
          {employees.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              No employees yet. Add one with minimal details (code, name, company).
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((emp: Employee) => (
                    <tr key={emp.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {emp.firstName} {emp.lastName}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{emp.employeeCode}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{emp.companyName}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{emp.email || '—'}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                            emp.status === 'active' ? 'bg-primary-100 text-primary-800' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openEdit(emp)}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium mr-3"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => openAssign(emp)}
                          className="text-accent-600 hover:text-accent-700 text-sm font-medium"
                        >
                          Assign
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create modal */}
      {modal === 'create' && (
        <EmployeeFormModal
          companies={companies}
          initial={null}
          loading={createMutation.isPending}
          error={createMutation.error instanceof Error ? createMutation.error.message : undefined}
          onSubmit={(body) => createMutation.mutate(body as Parameters<typeof createEmployee>[0])}
          onClose={() => setModal(null)}
        />
      )}

      {/* Edit modal */}
      {modal === 'edit' && selected && (
        <EmployeeFormModal
          companies={companies}
          initial={selected}
          isEdit
          loading={updateMutation.isPending}
          deleteLoading={deleteMutation.isPending}
          error={updateMutation.error instanceof Error ? updateMutation.error.message : undefined}
          onSubmit={(body) => updateMutation.mutate({
            id: selected.id,
            body: {
              employeeCode: body.employeeCode,
              firstName: body.firstName,
              lastName: body.lastName,
              displayName: body.displayName,
              email: body.email,
              phone: body.phone,
            },
          })}
          onDelete={() => deleteMutation.mutate(selected.id)}
          deleteError={deleteMutation.error instanceof Error ? deleteMutation.error.message : undefined}
          onClose={() => setModal(null)}
        />
      )}

      {/* Assign modal */}
      {modal === 'assign' && selected && assignments !== null && (
        <AssignModal
          employee={selected}
          assignments={assignments}
          currentUserRole={user?.role}
          onSaveRoles={async (body) => {
            await updateEmployeeRoles(selected.id, body);
            setAssignments(await getEmployeeAssignments(selected.id));
            queryClient.invalidateQueries({ queryKey: ['employees'] });
          }}
          onSaveZones={async (body) => {
            await updateEmployeeZones(selected.id, body);
            setAssignments(await getEmployeeAssignments(selected.id));
          }}
          onClose={() => {
            setModal(null);
            setSelected(null);
            setAssignments(null);
          }}
        />
      )}
    </div>
  );
}

function EmployeeFormModal({
  companies,
  initial,
  isEdit,
  loading,
  deleteLoading,
  error,
  onSubmit,
  onDelete,
  deleteError,
  onClose,
}: {
  companies: Company[];
  initial: Employee | null;
  isEdit?: boolean;
  loading: boolean;
  deleteLoading?: boolean;
  error?: string;
  onSubmit: (body: {
    companyId?: string;
    employeeCode: string;
    firstName: string;
    lastName?: string;
    displayName?: string;
    email?: string;
    phone?: string;
  }) => void;
  onDelete?: () => void;
  deleteError?: string;
  onClose: () => void;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [companyId, setCompanyId] = useState(initial?.companyId ?? companies[0]?.id ?? '');
  const [employeeCode, setEmployeeCode] = useState(initial?.employeeCode ?? '');
  const [firstName, setFirstName] = useState(initial?.firstName ?? '');
  const [lastName, setLastName] = useState(initial?.lastName ?? '');
  const [displayName, setDisplayName] = useState(initial?.displayName ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...(isEdit ? {} : { companyId }),
      employeeCode,
      firstName,
      lastName: lastName || undefined,
      displayName: displayName || undefined,
      email: email || undefined,
      phone: phone || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50" onClick={onClose}>
      <div
        className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-display font-semibold text-slate-900">
          {initial ? 'Edit Employee' : 'Add Employee'}
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">Minimal details required</p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-800"
              required
              disabled={!!initial}
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Employee Code</label>
            <input
              type="text"
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-800"
              required
              disabled={!!initial}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-800"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-800"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            {initial && onDelete && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading || deleteLoading}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : initial ? 'Update' : 'Create'}
            </button>
          </div>
        </form>

        {showDeleteConfirm && initial && onDelete && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-slate-900/60 p-4" onClick={() => setShowDeleteConfirm(false)}>
            <div
              className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-semibold text-slate-900">Delete employee?</h3>
              <p className="text-sm text-slate-600 mt-2">
                Are you sure you want to delete {firstName} {lastName}? This will set their status to inactive.
              </p>
              {deleteError && <p className="text-sm text-red-600 mt-2">{deleteError}</p>}
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDelete();
                    setShowDeleteConfirm(false);
                  }}
                  disabled={deleteLoading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AssignModal({
  employee,
  assignments,
  currentUserRole,
  onSaveRoles,
  onSaveZones,
  onClose,
}: {
  employee: Employee;
  assignments: EmployeeAssignments;
  currentUserRole?: UserRole;
  onSaveRoles: (body: { email?: string; password?: string; roleWeb?: string; roleMobile?: string }) => Promise<void>;
  onSaveZones: (body: { zoneIds?: (number | string)[]; noLocation?: boolean }) => Promise<void>;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<'roles' | 'zones'>('roles');
  const [roleWeb, setRoleWeb] = useState(assignments.roleWeb ?? 'employee');
  const [roleMobile, setRoleMobile] = useState(assignments.roleMobile ?? '');
  
  // Get allowed roles based on current user's role
  const allowedRoles = getAllowedRoles(currentUserRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savingRoles, setSavingRoles] = useState(false);
  const [savingZones, setSavingZones] = useState(false);
  const [rolesError, setRolesError] = useState('');

  const { data: sitesData } = useQuery({ queryKey: ['sites'], queryFn: getSites });
  const sites = sitesData?.data ?? [];
  const zonesBySite = useZonesForSites(sites.map((s: { id: string }) => s.id));
  const allZonesWithSite = sites.flatMap((s: { id: string; name: string }) => {
    const list = zonesBySite[s.id] ?? [];
    return list.map((z: AttendanceZone) => ({ ...z, siteName: s.name }));
  });
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>(
    assignments.zones.filter((z) => z.zoneId).map((z) => z.zoneId!)
  );
  const [noLocation, setNoLocation] = useState(assignments.zones.some((z) => z.noLocation));

  const handleSaveRoles = async (e: React.FormEvent) => {
    e.preventDefault();
    setRolesError('');
    setSavingRoles(true);
    try {
      await onSaveRoles({
        email: assignments.userId ? undefined : email,
        password: assignments.userId ? undefined : password,
        roleWeb,
        roleMobile: roleMobile || undefined,
      });
    } catch (err) {
      setRolesError(err instanceof Error ? err.message : 'Failed to save roles');
    } finally {
      setSavingRoles(false);
    }
  };

  const handleSaveZones = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingZones(true);
    try {
      await onSaveZones({
        zoneIds: selectedZoneIds,
        noLocation,
      });
    } finally {
      setSavingZones(false);
    }
  };

  const toggleZone = (id: string) => {
    setSelectedZoneIds((prev) =>
      prev.includes(id) ? prev.filter((z) => z !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-display font-semibold text-slate-900">Assign roles & zones</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {employee.firstName} {employee.lastName} ({employee.employeeCode})
          </p>
        </div>
        <div className="flex border-b border-slate-100">
          <button
            type="button"
            onClick={() => setTab('roles')}
            className={`flex-1 py-3 text-sm font-medium ${tab === 'roles' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-600'}`}
          >
            Roles (Web & Mobile)
          </button>
          <button
            type="button"
            onClick={() => setTab('zones')}
            className={`flex-1 py-3 text-sm font-medium ${tab === 'zones' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-600'}`}
          >
            Attendance Zones
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {tab === 'roles' && (
            <form onSubmit={handleSaveRoles} className="space-y-4">
              {assignments.userId && isTargetRoleAboveCurrentUser(currentUserRole, assignments.roleWeb) && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  You cannot change roles for this user—they have a higher role than yours.
                </p>
              )}
              {assignments.userId && assignments.userEmail && !isTargetRoleAboveCurrentUser(currentUserRole, assignments.roleWeb) && (
                <p className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  Web login: use email <strong className="text-slate-800">{assignments.userEmail}</strong> and the account password.
                </p>
              )}
              {!assignments.userId && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email (create login)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                      placeholder="user@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-lg text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-700 focus:outline-none"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role (Web)</label>
                <select
                  value={roleWeb}
                  onChange={(e) => setRoleWeb(e.target.value)}
                  disabled={!!assignments.userId && isTargetRoleAboveCurrentUser(currentUserRole, assignments.roleWeb)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {allowedRoles.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                {currentUserRole !== 'super_admin' && (
                  <p className="text-xs text-slate-500 mt-1">
                    Note: Only super_admin can assign super_admin role
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role (Mobile)</label>
                <select
                  value={roleMobile}
                  onChange={(e) => setRoleMobile(e.target.value)}
                  disabled={!!assignments.userId && isTargetRoleAboveCurrentUser(currentUserRole, assignments.roleWeb)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="">—</option>
                  {allowedRoles.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              {rolesError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{rolesError}</p>
              )}
              <button
                type="submit"
                disabled={
                  savingRoles ||
                  (!assignments.userId && (!email || !password)) ||
                  (!!assignments.userId && isTargetRoleAboveCurrentUser(currentUserRole, assignments.roleWeb))
                }
                className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {savingRoles ? 'Saving...' : 'Save roles'}
              </button>
            </form>
          )}
          {tab === 'zones' && (
            <form onSubmit={handleSaveZones} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Zones (multiple allowed, any site)</label>
                <div className="space-y-2 max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2">
                  {allZonesWithSite.map((z: AttendanceZone & { siteName?: string }) => (
                    <label key={z.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedZoneIds.includes(z.id)}
                        onChange={() => toggleZone(z.id)}
                        className="rounded border-slate-300 text-primary-600"
                      />
                      <span className="text-sm text-slate-800">{z.name}</span>
                      <span className="text-xs text-slate-500">({z.siteName}, {z.zoneType})</span>
                    </label>
                  ))}
                  {allZonesWithSite.length === 0 && (
                    <p className="text-sm text-slate-500">No zones yet. Add sites and zones under Attendance Zones.</p>
                  )}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={noLocation}
                  onChange={(e) => setNoLocation(e.target.checked)}
                  className="rounded border-slate-300 text-primary-600"
                />
                <span className="text-sm font-medium text-slate-700">No location required (attendance not tied to location)</span>
              </label>
              <button
                type="submit"
                disabled={savingZones}
                className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {savingZones ? 'Saving...' : 'Save zone assignments'}
              </button>
            </form>
          )}
        </div>
        <div className="p-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
