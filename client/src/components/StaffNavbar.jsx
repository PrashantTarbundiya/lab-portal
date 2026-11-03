import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function StaffNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const navItems = [
    { label: 'Orders Console', path: '/staff' },
    { label: 'LIS Import', path: '/staff/import' },
    { label: 'Tasks & Flags', path: '/staff/tasks' },
    { label: 'Access Log', path: '/staff/access-log' },
    { label: 'Operations Report', path: '/staff/operations' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/staff/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-6">
            <Link to="/staff" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-[#0F5E57] flex items-center justify-center text-white font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
                A
              </div>
              <div>
                <span className="font-bold text-slate-900 text-base leading-tight block">
                  Company A
                </span>
                <span className="text-[11px] font-semibold text-[#0F5E57] uppercase tracking-wider block">
                  Staff Console
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-[#0F5E57] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-xs text-slate-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{user?.email || 'frontdesk@demo.local'}</span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
              title="Sign out of staff portal"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Log out</span>
            </button>
          </div>
        </div>

        {/* Mobile secondary navigation */}
        <div className="md:hidden flex overflow-x-auto py-2 space-x-1 border-t border-slate-100 scrollbar-none">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${
                  isActive
                    ? 'bg-[#0F5E57] text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
