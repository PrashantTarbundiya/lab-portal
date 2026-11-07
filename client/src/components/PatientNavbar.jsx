import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LangSwitch from './LangSwitch';

export default function PatientNavbar({ backTo = '/profiles', backLabel = 'Back to Profiles' }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { t } = useLanguage();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-[#0b1924]/80 backdrop-blur-md border-b border-white/10 text-slate-100 py-2.5 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Breadcrumb / Back Navigation */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(backTo)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition-colors cursor-pointer group"
          >
            <svg
              className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span>{backLabel}</span>
          </button>
          
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <span className="text-white/20">/</span>
            <span className="text-emerald-400 font-medium">Patient Vault</span>
          </span>
        </div>

        {/* Right Actions: Helpline & Language Switch */}
        <div className="flex items-center gap-2.5">
          <a
            href="tel:18004259999"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-xs font-medium transition"
            title="24/7 NABL-Accredited Diagnostic Helpline"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="font-mono text-[11px]">1800-425-9999</span>
          </a>

          <LangSwitch />

          <button
            type="button"
            onClick={handleLogout}
            className="text-slate-400 hover:text-rose-400 hover:bg-white/5 p-1.5 rounded-lg border border-transparent hover:border-white/10 transition cursor-pointer"
            title="Sign out"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
}

