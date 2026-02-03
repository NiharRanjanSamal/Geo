import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getTenants, getTenantStats, createTenant, updateTenant, switchTenant } from '@/api/tenants';
import type { Tenant } from '@/api/tenants';
import { useAuth } from '@/contexts/AuthContext';

export function Tenants() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    tenantCode: '',
    name: '',
    subscriptionTier: 'basic',
    status: 'active',
    maxCompanies: '' as string,
  });
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['tenants'],
    queryFn: getTenants,
    enabled: user?.role === 'super_admin',
  });

  const { data: stats } = useQuery({
    queryKey: ['tenant-stats', selectedTenantId],
    queryFn: () => getTenantStats(selectedTenantId!),
    enabled: !!selectedTenantId,
  });

  const createMutation = useMutation({
    mutationFn: createTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setIsCreating(false);
      resetForm();
      alert('Tenant created successfully!');
    },
    onError: (error: Error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateTenant(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setEditingTenant(null);
      resetForm();
      alert('Tenant updated successfully!');
    },
    onError: (error: Error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const switchMutation = useMutation({
    mutationFn: switchTenant,
    onSuccess: (data) => {
      // Reload the page to refresh all data with new tenant context
      alert(data.message);
      window.location.href = '/';
    },
    onError: (error: Error) => {
      alert(`Error switching tenant: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      tenantCode: '',
      name: '',
      subscriptionTier: 'basic',
      status: 'active',
      maxCompanies: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsed = parseInt(formData.maxCompanies, 10);
    const maxCompaniesVal =
      formData.maxCompanies.trim() === '' || isNaN(parsed) ? null : parsed;

    if (editingTenant) {
      updateMutation.mutate({
        id: editingTenant.id,
        data: {
          name: formData.name,
          status: formData.status,
          subscriptionTier: formData.subscriptionTier,
          maxCompanies: maxCompaniesVal,
        },
      });
    } else {
      createMutation.mutate({
        tenantCode: formData.tenantCode,
        name: formData.name,
        subscriptionTier: formData.subscriptionTier,
        maxCompanies: maxCompaniesVal,
      });
    }
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormData({
      tenantCode: tenant.tenantCode,
      name: tenant.name,
      subscriptionTier: tenant.subscriptionTier,
      status: tenant.status,
      maxCompanies: tenant.maxCompanies != null ? String(tenant.maxCompanies) : '',
    });
    setIsCreating(true);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingTenant(null);
    resetForm();
  };

  const handleSwitch = (tenantId: string) => {
    if (window.confirm('Switch to this tenant? You will be redirected to the dashboard.')) {
      switchMutation.mutate(tenantId);
    }
  };

  const tenants: Tenant[] = data?.data ?? [];

  if (user?.role !== 'super_admin') {
    return (
      <div className="py-16 text-center">
        <div className="inline-flex w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4">
          <span className="text-3xl">🚫</span>
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-600">Only super administrators can manage tenants.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Tenant Management</h1>
          <p className="text-slate-600 mt-0.5">Manage organizations and switch between tenant contexts</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-semibold rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-200"
        >
          + Create Tenant
        </button>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-card">
          <h2 className="text-lg font-display font-semibold text-slate-900 mb-4">
            {editingTenant ? 'Edit Tenant' : 'Create New Tenant'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Tenant Code {!editingTenant && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={formData.tenantCode}
                  onChange={(e) => setFormData({ ...formData, tenantCode: e.target.value.toLowerCase() })}
                  disabled={!!editingTenant}
                  required={!editingTenant}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-slate-100 disabled:text-slate-500"
                  placeholder="e.g., acme-corp"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="e.g., Acme Corporation"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Subscription Tier</label>
                <select
                  value={formData.subscriptionTier}
                  onChange={(e) => setFormData({ ...formData, subscriptionTier: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="basic">Basic</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              {editingTenant && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Max Companies</label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxCompanies}
                  onChange={(e) => setFormData({ ...formData, maxCompanies: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Unlimited (leave empty)"
                />
                <p className="text-xs text-slate-500 mt-1">Leave empty for unlimited. Restricts how many companies this organization can create.</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-6 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : editingTenant
                    ? 'Update Tenant'
                    : 'Create Tenant'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2.5 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="py-16 text-center">
          <div className="inline-block w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 mt-3">Loading tenants...</p>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="py-6 rounded-xl bg-red-50 border border-red-100 text-red-700 px-4">
          {error instanceof Error ? error.message : 'Failed to load tenants'}
        </div>
      )}

      {/* Tenants List */}
      {!isLoading && !isError && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tenants.map((tenant) => (
            <div
              key={tenant.id}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-card hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedTenantId(tenant.id === selectedTenantId ? null : tenant.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-display font-semibold text-slate-900">{tenant.name}</h3>
                  <p className="text-sm text-slate-500 font-mono">{tenant.tenantCode}</p>
                </div>
                <span
                  className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                    tenant.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : tenant.status === 'inactive'
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-red-100 text-red-800'
                  }`}
                >
                  {tenant.status}
                </span>
              </div>

              <div className="mb-4 pb-4 border-b border-slate-100 flex flex-wrap gap-2">
                <div className="inline-flex px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                  {tenant.subscriptionTier}
                </div>
                {tenant.maxCompanies != null && (
                  <div className="inline-flex px-3 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full">
                    Max {tenant.maxCompanies} companies
                  </div>
                )}
              </div>

              {selectedTenantId === tenant.id && stats && (
                <div className="mb-4 grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">{stats.companies}</p>
                    <p className="text-xs text-slate-500">Companies</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">{stats.users}</p>
                    <p className="text-xs text-slate-500">Users</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-900">{stats.employees}</p>
                    <p className="text-xs text-slate-500">Employees</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSwitch(tenant.id);
                  }}
                  disabled={switchMutation.isPending}
                  className="flex-1 px-3 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  Switch
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(tenant);
                  }}
                  className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Edit
                </button>
              </div>

              <p className="text-xs text-slate-400 mt-3">
                Created: {new Date(tenant.createdAt * 1000).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {!isLoading && !isError && tenants.length === 0 && (
        <div className="py-16 text-center">
          <div className="inline-flex w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-4">
            <span className="text-3xl">🏢</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No tenants found</h3>
          <p className="text-slate-600 mb-4">Create your first tenant to get started.</p>
        </div>
      )}
    </div>
  );
}
