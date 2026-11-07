import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import PhlebotomistBarcodeScanner from './PhlebotomistBarcodeScanner';

export default function SampleBarcodeModal({ isOpen, onClose, order }) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  if (!order) return null;

  const patient = order.patient || {};
  const orderNo = order.orderNo || 'ORD-71205';
  const patientName = patient.fullName || 'Patient Name';
  const ageSex = `${patient.sex || 'M'} / 45Y`;
  const collectionDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const tubes = [
    {
      id: `BC-${orderNo}-SST`,
      type: 'Gold Top (SST Gel Separator 5mL)',
      tests: 'Lipid Profile, LFT, Creatinine, Electrolytes',
      color: 'bg-amber-400',
    },
    {
      id: `BC-${orderNo}-EDTA`,
      type: 'Lavender Top (K2 EDTA 3mL)',
      tests: 'HbA1c, Complete Blood Count (CBC)',
      color: 'bg-purple-500',
    },
    {
      id: `BC-${orderNo}-FLU`,
      type: 'Gray Top (Sodium Fluoride 2mL)',
      tests: 'Fasting Plasma Glucose (FBG)',
      color: 'bg-slate-400',
    },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Specimen Vacuum Tube Barcodes"
      description="Thermal Label Generation for Primary Diagnostic Collection Tubes"
      size="md"
    >
      <div className="space-y-4 py-2">
        <p className="text-xs text-slate-300">
          Standard 2" × 1" thermal barcode stickers for specimen traceability under ISO 15189 cold-chain protocol:
        </p>

        {/* Labels Grid */}
        <div className="space-y-3">
          {tubes.map((tube, idx) => (
            <div
              key={idx}
              className="p-3.5 glass-card border border-white/10 rounded-2xl shadow-md space-y-2 font-mono text-xs relative overflow-hidden text-slate-200"
            >
              {/* Color Stripe for Tube Cap */}
              <div className={`absolute top-0 left-0 bottom-0 w-2.5 ${tube.color}`}></div>

              <div className="pl-2">
                <div className="flex justify-between items-start">
                  <div>
                    <strong className="text-white font-bold block text-sm font-display">{patientName}</strong>
                    <span className="text-[10px] text-slate-400 block font-sans">{ageSex} • {collectionDate}</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/40">
                    {orderNo}
                  </span>
                </div>

                {/* Simulated Barcode Lines */}
                <div className="py-2 px-3 flex items-center justify-center gap-[2px] bg-white rounded-xl my-1.5">
                  {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 1, 3, 1, 2, 4, 2, 1, 3, 1, 2, 4, 1, 2, 3, 1].map((w, i) => (
                    <div
                      key={i}
                      className="h-8 bg-black inline-block"
                      style={{ width: `${w * 1.5}px` }}
                    />
                  ))}
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 font-sans">
                  <span className="font-mono font-extrabold text-emerald-400">{tube.id}</span>
                  <span className="text-[9px] text-slate-300 font-semibold">{tube.type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-500/40 text-emerald-300 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span>Launch Tube Barcode Scanner</span>
          </button>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button variant="primary" size="sm" onClick={handlePrint} className="font-bold gap-1.5 inline-flex items-center">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              <span>Print 2x1" Thermal Stickers</span>
            </Button>
          </div>
        </div>

        {/* Feature 4: Offline PWA Barcode Scanner for Phlebotomists */}
        <PhlebotomistBarcodeScanner
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          defaultOrderNo={orderNo}
          defaultPatient={patientName}
        />
      </div>
    </Modal>
  );
}
