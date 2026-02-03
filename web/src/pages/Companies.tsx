import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCompanies, createCompany, updateCompany } from '@/api/companies';
import { useAuth } from '@/contexts/AuthContext';
import { TimezoneSelect } from '@/components/TimezoneSelect';
import type { Company } from '@/types';

export function Companies() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: getCompanies,
    enabled: user?.role === 'tenant_admin' || user?.role === 'super_admin',
  });

  const companies: Company[] = data?.data ?? [];
  const maxCompanies = data?.maxCompanies ?? null;
  const currentCount = data?.currentCount ?? companies.length;
  const canCreate = maxCompanies == null || currentCount < maxCompanies;

  const createMutation = useMutation({
    mutationFn: createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setModalOpen(false);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to create company');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { name?: string; timezone?: string; status?: string } }) =>
      updateCompany(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      setEditingCompany(null);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to update company');
    },
  });

  if (user?.role !== 'tenant_admin' && user?.role !== 'super_admin') {
    return (
      <div className="py-16 text-center">
        <div className="inline-flex w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4">
          <span className="text-3xl">🚫</span>
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Denied</h2>
        <p className="text-slate-600">Only organization admins can manage companies.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Company Management</h1>
          <p className="text-slate-600 mt-0.5">
            Create and manage companies within your organization
            {maxCompanies != null && (
              <span className="ml-2 text-slate-500">
                ({currentCount} of {maxCompanies} companies)
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          disabled={!canCreate}
          className="inline-flex gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-soft disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>+</span> Add Company
        </button>
      </div>

      {!canCreate && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          Company limit reached. Contact your administrator to increase the limit for your organization.
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center">
          <div className="inline-block w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : companies.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center text-slate-500 shadow-card">
          No companies yet. Add your first company to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company: Company) => (
            <div
              key={company.id}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-card hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-display font-semibold text-slate-900">{company.name}</h3>
                  <p className="text-sm text-slate-500 font-mono">{company.companyCode}</p>
                </div>
                <span
                  className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${
                    company.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {company.status}
                </span>
              </div>
              <div className="text-sm text-slate-600 mb-4">
                <p>
                  <span className="font-medium text-slate-500">Timezone:</span> {company.timezone}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingCompany(company)}
                className="w-full px-3 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors"
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <CompanyFormModal
          initial={null}
          loading={createMutation.isPending}
          error={createMutation.error instanceof Error ? createMutation.error.message : undefined}
          onSubmit={(body) => createMutation.mutate(body as { companyCode: string; name: string; timezone?: string })}
          onClose={() => setModalOpen(false)}
        />
      )}

      {editingCompany && (
        <CompanyFormModal
          initial={editingCompany}
          loading={updateMutation.isPending}
          error={updateMutation.error instanceof Error ? updateMutation.error.message : undefined}
          onSubmit={(body) =>
            updateMutation.mutate({
              id: editingCompany.id,
              body: { name: body.name, timezone: body.timezone, status: body.status },
            })
          }
          onClose={() => setEditingCompany(null)}
        />
      )}
    </div>
  );
}

function CompanyFormModal({
  initial,
  loading,
  error,
  onSubmit,
  onClose,
}: {
  initial: Company | null;
  loading: boolean;
  error?: string;
  onSubmit: (body: {
    companyCode?: string;
    name: string;
    timezone?: string;
    status?: string;
  }) => void;
  onClose: () => void;
}) {
  const isEdit = !!initial;
  const [companyCode, setCompanyCode] = useState(initial?.companyCode ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [timezone, setTimezone] = useState(initial?.timezone ?? 'UTC');
  const [status, setStatus] = useState(initial?.status ?? 'active');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit) {
      onSubmit({ name, timezone: timezone || undefined, status });
    } else {
      onSubmit({ companyCode, name, timezone: timezone || undefined });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-display font-semibold text-slate-900">
          {isEdit ? 'Edit Company' : 'Add Company'}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company Code</label>
              <input
                type="text"
                value={companyCode}
                onChange={(e) => setCompanyCode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-800"
                placeholder="e.g., company-b"
                required
              />
              <p className="text-xs text-slate-500 mt-0.5">Letters, numbers, hyphens, and underscores only</p>
            </div>
          )}
          {isEdit && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company Code</label>
              <p className="px-3 py-2 bg-slate-50 text-slate-600 rounded-lg font-mono text-sm">{initial?.companyCode}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-800"
              placeholder="e.g., Company B"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Timezone</label>
            <TimezoneSelect
              value={timezone}
              onChange={setTimezone}
              placeholder="Select timezone (default: UTC)"
            />
          </div>
          {isEdit && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-800"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
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
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
