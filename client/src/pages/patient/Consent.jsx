import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';
import Button from '../../components/Button';
import LangSwitch from '../../components/LangSwitch';
import DemoRibbon from '../../components/DemoRibbon';

export default function Consent() {
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { token } = useAuth();

  const handleAgree = async () => {
    try {
      setLoading(true);
      await api('/auth/consent', {
        method: 'POST',
        body: { version: '1.0' },
        token,
      });
      navigate('/profiles');
    } catch (err) {
      console.warn('Consent save fallback:', err);
      navigate('/profiles');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-between">
      <DemoRibbon />

      <header className="p-4 flex justify-between items-center max-w-lg w-full mx-auto">
        <span className="font-bold text-gray-900 tracking-tight text-base">
          {t('appName')}
        </span>
        <LangSwitch />
      </header>

      <main className="flex-1 flex flex-col justify-center px-4 py-8 max-w-lg w-full mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 md:p-8 shadow-sm space-y-6">
          <div>
            <span className="inline-block px-3 py-1 bg-teal-50 text-[#0F5E57] text-xs font-semibold rounded-full mb-3 border border-teal-100">
              DPDP Act 2023 Consent
            </span>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {t('consentTitle')}
            </h1>
            <p className="text-base text-gray-600 mt-2 leading-relaxed">
              {t('consentIntro')}
            </p>
          </div>

          <div className="space-y-4 text-sm text-gray-700 bg-gray-50/70 p-5 rounded-xl border border-gray-100">
            <div>
              <strong className="block text-gray-900 font-semibold mb-0.5">
                {t('consentWhatTitle')}
              </strong>
              <p className="text-gray-600 text-sm leading-relaxed">{t('consentWhat')}</p>
            </div>

            <div>
              <strong className="block text-gray-900 font-semibold mb-0.5">
                {t('consentWhyTitle')}
              </strong>
              <p className="text-gray-600 text-sm leading-relaxed">{t('consentWhy')}</p>
            </div>

            {showDetails && (
              <>
                <div className="pt-2 border-t border-gray-200">
                  <strong className="block text-gray-900 font-semibold mb-0.5">
                    {t('consentWhoTitle')}
                  </strong>
                  <p className="text-gray-600 text-sm leading-relaxed">{t('consentWho')}</p>
                </div>

                <div>
                  <strong className="block text-gray-900 font-semibold mb-0.5">
                    {t('consentRetentionTitle')}
                  </strong>
                  <p className="text-gray-600 text-sm leading-relaxed">{t('consentRetention')}</p>
                </div>

                <div>
                  <strong className="block text-gray-900 font-semibold mb-0.5">
                    {t('consentWithdrawTitle')}
                  </strong>
                  <p className="text-gray-600 text-sm leading-relaxed">{t('consentWithdraw')}</p>
                </div>
              </>
            )}

            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs font-semibold text-[#0F5E57] hover:underline pt-1 block"
            >
              {showDetails ? 'Hide details' : `${t('consentWhyWeAsk')} ↓`}
            </button>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              variant="primary"
              fullWidth
              size="lg"
              loading={loading}
              onClick={handleAgree}
              className="text-base font-semibold shadow-sm"
            >
              {t('consentAgree')}
            </Button>
            <p className="text-xs text-gray-400 text-center">
              You can withdraw consent at any time from your account settings.
            </p>
          </div>
        </div>
      </main>

      <footer className="p-4 text-center text-xs text-gray-400 max-w-lg w-full mx-auto">
        <span>Company A Diagnostics • Patient Privacy First</span>
      </footer>
    </div>
  );
}
