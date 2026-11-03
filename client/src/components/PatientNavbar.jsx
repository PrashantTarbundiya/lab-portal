import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LangSwitch from './LangSwitch';

export default function PatientNavbar({ backTo, backLabel }) {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { t } = useLanguage();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="bg-white/95 backdrop-blur-xs border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {backTo ? (
            <button
              type="button"
              onClick={() => navigate(backTo)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              ← {backLabel || 'Back'}
            </button>
          ) : (
            <Link to="/profiles" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-[#0F5E57] flex items-center justify-center text-white font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
                A
              </div>
              <div>
                <span className="font-bold text-slate-900 text-sm tracking-tight block leading-tight">
                  Company A
                </span>
                <span className="text-[10px] text-slate-500 font-medium block">
                  Patient Portal
                </span>
              </div>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          <LangSwitch />

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            title="Log out of patient portal"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Log out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
