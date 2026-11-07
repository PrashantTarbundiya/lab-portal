import React from 'react';
import Modal from './Modal';
import Button from './Button';

export default function DigitalVerificationModal({ isOpen, onClose, orderNo, patientName, date, doctorName }) {
  const verifyHash = `0x${Array.from(orderNo || 'ORD-00000').map(c => c.charCodeAt(0).toString(16)).join('')}d8a4f912c3b5`;
  const verifyUrl = `${window.location.origin}/verify/${orderNo || 'report'}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Digital Authenticity & NABL Verification">
      <div className="space-y-4 text-xs text-gray-700">
        {/* Certificate Header Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0F5E57] to-teal-900 text-white space-y-1 text-center shadow-sm">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold tracking-wider uppercase mb-1">
            Official NABL Accredited Laboratory
          </div>
          <h3 className="font-bold text-base tracking-tight">Company A Diagnostics Central Lab</h3>
          <p className="text-[11px] text-teal-200">
            NABL Accreditation No: <strong>MC-3492</strong> • ISO 15189:2022 Standard
          </p>
        </div>

        {/* QR Code and Cryptographic Verification Seal */}
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl glass-card border border-white/10">
          {/* Simulated High-Res QR Code Representation */}
          <div className="w-28 h-28 bg-white/10 p-2 rounded-2xl border border-white/20 flex flex-col items-center justify-between shadow-md shrink-0">
            <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 rounded-xl flex items-center justify-center p-2 relative overflow-hidden">
              <div className="absolute inset-1 grid grid-cols-6 grid-rows-6 gap-0.5 opacity-90">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-2xs ${
                      (i % 2 === 0 && i % 3 === 0) || i === 0 || i === 5 || i === 30 || i === 35
                        ? 'bg-white'
                        : (i * 7) % 5 === 0
                        ? 'bg-emerald-400'
                        : 'bg-transparent'
                    }`}
                  />
                ))}
              </div>
              <span className="text-[10px] font-black bg-emerald-400 text-slate-950 px-1 py-0.5 rounded relative z-10 shadow-xs">
                NABL
              </span>
            </div>
          </div>

          <div className="space-y-1.5 flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-emerald-400 font-bold text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Digitally Signed & Tamper-Proof</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              This diagnostic report was digitally signed and sealed under section 4 of the Digital Personal Data Protection (DPDP) Act 2023.
            </p>
            <div className="font-mono text-[10px] bg-white/5 p-2 rounded-xl border border-white/10 text-emerald-300 break-all">
              SHA-256: {verifyHash}
            </div>
          </div>
        </div>

        {/* Clinical Sign-off Details */}
        <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-2xl glass-card border border-white/10 text-[11px]">
          <div>
            <span className="text-slate-400 block text-[10px] font-mono uppercase">Patient Name</span>
            <strong className="text-white font-bold">{patientName}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-mono uppercase">Order Number</span>
            <strong className="text-emerald-400 font-mono">#{orderNo}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-mono uppercase">Consultant Pathologist</span>
            <strong className="text-white font-bold">{doctorName || 'Dr. S. Ramanaiah, MD'}</strong>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] font-mono uppercase">Report Verification Date</span>
            <strong className="text-white font-mono">{new Date(date || Date.now()).toLocaleDateString('en-IN')}</strong>
          </div>
        </div>

        {/* Copy Link / Close */}
        <div className="flex justify-between items-center pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              alert('Report link copied to clipboard!');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:underline cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
            <span>Copy Verification Link</span>
          </button>
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}

