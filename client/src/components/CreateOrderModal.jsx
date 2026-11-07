import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import Field from './Field';
import { api } from '../utils/api';
import { useToast } from './Toast';

const PRESET_PANELS = [
  {
    name: 'Thyroid Wellness Profile',
    category: 'Thyroid',
    results: [
      { parameter: 'TSH (Thyroid Stimulating Hormone)', value: '5.85', unit: 'µIU/mL', refRangeRaw: '0.35-4.94', flag: 'HIGH' },
      { parameter: 'Free T3 (Triiodothyronine)', value: '2.9', unit: 'pg/mL', refRangeRaw: '1.71-3.71', flag: 'NORMAL' },
      { parameter: 'Free T4 (Thyroxine)', value: '1.1', unit: 'ng/dL', refRangeRaw: '0.70-1.48', flag: 'NORMAL' },
    ],
  },
  {
    name: 'Liver Function Test (LFT)',
    category: 'Liver',
    results: [
      { parameter: 'Total Bilirubin', value: '1.4', unit: 'mg/dL', refRangeRaw: '0.2-1.2', flag: 'HIGH' },
      { parameter: 'SGPT (ALT)', value: '58', unit: 'U/L', refRangeRaw: '7-56', flag: 'HIGH' },
      { parameter: 'SGOT (AST)', value: '38', unit: 'U/L', refRangeRaw: '10-40', flag: 'NORMAL' },
      { parameter: 'Alkaline Phosphatase', value: '110', unit: 'U/L', refRangeRaw: '44-147', flag: 'NORMAL' },
    ],
  },
  {
    name: 'Lipid & Heart Health Panel',
    category: 'Cardiovascular',
    results: [
      { parameter: 'Total cholesterol', value: '225', unit: 'mg/dL', refRangeRaw: '125-200', flag: 'HIGH' },
      { parameter: 'Triglycerides', value: '240', unit: 'mg/dL', refRangeRaw: '< 150', flag: 'HIGH' },
      { parameter: 'LDL cholesterol', value: '148', unit: 'mg/dL', refRangeRaw: '< 100', flag: 'HIGH' },
      { parameter: 'HDL cholesterol', value: '36', unit: 'mg/dL', refRangeRaw: '> 40', flag: 'LOW' },
    ],
  },
  {
    name: 'Diabetes & Glucose Screen',
    category: 'Metabolic',
    results: [
      { parameter: 'Fasting glucose', value: '138', unit: 'mg/dL', refRangeRaw: '70-99', flag: 'HIGH' },
      { parameter: 'HbA1c', value: '7.4', unit: '%', refRangeRaw: '4.0-5.6', flag: 'HIGH' },
    ],
  },
  {
    name: 'Vitamin D3 & B12 Vitality',
    category: 'Vitamins',
    results: [
      { parameter: 'Vitamin D (25-OH)', value: '16.5', unit: 'ng/mL', refRangeRaw: '30.0-100.0', flag: 'LOW' },
      { parameter: 'Vitamin B12', value: '190', unit: 'pg/mL', refRangeRaw: '211-911', flag: 'LOW' },
    ],
  },
  {
    name: 'Renal & Kidney Function (KFT)',
    category: 'Kidney',
    results: [
      { parameter: 'Serum Creatinine', value: '1.0', unit: 'mg/dL', refRangeRaw: '0.6-1.2', flag: 'NORMAL' },
      { parameter: 'Blood Urea', value: '32', unit: 'mg/dL', refRangeRaw: '15-45', flag: 'NORMAL' },
      { parameter: 'Uric Acid', value: '6.2', unit: 'mg/dL', refRangeRaw: '3.5-7.2', flag: 'NORMAL' },
    ],
  },
];

