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
      setError(t('otpIncomplete') || 'Please enter all 6 digits');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const res = await api(`/links/${token}/verify-otp`, {
        method: 'POST',
        body: { otp: code },
      });

      // If consent needed, route to consent gate
      if (res.consentRequired) {
        navigate(`/consent`, {
          state: {
            token,
            orderId: res.orderId,
            patientName: res.patientName,
          },
        });
        return;
      }

      // Success -> navigate to report
      navigate(`/reports/${res.orderId}`, { state: { token } });
    } catch (err) {
      setError(err.message || t('otpInvalid'));
    } finally {
      setSubmitting(false);
    }
  };

  // User clicks "This is not for me"
  const handleNotForMe = async () => {
    try {
      setSubmitting(true);
      await api(`/links/${token}/not-for-me`, { method: 'POST' });
      setStep('not_for_me_done');
    } catch (err) {
      console.warn('not-for-me error:', err);
      setStep('not_for_me_done');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07151f] flex items-center justify-center text-slate-100">
        <LoadingSpinner />
      </div>
    );
  }

  // EXPIRED, REVOKED, OR UNKNOWN TOKEN
  if (!linkInfo?.valid) {
    return (
      <div className="min-h-screen bg-[#07151f] text-slate-100 flex flex-col justify-between font-sans relative overflow-x-hidden selection:bg-emerald-400 selection:text-slate-950">
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-36 left-1/4 w-[750px] h-[750px] bg-teal-500/10 rounded-full blur-[140px]"></div>
          <div className="absolute top-1/3 -right-40 w-[620px] h-[620px] bg-emerald-500/10 rounded-full blur-[160px]"></div>
        </div>

        <DemoRibbon />
        <header className="p-4 flex justify-between items-center max-w-md w-full mx-auto relative z-10">
          <span className="font-black text-white font-display text-lg">{t('appName')}</span>
          <LangSwitch />
        </header>

        <main className="flex-1 flex flex-col justify-center px-4 py-8 max-w-md w-full mx-auto text-center relative z-10">
          <div className="glass-panel-elevated rounded-3xl border border-white/20 p-8 shadow-2xl space-y-4 text-white">
            <div className="w-14 h-14 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-center justify-center mx-auto text-rose-300 shadow-sm">
              <svg className="w-7 h-7 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h1 className="text-xl font-display font-black text-white">
              {t('invalidLinkTitle')}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
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

        <footer className="p-4 text-center text-xs text-slate-400 relative z-10">
          <span>Company A Diagnostics</span>
        </footer>
      </div>
    );
  }

  // "NOT FOR ME" CONFIRMATION SCREEN
  if (step === 'not_for_me_done') {
    return (
      <div className="min-h-screen bg-[#07151f] text-slate-100 flex flex-col justify-between font-sans relative overflow-x-hidden selection:bg-emerald-400 selection:text-slate-950">
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-36 left-1/4 w-[750px] h-[750px] bg-teal-500/10 rounded-full blur-[140px]"></div>
          <div className="absolute top-1/3 -right-40 w-[620px] h-[620px] bg-emerald-500/10 rounded-full blur-[160px]"></div>
        </div>

        <DemoRibbon />
        <header className="p-4 flex justify-between items-center max-w-md w-full mx-auto relative z-10">
          <span className="font-black text-white font-display text-lg">{linkInfo.labName}</span>
          <LangSwitch />
        </header>

        <main className="flex-1 flex flex-col justify-center px-4 py-8 max-w-md w-full mx-auto text-center relative z-10">
          <div className="glass-panel-elevated rounded-3xl border border-white/20 p-8 shadow-2xl space-y-4 text-white">
            <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center justify-center mx-auto text-emerald-300 shadow-sm">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h1 className="text-xl font-display font-black text-white">
              Thank You
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              We have noted that this number was incorrect. The link has been disabled and our staff will verify the contact details.
            </p>
          </div>
        </main>

        <footer className="p-4 text-center text-xs text-slate-400 relative z-10">
          <span>Company A Diagnostics</span>
        </footer>
      </div>
    );
  }

  // OTP ENTER SCREEN (after pressing Send OTP)
  if (step === 'otp_sent') {
    return (
      <div className="min-h-screen bg-[#07151f] text-slate-100 flex flex-col justify-between font-sans relative overflow-x-hidden selection:bg-emerald-400 selection:text-slate-950">
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-36 left-1/4 w-[750px] h-[750px] bg-teal-500/10 rounded-full blur-[140px]"></div>
          <div className="absolute top-1/3 -right-40 w-[620px] h-[620px] bg-emerald-500/10 rounded-full blur-[160px]"></div>
        </div>

        <DemoRibbon />
        <header className="p-4 flex justify-between items-center max-w-md w-full mx-auto relative z-10">
          <span className="font-black text-white font-display text-lg">{linkInfo.labName}</span>
          <LangSwitch />
        </header>

        <main className="flex-1 flex flex-col justify-center px-4 py-8 max-w-md w-full mx-auto relative z-10">
          <div className="glass-panel-elevated rounded-3xl border border-white/20 p-6 md:p-8 shadow-2xl space-y-6 text-white">
            <div>
              <h1 className="text-2xl font-display font-black text-white tracking-tight">
                {t('otpTitle')}
              </h1>
              <p className="text-sm text-slate-300 mt-1">
                {t('otpSubtitle')} <strong className="text-emerald-400 font-mono font-bold">{linkInfo.maskedPhone}</strong>
              </p>
            </div>

            {demoOtpCode && (
              <div className="p-3 bg-amber-500/15 border border-amber-500/35 rounded-2xl text-xs font-mono font-bold text-amber-200 text-center">
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
                    className="w-12 h-14 text-center text-2xl font-mono font-bold border border-white/20 rounded-2xl bg-[#07151f]/80 text-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 outline-none tabular-nums shadow-inner transition"
                  />
                ))}
              </div>

              {error && (
                <p className="text-xs text-rose-400 font-semibold text-center">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={submitting}
                className="font-black text-base shadow-lg shadow-emerald-500/25 py-3 rounded-xl cursor-pointer"
              >
                {t('verifyOtp')}
              </Button>
            </form>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleNotForMe}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer transition"
              >
                {t('notForMe')}
              </button>
            </div>
          </div>
        </main>

        <footer className="p-4 text-center text-xs text-slate-400 relative z-10">
          <span>Company A Diagnostics • Secure Link Portal</span>
        </footer>
      </div>
    );
  }

  // INITIAL NEUTRAL LANDING GATE
  // Shows ONLY: lab name, "Your report is ready", button "Send OTP to ••••1234", and "This is not for me"
  return (
    <div className="min-h-screen bg-[#07151f] text-slate-100 flex flex-col justify-between font-sans relative overflow-x-hidden selection:bg-emerald-400 selection:text-slate-950">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-36 left-1/4 w-[750px] h-[750px] bg-teal-500/10 rounded-full blur-[140px]"></div>
        <div className="absolute top-1/3 -right-40 w-[620px] h-[620px] bg-emerald-500/10 rounded-full blur-[160px]"></div>
      </div>

      <DemoRibbon />

      <header className="p-4 flex justify-between items-center max-w-md w-full mx-auto relative z-10">
        <span className="font-black text-white font-display text-lg">{linkInfo.labName}</span>
        <LangSwitch />
      </header>

      <main className="flex-1 flex flex-col justify-center px-4 py-8 max-w-md w-full mx-auto relative z-10">
        <div className="glass-panel-elevated rounded-3xl border border-white/20 p-6 md:p-8 shadow-2xl space-y-6 text-center text-white">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-300 shadow-md shadow-emerald-500/20">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>

          <div>
            <h1 className="text-2xl font-display font-black text-white tracking-tight">
              {t('linkGateSubtitle')}
            </h1>
            <p className="text-sm text-slate-300 mt-2">
              For your privacy, reports are protected with mobile OTP verification.
            </p>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
            <span className="text-xs text-slate-400 block mb-1 font-mono uppercase tracking-wider">
              {t('sendOtpTo')}
            </span>
            <span className="text-xl font-bold text-emerald-300 tracking-wider font-mono">
              {linkInfo.maskedPhone}
            </span>
          </div>

          {error && (
            <p className="text-xs text-rose-400 font-semibold">{error}</p>
          )}

          <Button
            variant="primary"
            fullWidth
            size="lg"
            loading={submitting}
            onClick={handleSendOtp}
            className="font-black text-base shadow-lg shadow-emerald-500/25 py-3 rounded-xl cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{t('sendOtpButton')}</span>
            <svg className="w-4 h-4 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Button>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleNotForMe}
              className="text-xs text-slate-400 hover:text-white underline font-medium cursor-pointer transition"
            >
              {t('notForMe')}
            </button>
          </div>
        </div>
      </main>

      <footer className="p-4 text-center text-xs text-slate-400 relative z-10">
        <span>Company A Diagnostics • Secure Link Gate</span>
      </footer>
    </div>
  );
}
