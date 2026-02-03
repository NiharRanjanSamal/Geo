import { Router, Response } from 'express';
import { query } from '../config/db.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import type { Row } from '../config/db.js';

const router = Router();

router.get('/site/:siteId', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const siteId = Number(req.params.siteId);
    if (Number.isNaN(siteId)) {
      res.status(400).json({ message: 'Invalid siteId' });
      return;
    }
    const rows = await query<Row[]>(
      `SELECT id, site_id, zone_code, name, description, zone_type,
              center_latitude, center_longitude, radius_meters, polygon_boundary, digipin_code, status
       FROM site_zone WHERE site_id = ? ORDER BY zone_code`,
      [siteId]
    );
    const list = Array.isArray(rows) ? rows : rows ? [rows] : [];
    res.json({
      data: list.map((r) => ({
        id: String(r.id),
        siteId: String(r.site_id),
        zoneCode: r.zone_code,
        name: r.name,
        description: r.description ?? '',
        zoneType: r.zone_type ?? 'circle',
        centerLatitude: r.center_latitude ?? null,
        centerLongitude: r.center_longitude ?? null,
        radiusMeters: r.radius_meters ?? null,
        polygonBoundary: r.polygon_boundary ?? null,
        digipinCode: r.digipin_code ?? null,
        status: r.status,
      })),
    });
  } catch (err) {
    console.error('Zones list error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jwt = req.jwt!;
    if (jwt.role !== 'super_admin' && jwt.role !== 'tenant_admin' && jwt.role !== 'company_admin' && jwt.role !== 'site_admin') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    const body = req.body as {
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
    const { siteId, zoneCode, name, zoneType } = body;
    if (!siteId || !zoneCode || !name || !zoneType) {
      res.status(400).json({ message: 'siteId, zoneCode, name, and zoneType are required' });
      return;
    }
    const sid = Number(siteId);
    if (Number.isNaN(sid)) {
      res.status(400).json({ message: 'Invalid siteId' });
      return;
    }
    const polygonJson = body.polygonBoundary ? JSON.stringify(body.polygonBoundary) : null;
    const now = Math.floor(Date.now() / 1000);
    await query(
      `INSERT INTO site_zone (site_id, zone_code, name, description, zone_type,
        center_latitude, center_longitude, radius_meters, polygon_boundary, digipin_code, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
      [
        sid,
        String(zoneCode).trim(),
        String(name).trim(),
        body.description ?? null,
        zoneType,
        body.centerLatitude ?? null,
        body.centerLongitude ?? null,
        body.radiusMeters ?? null,
        polygonJson,
        body.digipinCode ?? null,
        now,
        now,
      ]
    );
    const [inserted] = await query<Row[]>(
      `SELECT id, zone_code, name FROM site_zone WHERE site_id = ? AND zone_code = ? LIMIT 1`,
      [sid, String(zoneCode).trim()]
    );
    const row = Array.isArray(inserted) ? inserted[0] : inserted;
    res.status(201).json({ id: String(row?.id), zoneCode: row?.zone_code, name: row?.name });
  } catch (err) {
    console.error('Zone create error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jwt = req.jwt!;
    if (jwt.role !== 'super_admin' && jwt.role !== 'tenant_admin' && jwt.role !== 'company_admin' && jwt.role !== 'site_admin') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ message: 'Invalid zone id' });
      return;
    }
    const body = req.body as {
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
    const updates: string[] = [];
    const params: unknown[] = [];
    if (body.zoneCode != null) updates.push('zone_code = ?'), params.push(String(body.zoneCode).trim());
    if (body.name != null) updates.push('name = ?'), params.push(String(body.name).trim());
    if (body.description !== undefined) updates.push('description = ?'), params.push(body.description || null);
    if (body.zoneType != null) updates.push('zone_type = ?'), params.push(body.zoneType);
    if (body.centerLatitude !== undefined) updates.push('center_latitude = ?'), params.push(body.centerLatitude ?? null);
    if (body.centerLongitude !== undefined) updates.push('center_longitude = ?'), params.push(body.centerLongitude ?? null);
    if (body.radiusMeters !== undefined) updates.push('radius_meters = ?'), params.push(body.radiusMeters ?? null);
    if (body.polygonBoundary !== undefined) updates.push('polygon_boundary = ?'), params.push(body.polygonBoundary ? JSON.stringify(body.polygonBoundary) : null);
    if (body.digipinCode !== undefined) updates.push('digipin_code = ?'), params.push(body.digipinCode ?? null);
    if (body.status != null) updates.push('status = ?'), params.push(body.status);
    if (updates.length === 0) {
      res.status(400).json({ message: 'No fields to update' });
      return;
    }
    params.push(Math.floor(Date.now() / 1000), id);
    await query(`UPDATE site_zone SET ${updates.join(', ')}, updated_at = ? WHERE id = ?`, params);
    res.json({ ok: true });
  } catch (err) {
    console.error('Zone update error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const jwt = req.jwt!;
    if (jwt.role !== 'super_admin' && jwt.role !== 'tenant_admin' && jwt.role !== 'company_admin' && jwt.role !== 'site_admin') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ message: 'Invalid zone id' });
      return;
    }
    await query('DELETE FROM site_zone WHERE id = ?', [id]);
    res.status(204).send();
  } catch (err) {
    console.error('Zone delete error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
