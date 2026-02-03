import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAttendanceReport } from '@/api/attendance';
import { getEmployees } from '@/api/employees';
import type { AttendanceReportRow, SiteBreakdownRow, Employee } from '@/types';

function formatTime(value: string | null): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatMinutes(min: number | null): string {
  if (min == null) return '—';
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function Dashboard() {
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [breakdownRow, setBreakdownRow] = useState<AttendanceReportRow | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['attendance-report', date],
    queryFn: () => getAttendanceReport({ date }),
  });
  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  });

  const rows: AttendanceReportRow[] = data?.data ?? [];
  const employees: Employee[] = (employeesData as { data?: Employee[] } | undefined)?.data ?? [];
  const totalEmployees = employees.filter((e) => e.status === 'active').length;
  const checkedIn = rows.filter((r) => r.checkInTime != null).length;
  const checkedOut = rows.filter((r) => r.checkOutTime != null).length;
  const absent = Math.max(0, totalEmployees - rows.length);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-0.5">See who&apos;s present and their timing</p>
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="report-date" className="text-sm font-medium text-slate-700">
            Date
          </label>
          <input
            id="report-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-slate-800"
          />
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-soft"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
          <p className="text-sm font-medium text-slate-500">Checked in</p>
          <p className="text-2xl font-display font-bold text-primary-600 mt-1">{checkedIn}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
          <p className="text-sm font-medium text-slate-500">Checked out</p>
          <p className="text-2xl font-display font-bold text-slate-800 mt-1">{checkedOut}</p>
          <p className="text-xs text-slate-400 mt-0.5">Completed today</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card">
          <p className="text-sm font-medium text-slate-500">Absent</p>
          <p className="text-2xl font-display font-bold text-slate-800 mt-1">{absent}</p>
          <p className="text-xs text-slate-400 mt-0.5">No attendance marked</p>
        </div>
      </div>

      {isLoading && (
        <div className="py-16 text-center">
          <div className="inline-block w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 mt-3">Loading attendance...</p>
        </div>
      )}

      {isError && (
        <div className="py-6 rounded-xl bg-red-50 border border-red-100 text-red-700 px-4">
          {error instanceof Error ? error.message : 'Failed to load report'}
        </div>
      )}

      {!isLoading && !isError && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-card">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-display font-semibold text-slate-900">Attendance Report</h2>
            <p className="text-sm text-slate-500 mt-0.5">All employees with check-in / check-out and total time</p>
          </div>
          {rows.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              No attendance records for this date.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Site
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Check-in
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Check-out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {rows.map((row) => (
                    <tr
                      key={`${row.employeeId}-${row.date}-${row.siteId}`}
                      className={row.status === 'present' ? 'bg-primary-50/40' : ''}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {row.employeeName}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {row.employeeCode}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {row.siteName === 'Multiple' && row.siteBreakdown && row.siteBreakdown.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => setBreakdownRow(row)}
                            className="text-primary-600 hover:text-primary-700 font-medium underline underline-offset-1"
                          >
                            Multiple
                          </button>
                        ) : (
                          row.siteName
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 tabular-nums">
                        {formatTime(row.checkInTime)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 tabular-nums">
                        {formatTime(row.checkOutTime)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700 tabular-nums">
                        {formatMinutes(row.totalMinutes)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                            row.status === 'present'
                              ? 'bg-primary-100 text-primary-800'
                              : row.status === 'partial'
                                ? 'bg-amber-100 text-amber-800'
                                : row.status === 'leave'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Site breakdown modal when "Multiple" is clicked */}
      {breakdownRow && breakdownRow.siteBreakdown && breakdownRow.siteBreakdown.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50"
          onClick={() => setBreakdownRow(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-display font-semibold text-slate-900">
              Check-in / Check-out by location
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              {breakdownRow.employeeName} ({breakdownRow.employeeCode})
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Site</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Check-in</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600 uppercase">Check-out</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {breakdownRow.siteBreakdown.map((s: SiteBreakdownRow, i: number) => (
                    <tr key={i}>
                      <td className="px-3 py-2 font-medium text-slate-900">{s.siteName}</td>
                      <td className="px-3 py-2 text-slate-700 tabular-nums">{formatTime(s.checkInTime)}</td>
                      <td className="px-3 py-2 text-slate-700 tabular-nums">{formatTime(s.checkOutTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setBreakdownRow(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
