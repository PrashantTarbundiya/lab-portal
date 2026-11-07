import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiUpload, api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import DemoRibbon from '../../components/DemoRibbon';

export default function ImportPage() {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const { token, logout, user } = useAuth();
  const staffAuthToken = token && !token.startsWith('demo-patient') ? token : 'demo-staff';
  const { addToast } = useToast();

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (f) => {
    setError('');
    setReport(null);

    if (!f.name.endsWith('.csv')) {
      setError('Only CSV files are accepted.');
      return;
    }

    if (f.size > 4 * 1024 * 1024) {
      setError('File exceeds 4 MB upload limit.');
      return;
    }

    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setError('');
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiUpload('/import/upload', formData, staffAuthToken);
      setReport(res.report);
      addToast('CSV import processed successfully', 'success');
    } catch (err) {
      setError(err.message || 'Import failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSimulate = async (type = 'sample') => {
    try {
      setSimulating(true);
      setError('');
      setReport(null);

      const res = await api('/import/simulate', {
        method: 'POST',
        body: { fileType: type },
        token: staffAuthToken,
      });

      setReport(res.report);
      addToast(`Simulated LIS import: ${res.fileName}`, 'success');
    } catch (err) {
      setError(err.message || 'Simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  const handleDownloadErrorsCSV = () => {
    if (!report?.errors || report.errors.length === 0) return;

    const headers = ['Row Number', 'Error Reason'];
    const rows = report.errors.map((e, idx) => [idx + 1, `"${e.replace(/"/g, '""')}"`]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import_errors.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-[#07151f] text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-emerald-400 selection:text-slate-950 font-sans">
      <DemoRibbon />

      {/* Atmospheric Ambience Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-36 left-1/4 w-[750px] h-[750px] bg-teal-500/10 rounded-full blur-[140px]"></div>
        <div className="absolute top-1/3 -right-40 w-[620px] h-[620px] bg-emerald-500/10 rounded-full blur-[160px]"></div>
      </div>

      {/* Main Container */}
      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 flex-1 relative z-10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
            LIS Data Ingestion & Import Pipeline
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Upload CSV exports from the desktop Lab Information System or simulate automated drops.
          </p>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
          className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all glass-panel-elevated shadow-xl ${
            dragOver ? 'border-emerald-400 bg-emerald-500/10' : 'border-white/20 hover:border-emerald-500/40'
          }`}
        >
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
          </div>

          <h3 className="text-base font-display font-bold text-white">
            {file ? file.name : 'Choose a file or drag & drop here'}
          </h3>
          <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
            CSV files only up to 4 MB (approx. 20,000 rows). Must contain standard LIS headers.
          </p>

          <div className="mt-5 flex justify-center gap-3">
            <label className="cursor-pointer bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95">
              Browse File
              <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
            </label>

            {file && (
              <Button
                variant="primary"
                size="sm"
                loading={uploading}
                onClick={handleUpload}
                className="font-bold"
              >
                Upload & Process
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-xs font-semibold text-rose-300">
            {error}
          </div>
        )}

        {/* Simulate LIS Drop Box */}
        <div className="glass-card border border-white/10 rounded-2xl p-6 shadow-xl space-y-3 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-display font-bold text-white">
                Simulate LIS Export Folder Drop
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Emulates the lab system generating batch exports into the drop folder
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                loading={simulating}
                onClick={() => handleSimulate('sample')}
                className="text-xs"
              >
                Simulate Sample Batch
              </Button>
              <button
                type="button"
                disabled={simulating}
                onClick={() => handleSimulate('update')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer shadow-sm disabled:opacity-50"
                title="Flips processing orders to SIGNED to demonstrate real-time report link generation"
              >
                <svg className="w-3.5 h-3.5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                <span>Simulate Sign-Off Update</span>
              </button>
            </div>
          </div>
        </div>

        {/* Import Report Section */}
        {report && (
          <div className="glass-panel-elevated border border-white/15 rounded-3xl p-6 shadow-2xl space-y-6 text-white">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-display font-black text-white">
                  Import Summary Report
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Batch executed at {new Date().toLocaleTimeString('en-IN')}
                </p>
              </div>
              <Badge variant={report.rowsFailed > 0 ? 'warning' : 'success'}>
                {report.rowsFailed > 0 ? 'Completed with Warnings' : 'Completed Successfully'}
              </Badge>
            </div>

            {/* 4 Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="glass-card p-4 rounded-2xl border border-white/10 text-center">
                <span className="text-xs text-slate-400 block font-mono">Total Rows</span>
                <span className="text-2xl font-display font-black text-white tabular-nums">{report.rowsTotal}</span>
              </div>
              <div className="glass-card p-4 rounded-2xl border border-emerald-500/30 text-center">
                <span className="text-xs text-emerald-400 block font-mono">Rows Succeeded</span>
                <span className="text-2xl font-display font-black text-emerald-300 tabular-nums">{report.rowsOk}</span>
              </div>
              <div className="glass-card p-4 rounded-2xl border border-amber-500/30 text-center">
                <span className="text-xs text-amber-400 block font-mono">Orders Created</span>
                <span className="text-2xl font-display font-black text-amber-300 tabular-nums">{report.ordersCreated}</span>
              </div>
              <div className="glass-card p-4 rounded-2xl border border-teal-500/30 text-center">
                <span className="text-xs text-teal-400 block font-mono">Orders Signed</span>
                <span className="text-2xl font-display font-black text-teal-300 tabular-nums">{report.ordersSigned}</span>
              </div>
            </div>

            {/* Error / Skipped List */}
            {report.errors && report.errors.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-white font-display">
                    Row-level Validation Warnings ({report.errors.length})
                  </h4>
                  <button
                    onClick={handleDownloadErrorsCSV}
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold hover:underline cursor-pointer"
                  >
                    <span>Download Errors CSV</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-white/10 rounded-2xl p-3 bg-white/5 font-mono">
                  {report.errors.map((errItem, idx) => (
                    <div key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="text-rose-400 font-bold">•</span>
                      <span>{errItem}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

