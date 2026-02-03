import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';

const MANAGER_ROLES: UserRole[] = [
  'super_admin',
  'tenant_admin',
  'company_admin',
  'site_admin',
];

const ORG_ADMIN_ROLES: UserRole[] = ['super_admin', 'tenant_admin'];

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireManager?: boolean;
  requireOrgAdmin?: boolean;
}

export function ProtectedRoute({
  children,
  requireManager = true,
  requireOrgAdmin = false,
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireManager && user.role && !MANAGER_ROLES.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-6">
          <h1 className="text-xl font-semibold text-gray-800">Access denied</h1>
          <p className="mt-2 text-gray-600">
            You need a manager or admin role to view this page.
          </p>
        </div>
      </div>
    );
  }

  if (requireOrgAdmin && user.role && !ORG_ADMIN_ROLES.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
