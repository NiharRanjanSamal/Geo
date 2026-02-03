import { apiFetch } from './client';
import type { AttendanceReportRow, AttendanceReportParams } from '@/types';

export interface AttendanceReportResponse {
  data: AttendanceReportRow[];
  total?: number;
}

export async function getAttendanceReport(
  params: AttendanceReportParams = {}
): Promise<AttendanceReportResponse> {
  const search = new URLSearchParams();
  if (params.date) search.set('date', params.date);
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);
  if (params.siteId) search.set('siteId', params.siteId);
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.offset != null) search.set('offset', String(params.offset));
  const qs = search.toString();
  const url = qs ? `/api/attendance/report?${qs}` : '/api/attendance/report';
  return apiFetch<AttendanceReportResponse>(url);
}
