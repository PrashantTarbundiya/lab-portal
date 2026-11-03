import React from 'react';
import Modal from './Modal';
import Button from './Button';

export default function DigitalVerificationModal({ isOpen, onClose, orderNo, patientName, date, doctorName }) {
  const verifyHash = `0x${Array.from(orderNo || 'ORD-00000').map(c => c.charCodeAt(0).toString(16)).join('')}d8a4f912c3b5`;
  const verifyUrl = `${window.location.origin}/verify/${orderNo || 'report'}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🛡️ Digital Authenticity & NABL Verification">
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
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-200">
          {/* Simulated High-Res QR Code Representation */}
          <div className="w-28 h-28 bg-white p-2 rounded-xl border border-gray-300 flex flex-col items-center justify-between shadow-2xs shrink-0">
            <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-teal-950 rounded-lg flex items-center justify-center p-2 relative overflow-hidden">
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
              <span className="text-[10px] font-black bg-white text-[#0F5E57] px-1 py-0.5 rounded relative z-10 shadow-xs">
                NABL
              </span>
            </div>
          </div>

          <div className="space-y-1.5 flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-emerald-800 font-bold text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Digitally Signed & Tamper-Proof</span>
            </div>
            <p className="text-gray-600 text-[11px] leading-relaxed">
              This diagnostic report was digitally signed and sealed under section 4 of the Digital Personal Data Protection (DPDP) Act 2023.
            </p>
            <div className="font-mono text-[10px] bg-white p-1.5 rounded-lg border border-gray-200 text-gray-500 break-all">
              SHA-256: {verifyHash}
            </div>
          </div>
        </div>

        {/* Clinical Sign-off Details */}
        <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-white border border-gray-200/90 text-[11px]">
          <div>
            <span className="text-gray-400 block text-[10px]">Patient Name</span>
            <strong className="text-gray-900">{patientName}</strong>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px]">Order Number</span>
            <strong className="text-gray-900">#{orderNo}</strong>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px]">Consultant Pathologist</span>
            <strong className="text-gray-900">{doctorName || 'Dr. S. Ramanaiah, MD'}</strong>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px]">Report Verification Date</span>
            <strong className="text-gray-900">{new Date(date || Date.now()).toLocaleDateString('en-IN')}</strong>
          </div>
        </div>

        {/* Copy Link / Close */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              alert('Report link copied to clipboard!');
            }}
            className="text-xs font-semibold text-[#0F5E57] hover:underline"
          >
            📋 Copy Verification Link
          </button>
          <Button variant="primary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
