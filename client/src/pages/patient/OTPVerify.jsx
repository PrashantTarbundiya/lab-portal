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
      await verifyOtp(phone, otp);

      // Check if consent was given
      if (!account?.consentAt) {
        navigate('/consent');
      } else {
        navigate('/profiles');
      }
    } catch (err) {
      console.warn('verifyOtp error in demo mode:', err.message);
      // Demo fallback: if demo OTP matches, allow flow
      if (otp === '123456') {
        navigate('/consent');
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
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-between">
      <DemoRibbon />

      <header className="p-4 flex justify-between items-center max-w-md w-full mx-auto">
        <button
          onClick={() => navigate('/')}
          className="text-sm font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1.5"
        >
          ← {t('back')}
        </button>
        <LangSwitch />
      </header>

      <main className="flex-1 flex flex-col justify-center px-4 py-8 max-w-md w-full mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 md:p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
            {t('otpTitle')}
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            {t('otpSubtitle')} <strong className="text-gray-800 font-medium">{phone}</strong>
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
                  className="w-12 h-14 text-center text-2xl font-bold text-gray-900 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:border-[#0F5E57] focus:ring-2 focus:ring-[#0F5E57]/20 outline-none transition-all tabular-nums"
                  aria-label={`Digit ${idx + 1}`}
                />
              ))}
            </div>

            {error && (
              <p className="text-sm text-red-600 font-medium text-center" role="alert" aria-live="polite">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              className="text-base font-semibold"
            >
              {t('verifyOtp')}
            </Button>
          </form>

          {/* Resend Countdown */}
          <div className="mt-6 text-center text-sm">
            {countdown > 0 ? (
              <span className="text-gray-400">
                {t('resendIn')} <strong className="text-gray-600 tabular-nums">{countdown}{t('seconds')}</strong>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="text-[#0F5E57] font-semibold hover:underline"
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
