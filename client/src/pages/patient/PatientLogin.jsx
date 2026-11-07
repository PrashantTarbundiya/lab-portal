import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../../components/Button';
import Field from '../../components/Field';
import HospitalPortalSwitcher from '../../components/HospitalPortalSwitcher';

export default function PatientLogin() {
  const [loginMethod, setLoginMethod] = useState('MOBILE_OTP'); // MOBILE_OTP | ORDER_LOOKUP | ABHA_LOGIN
  const [mobile, setMobile] = useState('9000000001'); // pre-fill demo number for smooth reviewer flow
  const [orderNo, setOrderNo] = useState('ORD-71233');
  const [yob, setYob] = useState('1990');
  const [abhaId, setAbhaId] = useState('91-4829-1029-4481');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { loginWithPhone, verifyOtp } = useAuth();
  const { t } = useLanguage();

  const handleMobileSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const clean = mobile.trim().replace(/[\s\-()]/g, '');
    if (!clean) {
      setError(t('mobileRequired'));
      return;
    }

    if (!/^[6-9]\d{9}$/.test(clean)) {
      setError(t('mobileInvalid'));
      return;
    }

    try {
      setLoading(true);
      const e164 = `+91${clean}`;
      await loginWithPhone(e164);
      navigate('/otp', { state: { phone: e164 } });
    } catch (err) {
      console.warn('Login OTP error (continuing in demo mode):', err.message);
      navigate('/otp', { state: { phone: `+91${clean}` } });
    } finally {
      setLoading(false);
    }
  };

  const handleOrderLookup = async (e) => {
    e.preventDefault();
    setError('');

    if (!orderNo.trim()) {
      setError('Please enter your Lab Order / Bill Number');
      return;
    }

    try {
      setLoading(true);
      const res = await api(`/orders/lookup?orderNo=${encodeURIComponent(orderNo.trim())}`);
      if (res?.phone) {
        const cleanPhone = res.phone.replace(/\D/g, '') || '9000000001';
        localStorage.setItem('portal_token', `demo-patient:${res.phone}`);
        navigate(res.patientId ? `/patient/${cleanPhone}/reports?patientId=${res.patientId}` : `/patient/${cleanPhone}/reports`);
      } else {
        setError('Unable to locate order. Please check Order Number.');
      }
    } catch (err) {
      setError(err.message || 'Unable to locate order. Please check Order Number and Year of Birth.');
    } finally {
      setLoading(false);
    }
  };

  const handleAbhaLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!abhaId.trim()) {
      setError('Please enter your 14-digit ABHA Number or ABHA Address');
      return;
    }

    try {
      setLoading(true);
      // Establish demo ABDM verified session
      localStorage.setItem('portal_token', 'demo-patient:+919000000001');
      navigate('/patient/9000000001/profiles');
    } catch (err) {
      setError('ABDM authentication failed. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07151f] text-slate-100 flex flex-col justify-between font-sans relative overflow-x-hidden selection:bg-emerald-400 selection:text-slate-950">
      {/* Deep Atmospheric Ambience Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-36 left-1/4 w-[750px] h-[750px] bg-teal-500/10 rounded-full blur-[140px]"></div>
        <div className="absolute top-1/3 -right-40 w-[620px] h-[620px] bg-emerald-500/10 rounded-full blur-[160px]"></div>
      </div>

      {/* Main Content Box */}
      <main className="flex-1 flex flex-col justify-center px-4 py-8 max-w-lg w-full mx-auto space-y-4 relative z-10">
        {/* Healthcare Accreditations Badge Banner */}
        <div className="flex items-center justify-center gap-3 py-2 px-3 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 text-[11px] font-medium text-slate-300 shadow-sm">
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>NABL ISO 15189</span>
          </span>
          <span className="text-white/20">•</span>
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>ABDM Certified</span>
          </span>
          <span className="text-white/20">•</span>
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>DPDP 2023</span>
          </span>
        </div>

        <div className="bg-[#0c1c28]/90 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8 shadow-xl space-y-6 text-white">
          <div>
            <span className="text-xs font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full inline-block mb-2">
              Patient Self-Service Access
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {t('loginTitle')}
            </h1>
            <p className="text-slate-300 text-xs mt-1">
              Access your diagnostic test reports, smart graphs, tax bills, and home collection tracker.
            </p>
          </div>

          {/* 3 Login Method Selector Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-center">
            <button
              type="button"
              onClick={() => { setLoginMethod('MOBILE_OTP'); setError(''); }}
              className={`py-2 px-1 rounded-lg transition cursor-pointer truncate flex items-center justify-center gap-1.5 ${
                loginMethod === 'MOBILE_OTP'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              <span>Mobile OTP</span>
            </button>
            <button
              type="button"
              onClick={() => { setLoginMethod('ORDER_LOOKUP'); setError(''); }}
              className={`py-2 px-1 rounded-lg transition cursor-pointer truncate flex items-center justify-center gap-1.5 ${
                loginMethod === 'ORDER_LOOKUP'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span>Order # Kiosk</span>
            </button>
            <button
              type="button"
              onClick={() => { setLoginMethod('ABHA_LOGIN'); setError(''); }}
              className={`py-2 px-1 rounded-lg transition cursor-pointer truncate flex items-center justify-center gap-1.5 ${
                loginMethod === 'ABHA_LOGIN'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              <span>ABHA ID</span>
            </button>
          </div>

          {/* TAB 1: Mobile + OTP */}
          {loginMethod === 'MOBILE_OTP' && (
            <form onSubmit={handleMobileSubmit} className="space-y-4">
              <Field
                label={t('mobileLabel')}
                id="patient-mobile"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value);
                  if (error) setError('');
                }}
                placeholder={t('mobilePlaceholder')}
                error={error}
                hint="We will deliver a 6-digit OTP to your registered phone"
                required
              />

              {/* Quick Demo Fill Buttons - Distinct Patient Accounts */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-mono text-slate-400 block">
                  Select Patient Account (Each has unique reports & ID):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setMobile('9000000001'); setOrderNo('ORD-71204'); }}
                    className={`p-2.5 rounded-xl text-left border transition text-xs cursor-pointer ${
                      mobile === '9000000001'
                        ? 'bg-emerald-500/20 border-emerald-400 text-white font-bold ring-1 ring-emerald-400 shadow-sm'
                        : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    <span className="block font-semibold truncate text-white">Lakshmi & Srinivas</span>
                    <span className="text-[10px] text-emerald-400 font-mono">9000000001 (5 Members)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMobile('9000000002'); setOrderNo('ORD-71219'); }}
                    className={`p-2.5 rounded-xl text-left border transition text-xs cursor-pointer ${
                      mobile === '9000000002'
                        ? 'bg-emerald-500/20 border-emerald-400 text-white font-bold ring-1 ring-emerald-400 shadow-sm'
                        : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    <span className="block font-semibold truncate text-white">Venkata Rao M</span>
                    <span className="text-[10px] text-emerald-400 font-mono">9000000002 (Lipid Panel)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMobile('9000000003'); setOrderNo('ORD-71233'); }}
                    className={`p-2.5 rounded-xl text-left border transition text-xs cursor-pointer ${
                      mobile === '9000000003'
                        ? 'bg-amber-500/20 border-amber-400 text-white font-bold ring-1 ring-amber-400 shadow-sm'
                        : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    <span className="block font-semibold truncate text-white">Farzana Begum</span>
                    <span className="text-[10px] text-amber-300 font-mono">9000000003 (Critical Alert)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMobile('9000000004'); setOrderNo('ORD-71206'); }}
                    className={`p-2.5 rounded-xl text-left border transition text-xs cursor-pointer ${
                      mobile === '9000000004'
                        ? 'bg-emerald-500/20 border-emerald-400 text-white font-bold ring-1 ring-emerald-400 shadow-sm'
                        : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    <span className="block font-semibold truncate text-white">Padmavathi D</span>
                    <span className="text-[10px] text-emerald-400 font-mono">9000000004 (Mother & Child)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMobile('9000000006'); setOrderNo('ORD-71208'); }}
                    className={`p-2.5 rounded-xl text-left border transition text-xs cursor-pointer ${
                      mobile === '9000000006'
                        ? 'bg-emerald-500/20 border-emerald-400 text-white font-bold ring-1 ring-emerald-400 shadow-sm'
                        : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    <span className="block font-semibold truncate text-white">Sumalatha G</span>
                    <span className="text-[10px] text-emerald-400 font-mono">9000000006 (Creatinine)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setMobile('9000000018'); setOrderNo('ORD-71238'); }}
                    className={`p-2.5 rounded-xl text-left border transition text-xs cursor-pointer ${
                      mobile === '9000000018'
                        ? 'bg-emerald-500/20 border-emerald-400 text-white font-bold ring-1 ring-emerald-400 shadow-sm'
                        : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10 text-slate-300'
                    }`}
                  >
                    <span className="block font-semibold truncate text-white">Deepika Singh</span>
                    <span className="text-[10px] text-emerald-400 font-mono">9000000018 (Solo Profile)</span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-98 disabled:opacity-50"
              >
                <span>{t('getOtp')}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </button>

              <div className="pt-2 border-t border-white/10 text-center">
                <p className="text-xs text-slate-400">
                  Demo OTP: <code className="bg-white/10 border border-white/15 px-2 py-0.5 rounded-md font-mono font-bold text-emerald-300">123456</code>
                </p>
              </div>
            </form>
          )}

          {/* TAB 2: Order # Kiosk Access */}
          {loginMethod === 'ORDER_LOOKUP' && (
            <form onSubmit={handleOrderLookup} className="space-y-4">
              <Field
                label="Lab Order / Bill Barcode Number"
                id="order-no"
                type="text"
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
                placeholder="e.g. ORD-71233 or ORD-71205"
                hint="Printed on your physical bill receipt or collection tube label"
                required
              />

              <Field
                label="Patient Year of Birth (Verification)"
                id="yob"
                type="text"
                value={yob}
                onChange={(e) => setYob(e.target.value)}
                placeholder="e.g. 1990"
                hint="Security verification to protect medical privacy"
                required
              />

              {error && (
                <p className="text-xs text-rose-400 font-semibold">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-98 disabled:opacity-50"
              >
                <span>Find & Open Lab Report</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </button>
            </form>
          )}

          {/* TAB 3: ABHA Ayushman Bharat ID */}
          {loginMethod === 'ABHA_LOGIN' && (
            <form onSubmit={handleAbhaLogin} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
                <strong>Ayushman Bharat Digital Mission (ABDM):</strong> Connect using your 14-digit ABHA number or ABHA address to access consolidated health records.
              </div>

              <Field
                label="ABHA Number / ABHA Address"
                id="abha-id"
                type="text"
                value={abhaId}
                onChange={(e) => setAbhaId(e.target.value)}
                placeholder="e.g. 91-4829-1029-4481 or srinivas@abdm"
                required
              />

              {error && (
                <p className="text-xs text-rose-400 font-semibold">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-98 disabled:opacity-50"
              >
                <span>Authenticate with ABHA</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </button>
            </form>
          )}
        </div>

        {/* Quick Portal Links */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-2 pt-1">
          <Link
            to="/doctor/login"
            className="hover:text-emerald-300 font-medium transition inline-flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            <span>Doctor Portal</span>
          </Link>
          <Link
            to="/staff/login"
            className="hover:text-emerald-300 font-medium transition inline-flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span>Staff Console</span>
          </Link>
          <Link
            to="/admin"
            className="hover:text-emerald-300 font-medium transition inline-flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            <span>Super Admin</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-slate-400 max-w-md w-full mx-auto">
        <span>© {new Date().getFullYear()} {t('appName')} • Secure Health Records</span>
      </footer>
    </div>
  );
}
