import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import Button from '../../components/Button';
import LangSwitch from '../../components/LangSwitch';

export default function Consent() {
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { token, account } = useAuth();

  const ident = location.state?.identifier || account?.mobileE164?.replace(/\D/g, '') || (token?.startsWith('demo-patient:') ? token.split(':')[1]?.replace(/\D/g, '') : null) || '9000000001';

  const handleAgree = async () => {
    try {
      setLoading(true);
      await api('/auth/consent', {
        method: 'POST',
        body: { version: '1.0' },
        token,
      });
      navigate(`/patient/${ident}/profiles`);
    } catch (err) {
      console.warn('Consent save fallback:', err);
      navigate(`/patient/${ident}/profiles`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-100 flex flex-col justify-between">
      <DemoRibbon />

      <header className="p-4 flex justify-between items-center max-w-lg w-full mx-auto">
        <span className="font-display font-black text-white tracking-tight text-lg">
          {t('appName')}
        </span>
        <LangSwitch />
      </header>

      <main className="flex-1 flex flex-col justify-center px-4 py-8 max-w-lg w-full mx-auto">
        <div className="glass-panel-elevated rounded-3xl border border-white/20 p-6 md:p-8 shadow-2xl space-y-6 text-white">
          <div>
            <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full mb-3 border border-emerald-500/40 font-mono">
              DPDP Act 2023 Consent
            </span>
            <h1 className="text-2xl font-display font-black text-white tracking-tight">
              {t('consentTitle')}
            </h1>
            <p className="text-base text-slate-300 mt-2 leading-relaxed">
              {t('consentIntro')}
            </p>
          </div>

          <div className="space-y-4 text-sm text-slate-200 glass-card p-5 rounded-2xl border border-white/10">
            <div>
              <strong className="block text-white font-bold mb-0.5">
                {t('consentWhatTitle')}
              </strong>
              <p className="text-slate-300 text-sm leading-relaxed">{t('consentWhat')}</p>
            </div>

            <div>
              <strong className="block text-white font-bold mb-0.5">
                {t('consentWhyTitle')}
              </strong>
              <p className="text-slate-300 text-sm leading-relaxed">{t('consentWhy')}</p>
            </div>

            {showDetails && (
              <>
                <div className="pt-2 border-t border-white/10">
                  <strong className="block text-white font-bold mb-0.5">
                    {t('consentWhoTitle')}
                  </strong>
                  <p className="text-slate-300 text-sm leading-relaxed">{t('consentWho')}</p>
                </div>

                <div>
                  <strong className="block text-white font-bold mb-0.5">
                    {t('consentRetentionTitle')}
                  </strong>
                  <p className="text-slate-300 text-sm leading-relaxed">{t('consentRetention')}</p>
                </div>

                <div>
                  <strong className="block text-white font-bold mb-0.5">
                    {t('consentWithdrawTitle')}
                  </strong>
                  <p className="text-slate-300 text-sm leading-relaxed">{t('consentWithdraw')}</p>
                </div>
              </>
            )}

            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 pt-1 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>{showDetails ? 'Hide details' : t('consentWhyWeAsk')}</span>
              <svg className={`w-3.5 h-3.5 transition-transform ${showDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              variant="primary"
              fullWidth
              size="lg"
              loading={loading}
              onClick={handleAgree}
              className="text-base font-black shadow-md shadow-emerald-500/25 cursor-pointer"
            >
              {t('consentAgree')}
            </Button>
            <p className="text-xs text-slate-400 text-center">
              You can withdraw consent at any time from your account settings.
            </p>
          </div>
        </div>
      </main>

      <footer className="p-4 text-center text-xs text-slate-400 max-w-lg w-full mx-auto">
        <span>Company A Diagnostics • Patient Privacy First</span>
      </footer>
    </div>
  );
}

