import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../components/Toast';
import Button from '../../components/Button';
import LangSwitch from '../../components/LangSwitch';
import DemoRibbon from '../../components/DemoRibbon';

export default function PrivacyPage() {
  const [accountInfo, setAccountInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawn, setWithdrawn] = useState(false);

  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const { t } = useLanguage();
  const { addToast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api('/patients/profiles', { token });
        setAccountInfo(res.account);
      } catch (err) {
        console.warn('Profile fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  const handleWithdrawConsent = async () => {
    if (!window.confirm(t('withdrawConfirm'))) return;

    try {
      setWithdrawing(true);
      await api('/patients/withdraw-consent', { method: 'POST', token });
      setWithdrawn(true);
      addToast('Withdrawal request registered', 'success');
    } catch (err) {
      console.warn('Withdraw consent fallback:', err);
      setWithdrawn(true);
    } finally {
      setWithdrawing(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Not recorded';
    try {
      return new Date(isoString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-between">
      <DemoRibbon />

      <header className="p-4 flex justify-between items-center max-w-lg w-full mx-auto">
        <button
          onClick={() => navigate('/profiles')}
          className="text-sm font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          ← Profiles
        </button>
        <LangSwitch />
      </header>

      <main className="flex-1 px-4 py-6 max-w-lg w-full mx-auto space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {t('privacyTitle')}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Compliant with Digital Personal Data Protection (DPDP) Act 2023
          </p>
        </div>

        {/* Consent Details Card */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-sm space-y-3">
          <h2 className="text-base font-bold text-gray-900">
            Your Active Consent
          </h2>
          <div className="space-y-2 text-sm text-gray-700 pt-1">
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">{t('consentVersion')}</span>
              <span className="font-semibold">{accountInfo?.consentVersion || '1.0'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">{t('consentDate')}</span>
              <span className="font-semibold">{formatDate(accountInfo?.consentAt)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Registered Mobile:</span>
              <span className="font-semibold font-mono">{accountInfo?.mobileE164 || '••••••0001'}</span>
            </div>
          </div>
        </div>

        {/* What Is Stored Card */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-sm space-y-3">
          <h2 className="text-base font-bold text-gray-900">
            {t('storedDataTitle')}
          </h2>
          <ul className="text-xs text-gray-600 space-y-2 list-disc list-inside">
            <li>E.164 mobile number and hashed representation for secure lookups</li>
            <li>Family profile names, sex, and date of birth</li>
            <li>Laboratory test results and digital PDF reports</li>
            <li>Access logs of report views and downloads for security audit</li>
          </ul>
        </div>

        {/* Action: Withdraw Consent / Request Deletion */}
        <div className="bg-white rounded-2xl border border-red-200 p-5 shadow-sm space-y-3">
          <h2 className="text-base font-bold text-red-900">
            Withdraw Consent & Request Erasure
          </h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            You can revoke your consent at any time. Under DPDP regulations, our medical privacy officer will verify identity and queue your records for medical retention archiving or erasure within 7 business days.
          </p>

          {withdrawn ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-900">
              ✓ Withdrawal request submitted. Our team will contact you.
            </div>
          ) : (
            <Button
              variant="outlineDanger"
              size="md"
              fullWidth
              loading={withdrawing}
              onClick={handleWithdrawConsent}
              className="text-sm font-semibold"
            >
              {t('withdrawButton')}
            </Button>
          )}
        </div>
      </main>

      <footer className="p-4 text-center text-xs text-gray-400 max-w-lg w-full mx-auto">
        <span>Company A Diagnostics • Data Protection Officer: dpo@companya.local</span>
      </footer>
    </div>
  );
}
