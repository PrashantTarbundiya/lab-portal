import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../../components/Button';
import LangSwitch from '../../components/LangSwitch';
import DemoRibbon from '../../components/DemoRibbon';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function LinkLanding() {
  const { token } = useParams();
  const [linkInfo, setLinkInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('initial'); // 'initial' | 'otp_sent' | 'not_for_me_done'
  const [otp, setOtp] = useState(['1', '2', '3', '4', '5', '6']);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [demoOtpCode, setDemoOtpCode] = useState('');

  const navigate = useNavigate();
  const { t } = useLanguage();

  // GET on /info — pure read-only, never alters state or sends OTP!
  useEffect(() => {
    const fetchInfo = async () => {
      try {
        setLoading(true);
        const res = await api(`/links/${token}/info`);
        setLinkInfo(res);
      } catch (err) {
        console.warn('Link info error:', err);
        setLinkInfo({ valid: false });
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, [token]);

  // User explicitly clicks "Send OTP"
  const handleSendOtp = async () => {
    try {
      setSubmitting(true);
      setError('');
      const res = await api(`/links/${token}/request-otp`, { method: 'POST' });
      if (res.demoOtp) {
        setDemoOtpCode(res.demoOtp);
      }
      setStep('otp_sent');
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setSubmitting(false);
    }
  };

  // User submits OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) {
      setError(t('otpRequired'));
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await api(`/links/${token}/verify`, {
        method: 'POST',
        body: { otp: code },
      });

      if (res.orderId) {
        navigate(`/reports/${res.orderId}`);
      } else {
        navigate('/reports');
      }
    } catch (err) {
      setError(err.message || t('otpInvalid'));
    } finally {
      setSubmitting(false);
    }
  };

  // "This is not for me" path
  const handleNotForMe = async () => {
    try {
      setSubmitting(true);
      await api(`/links/${token}/not-for-me`, { method: 'POST' });
      setStep('not_for_me_done');
    } catch (err) {
      console.warn('Not for me error:', err);
      setStep('not_for_me_done');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // EXPIRED, REVOKED, OR UNKNOWN TOKEN
  if (!linkInfo?.valid) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-between">
        <DemoRibbon />
        <header className="p-4 flex justify-between items-center max-w-md w-full mx-auto">
          <span className="font-bold text-gray-900">{t('appName')}</span>
          <LangSwitch />
        </header>

        <main className="flex-1 flex flex-col justify-center px-4 py-8 max-w-md w-full mx-auto text-center">
          <div className="bg-white rounded-2xl border border-gray-200/90 p-8 shadow-sm space-y-4">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400 text-2xl">
              ⏱
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              {t('invalidLinkTitle')}
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed">
              {t('invalidLinkDesc')}
            </p>
            <div className="pt-2">
              <Button
                variant="primary"
                fullWidth
                onClick={() => navigate('/')}
              >
                {t('loginButton')}
              </Button>
            </div>
          </div>
        </main>

        <footer className="p-4 text-center text-xs text-gray-400">
          <span>Company A Diagnostics</span>
        </footer>
      </div>
    );
  }

  // "NOT FOR ME" CONFIRMATION SCREEN
  if (step === 'not_for_me_done') {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-between">
        <DemoRibbon />
        <header className="p-4 flex justify-between items-center max-w-md w-full mx-auto">
          <span className="font-bold text-gray-900">{linkInfo.labName}</span>
          <LangSwitch />
        </header>

        <main className="flex-1 flex flex-col justify-center px-4 py-8 max-w-md w-full mx-auto text-center">
          <div className="bg-white rounded-2xl border border-gray-200/90 p-8 shadow-sm space-y-4">
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 text-2xl">
              ✓
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              Thank You
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed">
              We have noted that this number was incorrect. The link has been disabled and our staff will verify the contact details.
            </p>
          </div>
        </main>

        <footer className="p-4 text-center text-xs text-gray-400">
          <span>Company A Diagnostics</span>
        </footer>
      </div>
    );
  }

  // OTP ENTER SCREEN (after pressing Send OTP)
  if (step === 'otp_sent') {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-between">
        <DemoRibbon />
        <header className="p-4 flex justify-between items-center max-w-md w-full mx-auto">
          <span className="font-bold text-gray-900">{linkInfo.labName}</span>
          <LangSwitch />
        </header>

        <main className="flex-1 flex flex-col justify-center px-4 py-8 max-w-md w-full mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200/90 p-6 md:p-8 shadow-sm space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                {t('otpTitle')}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {t('otpSubtitle')} <strong className="text-gray-800">{linkInfo.maskedPhone}</strong>
              </p>
            </div>

            {demoOtpCode && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-900 text-center">
                Demo OTP: <strong>{demoOtpCode}</strong>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="flex justify-between gap-2">
                {otp.map((d, i) => (
                  <input
                    key={i}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '');
                      const next = [...otp];
                      next[i] = clean;
                      setOtp(next);
                    }}
                    className="w-12 h-14 text-center text-2xl font-bold border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:border-[#0F5E57] outline-none tabular-nums"
                  />
                ))}
              </div>

              {error && (
                <p className="text-xs text-red-600 font-semibold text-center">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={submitting}
                className="font-bold text-base"
              >
                {t('verifyOtp')}
              </Button>
            </form>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleNotForMe}
                className="text-xs text-gray-400 hover:text-gray-700 underline"
              >
                {t('notForMe')}
              </button>
            </div>
          </div>
        </main>

        <footer className="p-4 text-center text-xs text-gray-400">
          <span>Company A Diagnostics • Secure Link Portal</span>
        </footer>
      </div>
    );
  }

  // INITIAL NEUTRAL LANDING GATE
  // Shows ONLY: lab name, "Your report is ready", button "Send OTP to ••••1234", and "This is not for me"
  // NO PATIENT NAME, NO TEST NAME!
  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-between">
      <DemoRibbon />

      <header className="p-4 flex justify-between items-center max-w-md w-full mx-auto">
        <span className="font-bold text-gray-900 text-base">{linkInfo.labName}</span>
        <LangSwitch />
      </header>

      <main className="flex-1 flex flex-col justify-center px-4 py-8 max-w-md w-full mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200/90 p-6 md:p-8 shadow-sm space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto text-[#0F5E57] text-2xl font-bold">
            📋
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {t('linkGateSubtitle')}
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              For your privacy, reports are protected with mobile OTP verification.
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/80">
            <span className="text-xs text-gray-500 block mb-1">
              {t('sendOtpTo')}
            </span>
            <span className="text-lg font-bold text-gray-800 tracking-wider font-mono">
              {linkInfo.maskedPhone}
            </span>
          </div>

          {error && (
            <p className="text-xs text-red-600 font-semibold">{error}</p>
          )}

          <Button
            variant="primary"
            fullWidth
            size="lg"
            loading={submitting}
            onClick={handleSendOtp}
            className="font-bold text-base shadow-sm"
          >
            {t('sendOtpButton')} →
          </Button>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleNotForMe}
              className="text-xs text-gray-400 hover:text-gray-700 underline font-medium"
            >
              {t('notForMe')}
            </button>
          </div>
        </div>
      </main>

      <footer className="p-4 text-center text-xs text-gray-400">
        <span>Company A Diagnostics • Secure Link Gate</span>
      </footer>
    </div>
  );
}
