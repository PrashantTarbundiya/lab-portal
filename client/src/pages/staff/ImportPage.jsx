import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiUpload, api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import Button from '../../components/Button';
import Card from '../../components/Card';
import DemoRibbon from '../../components/DemoRibbon';

export default function ImportPage() {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const { token, logout, user } = useAuth();
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

      const res = await apiUpload('/import/upload', formData, token);
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
        token,
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
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col">
      <DemoRibbon />

      {/* Staff Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0F5E57] flex items-center justify-center text-white font-bold text-sm">
                  A
                </div>
                <span className="font-bold text-gray-900 text-base">Lab Console</span>
              </div>

              <nav className="hidden md:flex space-x-1">
                <Link to="/staff" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                  Orders
                </Link>
                <Link to="/staff/import" className="px-3 py-2 rounded-lg text-sm font-semibold bg-[#0F5E57]/10 text-[#0F5E57]">
                  LIS Import
                </Link>
                <Link to="/staff/tasks" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                  Tasks & Flags
                </Link>
                <Link to="/staff/access-log" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                  Access Log
                </Link>
                <Link to="/staff/operations" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                  Operations Report
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 hidden sm:inline">{user?.email}</span>
              <button onClick={() => { logout(); }} className="text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5">
                Log out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 flex-1">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            LIS Data Ingestion & Import Pipeline
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Upload CSV exports from the desktop Lab Information System or simulate automated drops.
          </p>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleFileDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all bg-white ${
            dragOver ? 'border-[#0F5E57] bg-teal-50/20' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <div className="w-14 h-14 bg-teal-50 text-[#0F5E57] rounded-full flex items-center justify-center mx-auto text-2xl font-bold mb-3">
            📁
          </div>

          <h3 className="text-base font-bold text-gray-900">
            {file ? file.name : 'Choose a file or drag & drop here'}
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            CSV files only up to 4 MB (approx. 20,000 rows). Must contain standard LIS headers.
          </p>

          <div className="mt-5 flex justify-center gap-3">
            <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-xs">
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
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Simulate LIS Drop Box */}
        <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Simulate LIS Export Folder Drop
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
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
              <Button
                variant="primary"
                size="sm"
                loading={simulating}
                onClick={() => handleSimulate('update')}
                className="text-xs font-semibold"
                title="Flips processing orders to SIGNED to demonstrate real-time report link generation"
              >
                Simulate Sign-Off Update 🚀
              </Button>
            </div>
          </div>
        </div>

        {/* Import Report Section */}
        {report && (
          <div className="bg-white border border-gray-200/90 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Import Summary Report
                </h3>
                <p className="text-xs text-gray-500">
                  Batch executed at {new Date().toLocaleTimeString('en-IN')}
                </p>
              </div>
              <Badge variant={report.rowsFailed > 0 ? 'warning' : 'success'}>
                {report.rowsFailed > 0 ? 'Completed with Warnings' : 'Completed Successfully'}
              </Badge>
            </div>

            {/* 4 Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                <span className="text-xs text-gray-500 block">Total Rows</span>
                <span className="text-2xl font-bold text-gray-900 tabular-nums">{report.rowsTotal}</span>
              </div>
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center">
                <span className="text-xs text-emerald-700 block">Rows Succeeded</span>
                <span className="text-2xl font-bold text-emerald-900 tabular-nums">{report.rowsOk}</span>
              </div>
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center">
                <span className="text-xs text-amber-700 block">Orders Created</span>
                <span className="text-2xl font-bold text-amber-900 tabular-nums">{report.ordersCreated}</span>
              </div>
              <div className="bg-teal-50 p-4 rounded-xl border border-teal-100 text-center">
                <span className="text-xs text-teal-700 block">Orders Signed</span>
                <span className="text-2xl font-bold text-[#0F5E57] tabular-nums">{report.ordersSigned}</span>
              </div>
            </div>

            {/* Error / Skipped List */}
            {report.errors && report.errors.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-gray-800">
                    Row-level Validation Warnings ({report.errors.length})
                  </h4>
                  <button
                    onClick={handleDownloadErrorsCSV}
                    className="text-xs text-[#0F5E57] font-semibold hover:underline"
                  >
                    Download Errors CSV ↓
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-gray-200 rounded-xl p-3 bg-gray-50/50">
                  {report.errors.map((errItem, idx) => (
                    <div key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                      <span className="text-red-500 font-bold">•</span>
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