export default function CreateOrderModal({ isOpen, onClose, onOrderCreated, token }) {
  const [patientName, setPatientName] = useState('');
  const [mobile, setMobile] = useState('9000000001');
  const [sex, setSex] = useState('F');
  const [doctorName, setDoctorName] = useState('Dr. S. Ramanaiah');
  const [status, setStatus] = useState('SIGNED');
  const [results, setResults] = useState([...PRESET_PANELS[0].results]);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { addToast } = useToast();

  const handleSelectPreset = (idx) => {
    setSelectedPresetIndex(idx);
    setResults([...PRESET_PANELS[idx].results]);
  };

  const handleResultChange = (idx, field, val) => {
    setResults((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleAddResultRow = () => {
    setResults((prev) => [
      ...prev,
      { parameter: '', value: '', unit: '', refRangeRaw: '', flag: 'NORMAL' },
    ]);
  };

  const handleRemoveResultRow = (idx) => {
    setResults((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setError('Patient name is required');
      return;
    }
    if (!mobile.trim() || !/^[6-9]\d{9}$/.test(mobile.trim())) {
      setError('Please provide a valid 10-digit mobile number');
      return;
    }
    if (results.length === 0 || !results[0].parameter.trim()) {
      setError('Please add at least one test parameter with value');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await api('/orders', {
        method: 'POST',
        body: {
          patientName: patientName.trim(),
          mobile: mobile.trim(),
          sex,
          doctorName,
          status,
          results,
        },
        token,
      });

      addToast(`Order #${res.order.orderNo} created for ${res.order.patientName}!`, 'success');
      if (onOrderCreated) onOrderCreated(res.order);
      onClose();
    } catch (err) {
      console.error('Order creation error:', err);
      setError(err.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Diagnostic Report">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs md:text-sm">
        {error && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        {/* 1. Quick Test Panel Selector */}
        <div>
          <label className="block text-xs font-mono uppercase font-bold text-slate-300 mb-1.5">
            Select Clinical Test Panel Preset:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PRESET_PANELS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(idx)}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2 ${
                  selectedPresetIndex === idx
                    ? 'border-emerald-400 bg-emerald-500/20 text-white font-black shadow-sm ring-1 ring-emerald-400'
                    : 'glass-card border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <span className="text-base">{p.icon}</span>
                <span className="text-xs truncate">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Patient Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
          <div>
            <Field
              label="Patient Full Name"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="e.g. Sunita Devi R"
              required
            />
          </div>

          <div>
            <Field
              label="Patient Mobile (10 digits)"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="9000000001"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-mono uppercase font-bold text-slate-300 mb-1">Gender</label>
            <select
              value={sex}
              onChange={(e) => setSex(e.target.value)}
              className="w-full glass-input border border-white/15 bg-[#07151f]/80 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-400 outline-none"
            >
              <option value="F" className="bg-[#0b1924] text-white">Female (F)</option>
              <option value="M" className="bg-[#0b1924] text-white">Male (M)</option>
              <option value="O" className="bg-[#0b1924] text-white">Other (O)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase font-bold text-slate-300 mb-1">Referring Doctor</label>
            <select
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              className="w-full glass-input border border-white/15 bg-[#07151f]/80 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-400 outline-none"
            >
              <option value="Dr. S. Ramanaiah" className="bg-[#0b1924] text-white">Dr. S. Ramanaiah</option>
              <option value="Dr. K. Suresh" className="bg-[#0b1924] text-white">Dr. K. Suresh</option>
              <option value="Dr. M. Sunita" className="bg-[#0b1924] text-white">Dr. M. Sunita</option>
              <option value="Self / Walk-in" className="bg-[#0b1924] text-white">Self / Walk-in</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase font-bold text-slate-300 mb-1">Order Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full glass-input border border-white/15 bg-[#07151f]/80 text-white rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-400 outline-none"
            >
              <option value="SIGNED" className="bg-[#0b1924] text-white">SIGNED (Verified & Dispatched)</option>
              <option value="PROCESSING" className="bg-[#0b1924] text-white">PROCESSING (In Lab Testing)</option>
            </select>
          </div>
        </div>

        {/* 3. Parameter Results Table */}
        <div className="pt-2 border-t border-white/10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-mono uppercase font-bold text-slate-300">
              Test Parameters & Values ({results.length}):
            </span>
            <button
              type="button"
              onClick={handleAddResultRow}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300"
            >
              + Add Custom Row
            </button>
          </div>

          <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
            {results.map((r, i) => (
              <div
                key={i}
                className="grid grid-cols-12 gap-1.5 items-center p-2 rounded-xl bg-white/5 border border-white/10 text-xs"
              >
                <input
                  type="text"
                  value={r.parameter}
                  onChange={(e) => handleResultChange(i, 'parameter', e.target.value)}
                  placeholder="Parameter"
                  className="col-span-4 glass-input border border-white/15 bg-[#07151f]/80 text-white rounded-lg px-2 py-1 text-xs"
                />
                <input
                  type="text"
                  value={r.value}
                  onChange={(e) => handleResultChange(i, 'value', e.target.value)}
                  placeholder="Value"
                  className="col-span-2 glass-input border border-white/15 bg-[#07151f]/80 text-white rounded-lg px-2 py-1 text-xs font-bold font-mono"
                />
                <input
                  type="text"
                  value={r.unit}
                  onChange={(e) => handleResultChange(i, 'unit', e.target.value)}
                  placeholder="Unit"
                  className="col-span-2 glass-input border border-white/15 bg-[#07151f]/80 text-white rounded-lg px-2 py-1 text-xs"
                />
                <input
                  type="text"
                  value={r.refRangeRaw}
                  onChange={(e) => handleResultChange(i, 'refRangeRaw', e.target.value)}
                  placeholder="Ref Range"
                  className="col-span-3 glass-input border border-white/15 bg-[#07151f]/80 text-white rounded-lg px-2 py-1 text-[11px]"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveResultRow(i)}
                  className="col-span-1 text-rose-400 hover:text-rose-300 flex items-center justify-center p-1 cursor-pointer"
                  title="Remove row"
                  aria-label="Remove row"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={loading} className="font-bold">
            Create & Generate Report
          </Button>
        </div>
      </form>
    </Modal>
  );
}

