import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const baseNavItems = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/employees', label: 'Employees', icon: '👥' },
  { to: '/pending-approvals', label: 'Pending Approvals', icon: '⏳', badge: true },
  { to: '/sites', label: 'Sites', icon: '🏢' },
  { to: '/zones', label: 'Attendance Zones', icon: '📍' },
];

const orgAdminNavItems = [
  { to: '/companies', label: 'Companies', icon: '🏛️' },
];

const superAdminNavItems = [
  { to: '/tenants', label: 'Tenant Management', icon: '🌐', adminOnly: true },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const showCompanies = user?.role === 'tenant_admin' || user?.role === 'super_admin';

  const navItems =
    user?.role === 'super_admin'
      ? [...baseNavItems, ...orgAdminNavItems, ...superAdminNavItems]
      : showCompanies
        ? [...baseNavItems, ...orgAdminNavItems]
        : baseNavItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-soft">
        <div className="p-6 border-b border-slate-100">
          <Link to="/" className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center text-white font-display font-bold text-lg">
              G
            </span>
            <span className="font-display font-semibold text-slate-800 text-lg">Geo Attendance</span>
          </Link>
        </div>
        <nav className="p-3 flex-1">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="p-3 border-t border-slate-100">
          <div className="px-3 py-2 rounded-lg bg-slate-50">
            <p className="text-xs font-medium text-slate-500 truncate">Logged in as</p>
            <p className="text-sm font-medium text-slate-800 truncate">{user?.name ?? user?.email}</p>
            {user?.role === 'super_admin' && (
              <div className="mt-1 inline-flex px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                Super Admin
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 w-full px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
