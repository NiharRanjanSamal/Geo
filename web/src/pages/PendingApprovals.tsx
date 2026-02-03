import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPendingUsers, approveUser, rejectUser } from '@/api/pending-users';
import type { PendingUser } from '@/api/pending-users';

export function PendingApprovals() {
  const queryClient = useQueryClient();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data: pendingData, isLoading } = useQuery({
    queryKey: ['pending-users'],
    queryFn: getPendingUsers,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const pendingUsers: PendingUser[] = pendingData?.data ?? [];

  const approveMutation = useMutation({
    mutationFn: (userId: string) => approveUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setActionLoading(null);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to approve user');
      setActionLoading(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (userId: string) => rejectUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      setActionLoading(null);
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Failed to reject user');
      setActionLoading(null);
    },
  });

  const handleApprove = (userId: string) => {
    if (window.confirm('Are you sure you want to approve this user? They will be able to login immediately.')) {
      setActionLoading(userId);
      approveMutation.mutate(userId);
    }
  };

  const handleReject = (userId: string, email: string) => {
    if (window.confirm(`Are you sure you want to reject ${email}? This will permanently delete their registration.`)) {
      setActionLoading(userId);
      rejectMutation.mutate(userId);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading pending registrations...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold text-slate-900">Pending Approvals</h1>
        <p className="text-slate-600 mt-1">Review and approve employee registrations from the mobile app</p>
      </div>

      {pendingUsers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-soft p-12 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">All caught up!</h2>
          <p className="text-slate-600">There are no pending registrations to review.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-soft overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
            <p className="text-sm font-medium text-slate-700">
              {pendingUsers.length} pending {pendingUsers.length === 1 ? 'registration' : 'registrations'}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Employee Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pendingUsers.map((user) => {
                  const isProcessing = actionLoading === user.userId;
                  return (
                    <tr key={user.userId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-slate-900">
                            {user.firstName} {user.lastName}
                          </div>
                          {user.displayName && (
                            <div className="text-sm text-slate-500">"{user.displayName}"</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900">{user.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                          {user.employeeCode}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-slate-900">{user.companyName}</div>
                          <div className="text-xs text-slate-500">{user.companyCode}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">{formatDate(user.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleApprove(user.userId)}
                          disabled={isProcessing}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessing ? '...' : '✓ Approve'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(user.userId, user.email)}
                          disabled={isProcessing}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessing ? '...' : '✗ Reject'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
