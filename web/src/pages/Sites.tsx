import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSites, createSite, updateSite } from '@/api/sites';
import { getCompanies } from '@/api/companies';
import { TimezoneSelect } from '@/components/TimezoneSelect';
import type { Site, Company } from '@/types';

export function Sites() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<Site | null>(null);

  const { data: sitesData, isLoading } = useQuery({ queryKey: ['sites'], queryFn: getSites });
  const { data: companiesData } = useQuery({ queryKey: ['companies'], queryFn: getCompanies });
  const sites: Site[] = (sitesData as { data?: Site[] })?.data ?? [];
  const companies: Company[] = ((companiesData as { data?: Company[] })?.data ?? []).filter(
    (c) => c.status === 'active'
  );

  const createMutation = useMutation({
    mutationFn: createSite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setModal(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateSite>[1] }) => updateSite(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] });
      setModal(null);
      setSelected(null);
    },
  });

  const openEdit = (site: Site) => {
    setSelected(site);
    setModal('edit');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Sites</h1>
          <p className="text-slate-600 mt-0.5">Create and manage sites under your tenant</p>
        </div>
        <button
          type="button"
          onClick={() => setModal('create')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-soft"
        >
          <span>+</span> Add Site
        </button>
      </div>

      {isLoading ? (
        <div className="py-16 text-center">
          <div className="inline-block w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-card">
          {sites.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              No sites yet. Add a site and then add attendance zones within it.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sites.map((site: Site) => (
                    <tr key={site.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{site.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{site.siteCode}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{site.companyName}</td>
                      <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">{site.description || '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => openEdit(site)}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          Edit
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

      {modal === 'create' && (
        <SiteFormModal
          companies={companies}
          initial={null}
          loading={createMutation.isPending}
          error={createMutation.error instanceof Error ? createMutation.error.message : undefined}
          onSubmit={(body) => createMutation.mutate(body as CreateSiteBody)}
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'edit' && selected && (
        <SiteFormModal
          companies={companies}
          initial={selected}
          loading={updateMutation.isPending}
          error={updateMutation.error instanceof Error ? updateMutation.error.message : undefined}
          onSubmit={(body) => updateMutation.mutate({ id: selected.id, body: body as UpdateSiteBody })}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

type CreateSiteBody = {
  companyId: string;
  siteCode: string;
  name: string;
  description?: string;
  timezone?: string;
};
type UpdateSiteBody = {
  siteCode?: string;
  name?: string;
  description?: string;
  timezone?: string;
};

function SiteFormModal({
  companies,
  initial,
  loading,
  error,
  onSubmit,
  onClose,
}: {
  companies: Company[];
  initial: Site | null;
  loading: boolean;
  error?: string;
  onSubmit: (body: CreateSiteBody | UpdateSiteBody) => void;
  onClose: () => void;
}) {
  const [companyId, setCompanyId] = useState(initial?.companyId ?? companies[0]?.id ?? '');
  const [siteCode, setSiteCode] = useState(initial?.siteCode ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [timezone, setTimezone] = useState(initial?.timezone ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initial) {
      onSubmit({ siteCode, name, description: description || undefined, timezone: timezone || undefined });
    } else {
      onSubmit({
        companyId,
        siteCode,
        name,
        description: description || undefined,
        timezone: timezone || undefined,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-display font-semibold text-slate-900">
          {initial ? 'Edit Site' : 'Add Site'}
        </h2>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {!initial && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-800"
                required
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Site Code</label>
            <input
              type="text"
              value={siteCode}
              onChange={(e) => setSiteCode(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-800"
              required
              disabled={!!initial}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-800"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Timezone</label>
            <TimezoneSelect
              value={timezone}
              onChange={setTimezone}
              placeholder="Select timezone (optional)"
              allowClear
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {loading ? 'Saving...' : initial ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
