import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../../components/Button';
import LangSwitch from '../../components/LangSwitch';
import DemoRibbon from '../../components/DemoRibbon';

export default function OTPVerify() {
  const [digits, setDigits] = useState(['1', '2', '3', '4', '5', '6']); // pre-filled for demo ease
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(45);
  const inputRefs = useRef([]);

  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtp, loginWithPhone, account } = useAuth();
  const { t } = useLanguage();

  const phone = location.state?.phone || '+919000000001';

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index, value) => {
    // Only accept numbers
    const clean = value.replace(/\D/g, '');
    const newDigits = [...digits];

    if (clean.length > 1) {
      // Paste support
      const pasted = clean.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setDigits(newDigits);
      const nextIdx = Math.min(pasted.length, 5);
      inputRefs.current[nextIdx]?.focus();
      return;
    }

    newDigits[index] = clean;
    setDigits(newDigits);
    setError('');

    // Auto-advance
    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length < 6) {
      setError(t('otpRequired'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await verifyOtp(phone, otp);

      const cleanPhone = (res?.account?.mobileE164 || phone).replace(/\D/g, '') || '9000000001';
      // Check if consent was already given
      const hasConsent = res?.account?.consentAt || account?.consentAt;
      if (!hasConsent) {
        navigate('/consent', { state: { phone, identifier: cleanPhone } });
      } else {
        navigate(`/patient/${cleanPhone}/profiles`);
      }
    } catch (err) {
      console.warn('verifyOtp error in demo mode:', err.message);
      // Demo fallback: if demo OTP matches, allow flow
      if (otp === '123456') {
        const cleanPhone = (phone || '').replace(/\D/g, '') || '9000000001';
        localStorage.setItem('portal_token', `demo-patient:+91${cleanPhone}`);
        navigate(`/patient/${cleanPhone}/profiles`);
      } else {
        setError(t('otpInvalid'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      setCountdown(60);
      await loginWithPhone(phone);
    } catch (err) {
      console.warn('Resend error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#07151f] text-slate-100 flex flex-col justify-between relative overflow-x-hidden selection:bg-emerald-400 selection:text-slate-950 font-sans">
      {/* Deep Atmospheric Ambience Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-36 left-1/4 w-[750px] h-[750px] bg-teal-500/10 rounded-full blur-[140px]"></div>
        <div className="absolute top-1/3 -right-40 w-[620px] h-[620px] bg-emerald-500/10 rounded-full blur-[160px]"></div>
      </div>

      <DemoRibbon />

      <header className="p-4 flex justify-between items-center max-w-md w-full mx-auto relative z-10">
        <button
          onClick={() => navigate('/')}
          className="text-sm font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>{t('back')}</span>
        </button>
        <LangSwitch />
      </header>

      <main className="flex-1 flex flex-col justify-center px-4 py-8 max-w-md w-full mx-auto">
        <div className="glass-panel-elevated rounded-3xl border border-white/20 p-6 md:p-8 shadow-2xl text-white">
          <h1 className="text-2xl font-display font-black text-white tracking-tight mb-2">
            {t('otpTitle')}
          </h1>
          <p className="text-slate-300 text-sm mb-6">
            {t('otpSubtitle')} <strong className="text-emerald-400 font-mono font-bold">{phone}</strong>
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 6 Digit Boxes */}
            <div className="flex justify-between gap-2">
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-12 h-14 text-center text-2xl font-bold font-mono text-white bg-[#07151f]/80 border border-white/20 rounded-2xl focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 outline-none transition-all tabular-nums"
                  aria-label={`Digit ${idx + 1}`}
                />
              ))}
            </div>

            {error && (
              <p className="text-sm text-rose-400 font-medium text-center" role="alert" aria-live="polite">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              className="text-base font-black shadow-md shadow-emerald-500/25 py-3 rounded-xl cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{t('verifyOtp')}</span>
              <svg className="w-4 h-4 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Button>
          </form>

          {/* Resend Countdown */}
          <div className="mt-6 text-center text-sm">
            {countdown > 0 ? (
              <span className="text-slate-400">
                {t('resendIn')} <strong className="text-emerald-400 font-mono tabular-nums">{countdown}{t('seconds')}</strong>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-emerald-400 font-bold hover:underline cursor-pointer"
              >
                {t('resendOtp')}
              </button>
            )}
          </div>
        </div>
      </main>

      <footer className="p-4 text-center text-xs text-gray-400 max-w-md w-full mx-auto">
        <span>Company A Diagnostics • Secure OTP Verification</span>
      </footer>
    </div>
  );
}

