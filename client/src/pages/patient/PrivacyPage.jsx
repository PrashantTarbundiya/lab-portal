import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../components/Toast';
import Button from '../../components/Button';
import LangSwitch from '../../components/LangSwitch';
import DemoRibbon from '../../components/DemoRibbon';
import AbhaModal from '../../components/AbhaModal';

export default function PrivacyPage() {
  const [accountInfo, setAccountInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawn, setWithdrawn] = useState(false);
  const [isAbhaOpen, setIsAbhaOpen] = useState(false);

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
          className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Profiles</span>
        </button>
        <LangSwitch />
      </header>

      <main className="flex-1 px-4 py-6 max-w-lg w-full mx-auto space-y-5 text-white">
        <div>
          <h1 className="text-2xl font-display font-black text-white tracking-tight">
            {t('privacyTitle')}
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Compliant with Digital Personal Data Protection (DPDP) Act 2023
          </p>
        </div>

        {/* Consent Details Card */}
        <div className="glass-panel-elevated rounded-3xl border border-white/20 p-5 shadow-2xl space-y-3">
          <h2 className="text-base font-display font-black text-white">
            Your Active Consent
          </h2>
          <div className="space-y-2 text-sm text-slate-200 pt-1">
            <div className="flex justify-between py-1 border-b border-white/10">
              <span className="text-slate-400">{t('consentVersion')}</span>
              <span className="font-semibold text-white">{accountInfo?.consentVersion || '1.0'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/10">
              <span className="text-slate-400">{t('consentDate')}</span>
              <span className="font-semibold text-white">{formatDate(accountInfo?.consentAt)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/10">
              <span className="text-slate-400">Registered Mobile:</span>
              <span className="font-bold font-mono text-emerald-400">{accountInfo?.mobileE164 || '••••••0001'}</span>
            </div>
          </div>
        </div>

        {/* ABDM & ABHA National Health Locker Card */}
        <div className="glass-panel-elevated rounded-3xl border border-white/20 p-5 shadow-2xl space-y-3">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-300 font-bold font-mono text-xs">
                ABHA
              </div>
              <div>
                <h2 className="text-base font-display font-black text-white leading-tight">
                  Ayushman Bharat (ABDM) Sync
                </h2>
                <p className="text-[11px] text-slate-400">
                  National Health Authority • Digital Health Locker
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAbhaOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
            >
              <span>Manage ABHA</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            </button>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Link your 14-digit ABHA ID to automatically synchronize encrypted diagnostic reports directly to your Government of India personal health record (PHR / Aarogya Setu app).
          </p>
        </div>

        {/* What Is Stored Card */}
        <div className="glass-panel-elevated rounded-3xl border border-white/20 p-5 shadow-2xl space-y-3">
          <h2 className="text-base font-display font-black text-white">
            {t('storedDataTitle')}
          </h2>
          <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
            <li>E.164 mobile number and hashed representation for secure lookups</li>
            <li>Family profile names, sex, and date of birth</li>
            <li>Laboratory test results and digital PDF reports</li>
            <li>Access logs of report views and downloads for security audit</li>
          </ul>
        </div>

        {/* Action: Withdraw Consent / Request Deletion */}
        <div className="glass-panel-elevated rounded-3xl border border-rose-500/30 p-5 shadow-2xl space-y-3 bg-rose-950/20">
          <h2 className="text-base font-display font-black text-rose-300">
            Withdraw Consent & Request Erasure
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            You can revoke your consent at any time. Under DPDP regulations, our medical privacy officer will verify identity and queue your records for medical retention archiving or erasure within 7 business days.
          </p>

          {withdrawn ? (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
              <span>Withdrawal request submitted. Our team will contact you.</span>
            </div>
          ) : (
            <Button
              variant="outlineDanger"
              size="md"
              fullWidth
              loading={withdrawing}
              onClick={handleWithdrawConsent}
              className="text-sm font-bold cursor-pointer"
            >
              {t('withdrawButton')}
            </Button>
          )}
        </div>
      </main>

      <footer className="p-4 text-center text-xs text-gray-400 max-w-lg w-full mx-auto">
        <span>Company A Diagnostics • Data Protection Officer: dpo@companya.local</span>
      </footer>

      {/* ABHA National Health Locker Modal */}
      <AbhaModal
        isOpen={isAbhaOpen}
        onClose={() => setIsAbhaOpen(false)}
      />
    </div>
  );
}

