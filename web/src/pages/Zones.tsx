import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSites } from '@/api/sites';
import { getZonesBySite, createZone, updateZone, deleteZone } from '@/api/zones';
import type { AttendanceZone, ZoneType } from '@/types';

export function Zones() {
  const queryClient = useQueryClient();
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [selected, setSelected] = useState<AttendanceZone | null>(null);

  const { data: sitesData } = useQuery({ queryKey: ['sites'], queryFn: getSites });
  const sites: { id: string; name: string }[] = (sitesData as { data?: { id: string; name: string }[] })?.data ?? [];
  const siteId = selectedSiteId || sites[0]?.id || '';
  const { data: zonesData, isLoading } = useQuery({
    queryKey: ['zones', siteId],
    queryFn: () => getZonesBySite(siteId),
    enabled: !!siteId,
  });
  const zones: AttendanceZone[] = (zonesData as { data?: AttendanceZone[] })?.data ?? [];

  const createMutation = useMutation({
    mutationFn: createZone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      setModal(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateZone>[1] }) => updateZone(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      setModal(null);
      setSelected(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteZone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zones'] });
      setModal(null);
      setSelected(null);
    },
  });

  const openEdit = (zone: AttendanceZone) => {
    setSelected(zone);
    setModal('edit');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Attendance Zones</h1>
          <p className="text-slate-600 mt-0.5">Define zones by latitude/longitude or DigiPin within each site</p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="zone-site" className="text-sm font-medium text-slate-700">Site</label>
          <select
            id="zone-site"
            value={siteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-800"
          >
                  {sites.map((s: { id: string; name: string }) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setModal('create')}
            disabled={!siteId}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-soft disabled:opacity-50"
          >
            <span>+</span> Add Zone
          </button>
        </div>
      </div>

      {!siteId ? (
        <div className="py-12 text-center text-slate-500">Create a site first, then add zones.</div>
      ) : isLoading ? (
        <div className="py-16 text-center">
          <div className="inline-block w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-card">
          {zones.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              No zones in this site. Add a zone (circle: lat/long + radius; polygon: points; digipin: code).
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Location / Pin</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {zones.map((z: AttendanceZone) => (
                    <tr key={z.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{z.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{z.zoneCode}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-accent-100 text-accent-800">
                          {z.zoneType}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                        {z.zoneType === 'circle' && z.centerLatitude != null && z.centerLongitude != null && (
                          <>Lat {z.centerLatitude.toFixed(5)}, Long {z.centerLongitude.toFixed(5)}{z.radiusMeters != null ? `, r=${z.radiusMeters}m` : ''}</>
                        )}
                        {z.zoneType === 'polygon' && z.polygonBoundary && (
                          <>{z.polygonBoundary.length} points</>
                        )}
                        {z.zoneType === 'digipin' && z.digipinCode && (
                          <>Pin: {z.digipinCode}</>
                        )}
                        {!z.centerLatitude && !z.digipinCode && (z.zoneType !== 'polygon' || !z.polygonBoundary?.length) && '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button type="button" onClick={() => openEdit(z)} className="text-primary-600 hover:text-primary-700 text-sm font-medium mr-3">
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Delete this zone?')) deleteMutation.mutate(z.id);
                          }}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Delete
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
        <ZoneFormModal
          siteId={siteId}
          initial={null}
          loading={createMutation.isPending}
          error={createMutation.error instanceof Error ? createMutation.error.message : undefined}
          onSubmit={(body) => createMutation.mutate(body as CreateZoneBody)}
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'edit' && selected && (
        <ZoneFormModal
          siteId={selected.siteId}
          initial={selected}
          loading={updateMutation.isPending}
          error={updateMutation.error instanceof Error ? updateMutation.error.message : undefined}
          onSubmit={(body) => updateMutation.mutate({ id: selected.id, body: body as UpdateZoneBody })}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

type CreateZoneBody = {
  siteId: string;
  zoneCode: string;
  name: string;
  description?: string;
  zoneType: 'circle' | 'polygon' | 'digipin';
  centerLatitude?: number;
  centerLongitude?: number;
  radiusMeters?: number;
  polygonBoundary?: Array<{ latitude: number; longitude: number }>;
  digipinCode?: string;
};
type UpdateZoneBody = {
  zoneCode?: string;
  name?: string;
  description?: string;
  zoneType?: string;
  centerLatitude?: number;
  centerLongitude?: number;
  radiusMeters?: number;
  polygonBoundary?: unknown;
  digipinCode?: string;
  status?: string;
};

function ZoneFormModal({
  siteId,
  initial,
  loading,
  error,
  onSubmit,
  onClose,
}: {
  siteId: string;
  initial: AttendanceZone | null;
  loading: boolean;
  error?: string;
  onSubmit: (body: CreateZoneBody | UpdateZoneBody) => void;
  onClose: () => void;
}) {
  const [zoneCode, setZoneCode] = useState(initial?.zoneCode ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [zoneType, setZoneType] = useState<ZoneType>(initial?.zoneType ?? 'circle');
  const [centerLatitude, setCenterLatitude] = useState(
    initial?.centerLatitude != null ? String(initial.centerLatitude) : ''
  );
  const [centerLongitude, setCenterLongitude] = useState(
    initial?.centerLongitude != null ? String(initial.centerLongitude) : ''
  );
  const [radiusMeters, setRadiusMeters] = useState(
    initial?.radiusMeters != null ? String(initial.radiusMeters) : ''
  );
  const [digipinCode, setDigipinCode] = useState(initial?.digipinCode ?? '');
  const [polygonText, setPolygonText] = useState(
    initial?.polygonBoundary
      ? JSON.stringify(initial.polygonBoundary, null, 2)
      : '[{"latitude": 0, "longitude": 0}]'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initial) {
      onSubmit({
        zoneCode,
        name,
        description: description || undefined,
        zoneType,
        centerLatitude: centerLatitude ? Number(centerLatitude) : undefined,
        centerLongitude: centerLongitude ? Number(centerLongitude) : undefined,
        radiusMeters: radiusMeters ? Number(radiusMeters) : undefined,
        polygonBoundary: zoneType === 'polygon' ? (() => {
          try {
            return JSON.parse(polygonText) as Array<{ latitude: number; longitude: number }>;
          } catch {
            return undefined;
          }
        })() : undefined,
        digipinCode: zoneType === 'digipin' ? digipinCode || undefined : undefined,
      });
    } else {
      onSubmit({
        siteId,
        zoneCode,
        name,
        description: description || undefined,
        zoneType,
        centerLatitude: centerLatitude ? Number(centerLatitude) : undefined,
        centerLongitude: centerLongitude ? Number(centerLongitude) : undefined,
        radiusMeters: radiusMeters ? Number(radiusMeters) : undefined,
        polygonBoundary: zoneType === 'polygon' ? (() => {
          try {
            return JSON.parse(polygonText) as Array<{ latitude: number; longitude: number }>;
          } catch {
            return undefined;
          }
        })() : undefined,
        digipinCode: zoneType === 'digipin' ? digipinCode || undefined : undefined,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full my-8 p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-display font-semibold text-slate-900">
          {initial ? 'Edit Zone' : 'Add Zone'}
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Circle: center lat/long + radius. Polygon: JSON array of points. DigiPin: pin code.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Zone Code</label>
            <input
              type="text"
              value={zoneCode}
              onChange={(e) => setZoneCode(e.target.value)}
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
            <select
              value={zoneType}
              onChange={(e) => setZoneType(e.target.value as ZoneType)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-slate-800"
            >
              <option value="circle">Circle (lat/long + radius)</option>
              <option value="polygon">Polygon (points)</option>
              <option value="digipin">DigiPin (code)</option>
            </select>
          </div>

          {zoneType === 'circle' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={centerLatitude}
                    onChange={(e) => setCenterLatitude(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                    placeholder="e.g. 22.8091"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={centerLongitude}
                    onChange={(e) => setCenterLongitude(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                    placeholder="e.g. 86.1877"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Radius (meters)</label>
                <input
                  type="number"
                  min="1"
                  value={radiusMeters}
                  onChange={(e) => setRadiusMeters(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                  placeholder="e.g. 100"
                />
              </div>
            </>
          )}

          {zoneType === 'polygon' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Polygon (JSON array of &#123; latitude, longitude &#125;)</label>
              <textarea
                value={polygonText}
                onChange={(e) => setPolygonText(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-sm text-slate-800"
                placeholder='[{"latitude": 22.809, "longitude": 86.187}, ...]'
              />
            </div>
          )}

          {zoneType === 'digipin' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">DigiPin code</label>
              <input
                type="text"
                value={digipinCode}
                onChange={(e) => setDigipinCode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
                placeholder="e.g. ABC123"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800"
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
