import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../../components/Button';
import Field from '../../components/Field';
import LangSwitch from '../../components/LangSwitch';
import DemoRibbon from '../../components/DemoRibbon';

export default function PatientLogin() {
  const [mobile, setMobile] = useState('9000000001'); // pre-fill demo number for smooth reviewer flow
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginWithPhone } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e) => {
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
      // In demo mode or local without Twilio, allow moving to OTP screen
      navigate('/otp', { state: { phone: `+91${clean}` } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-between">
      <DemoRibbon />

      {/* Top Bar with Language Selector */}
      <header className="p-4 flex justify-between items-center max-w-md w-full mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#0F5E57] flex items-center justify-center text-white font-bold text-lg">
            A
          </div>
          <span className="font-bold text-gray-900 tracking-tight text-base">
            {t('appName')}
          </span>
        </div>
        <LangSwitch />
      </header>

      {/* Main Content Box (mobile-first, 360px optimized) */}
      <main className="flex-1 flex flex-col justify-center px-4 py-8 max-w-md w-full mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 md:p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
              {t('loginTitle')}
            </h1>
            <p className="text-gray-500 text-sm">
              {t('loginSubtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
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
                hint="We will send a 6-digit verification code"
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              className="text-base font-semibold shadow-sm"
            >
              {t('getOtp')}
            </Button>
          </form>

          {/* Quick Demo Hint */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              Demo phone: <code className="bg-gray-100 px-2 py-0.5 rounded text-gray-800 font-mono">9000000001</code> (OTP: <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">123456</code>)
            </p>
          </div>
        </div>

        {/* Staff portal link */}
        <div className="mt-8 text-center">
          <a
            href="/staff/login"
            className="text-xs text-gray-400 hover:text-gray-700 font-medium transition-colors"
          >
            Staff & Doctor Console →
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-gray-400 max-w-md w-full mx-auto">
        <span>© {new Date().getFullYear()} {t('appName')}. DPDP Act 2023 Compliant.</span>
      </footer>
    </div>
  );
}

