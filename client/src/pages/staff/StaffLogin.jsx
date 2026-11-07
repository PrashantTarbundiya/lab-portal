import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Field from '../../components/Field';
import HospitalPortalSwitcher from '../../components/HospitalPortalSwitcher';

export default function StaffLogin() {
  const [email, setEmail] = useState('frontdesk@demo.local');
  const [password, setPassword] = useState('Demo@12345');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { staffLogin, role } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      const res = await staffLogin(email, password);
      const isDoctor = email.toLowerCase().includes('doctor') || res?.role === 'DOCTOR';
      if (isDoctor) {
        navigate('/doctor');
      } else {
        navigate('/staff');
      }
    } catch (err) {
      console.warn('Staff login error:', err);
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07151f] text-slate-100 flex flex-col justify-between relative overflow-x-hidden selection:bg-emerald-400 selection:text-slate-950 font-sans">
      {/* Atmospheric Ambience Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-36 left-1/4 w-[750px] h-[750px] bg-teal-500/10 rounded-full blur-[140px]"></div>
        <div className="absolute top-1/3 -right-40 w-[620px] h-[620px] bg-emerald-500/10 rounded-full blur-[160px]"></div>
      </div>

      <header className="p-4 max-w-md w-full mx-auto flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/25 border border-emerald-400/30">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-white text-sm leading-tight block">
                LABORA
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Staff
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono block">
              Company A Diagnostics • Front Desk
            </span>
          </div>
        </div>
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 hover:underline font-semibold"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          <span>Patient Portal</span>
        </a>
      </header>

      <main className="flex-1 flex flex-col justify-center px-4 py-8 max-w-md w-full mx-auto">
        <div className="glass-panel-elevated rounded-3xl border border-white/20 p-8 shadow-2xl space-y-6 text-white">
          <div>
            <span className="text-[10px] font-mono font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/40 inline-block">
              Internal Console
            </span>
            <h1 className="text-2xl font-display font-black text-white tracking-tight mt-2">
              Sign In
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              Authorized personnel only. Access is monitored and audited.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              label="Staff Email"
              id="staff-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="frontdesk@demo.local"
              required
            />

            <Field
              label="Password"
              id="staff-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            {error && (
              <p className="text-xs text-red-600 font-semibold" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              className="font-bold"
            >
              Sign In to Console
            </Button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="pt-4 border-t border-white/10 text-xs text-slate-300 space-y-1.5 font-mono">
            <p className="font-semibold text-white">Demo Accounts:</p>
            <p className="text-[11px]">Front Desk: <code className="bg-white/10 text-emerald-300 px-1.5 py-0.5 rounded border border-white/10">frontdesk@demo.local</code> / <code className="bg-white/10 text-slate-200 px-1 py-0.5 rounded border border-white/10">Demo@12345</code></p>
            <p className="text-[11px]">Doctor: <code className="bg-white/10 text-emerald-300 px-1.5 py-0.5 rounded border border-white/10">doctor@demo.local</code> / <code className="bg-white/10 text-slate-200 px-1 py-0.5 rounded border border-white/10">Demo@12345</code></p>
          </div>
        </div>
      </main>

      <footer className="p-4 text-center text-xs text-slate-400">
        <span>Company A Diagnostics • Front Desk & Pathology Console</span>
      </footer>
    </div>
  );
}

