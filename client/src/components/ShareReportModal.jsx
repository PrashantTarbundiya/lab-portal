import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { useToast } from './Toast';

export default function ShareReportModal({
  isOpen,
  onClose,
  orderNo,
  patientName,
  results = [],
}) {
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  const abnormalCount = (results || []).filter(
    (r) => r.flag && r.flag !== 'NORMAL' && r.flag !== 'UNKNOWN'
  ).length;

  const currentUrl = window.location.href;
  const shareText = `*Company A Diagnostics - Verified Laboratory Report*
Order: #${orderNo}
Patient: ${patientName || 'Patient'}
Parameters: ${results.length} total (${abnormalCount > 0 ? `${abnormalCount} out-of-range` : 'All normal'})
NABL Accreditation: MC-3492 (ISO 15189:2022)

View full secure report & digital seal:
${currentUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    addToast('Report link copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(shareText);
    addToast('Full text summary copied', 'success');
  };

  const handleOpenWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Report with Doctor or Family"
      description={`Order #${orderNo} • NABL Verified Digital Sharing`}
      size="md"
    >
      <div className="space-y-4">
        {/* WhatsApp Card */}
        <div className="p-4 glass-card border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/25 border border-emerald-400/30 shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white font-display">
                Share directly via WhatsApp
              </h4>
              <p className="text-xs text-slate-300">
                Opens WhatsApp with pre-formatted report summary and verification link.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenWhatsApp}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs rounded-xl shadow-md shadow-emerald-500/25 transition whitespace-nowrap cursor-pointer active:scale-95"
          >
            <span>Open WhatsApp</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </button>
        </div>

        {/* Formatted Text Preview */}
        <div>
          <label className="text-xs font-mono font-bold text-slate-300 block mb-1">
            Message Preview (Includes NABL Accreditation & Results)
          </label>
          <pre className="p-3 bg-white/5 border border-white/10 rounded-xl text-[11px] text-slate-200 font-mono whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
            {shareText}
          </pre>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 underline cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
            <span>Copy Message Text</span>
          </button>

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose} size="sm">
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCopyLink}
              className="font-bold shadow-2xs inline-flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  <span>Copy Report Link</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

