import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import Table from '../../components/Table';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import DemoRibbon from '../../components/DemoRibbon';
import StaffNavbar from '../../components/StaffNavbar';
import { SkeletonTable } from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';

export default function AccessLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const { token, logout, user } = useAuth();

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({
        page: String(page),
        limit: '25',
      });
      if (actionFilter) params.append('action', actionFilter);
      if (outcomeFilter) params.append('outcome', outcomeFilter);

      const res = await api(`/access-log?${params.toString()}`, { token });
      setLogs(res.logs || []);
      if (res.pagination) setPagination(res.pagination);
    } catch (err) {
      console.warn('Access log fetch error, demo fallback:', err);
      // Demo fallback logs
      setLogs([
        {
          id: 'log-1',
          at: new Date().toISOString(),
          actorType: 'PATIENT',
          action: 'LOGIN',
          outcome: 'OK',
          detail: 'OTP login verified',
          ipHash: 'a1b2c3d4',
          userAgentShort: 'Mobile Safari/17',
        },
        {
          id: 'log-2',
          at: new Date(Date.now() - 3600000).toISOString(),
          actorType: 'PATIENT',
          action: 'REPORT_VIEW',
          outcome: 'OK',
          detail: null,
          ipHash: 'a1b2c3d4',
          userAgentShort: 'Mobile Safari/17',
        },
        {
          id: 'log-3',
          at: new Date(Date.now() - 7200000).toISOString(),
          actorType: 'STAFF',
          action: 'RESEND_LINK',
          outcome: 'OK',
          detail: 'Resent link token',
          ipHash: 'e5f6g7h8',
          userAgentShort: 'Chrome/120',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, outcomeFilter]);

  const handleExportCSV = async () => {
    try {
      const res = await fetch('/api/access-log/export', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'audit_access_logs.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export CSV error:', err);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleString('en-IN', {
        dateStyle: 'short',
        timeStyle: 'medium',
      });
    } catch {
      return isoString;
    }
  };

  const columns = [
    {
      header: 'Timestamp (IST)',
      accessor: 'at',
      render: (r) => <span className="text-xs font-mono text-gray-500">{formatDate(r.at)}</span>,
    },
    {
      header: 'Actor',
      accessor: 'actorType',
      render: (r) => {
        const variant = r.actorType === 'PATIENT' ? 'info' :
          r.actorType === 'STAFF' ? 'success' : 'default';
        return <Badge variant={variant} size="sm">{r.actorType}</Badge>;
      },
    },
    {
      header: 'Action',
      accessor: 'action',
      render: (r) => <span className="font-bold text-xs text-gray-800">{r.action}</span>,
    },
    {
      header: 'Outcome',
      accessor: 'outcome',
      render: (r) => {
        const variant = r.outcome === 'OK' ? 'success' :
          r.outcome === 'DENIED' || r.outcome === 'OTP_FAIL' ? 'danger' : 'warning';
        return <Badge variant={variant} size="sm">{r.outcome}</Badge>;
      },
    },
    {
      header: 'IP Hash',
      accessor: 'ipHash',
      render: (r) => <span className="text-xs font-mono text-gray-400">{r.ipHash || '—'}</span>,
    },
    {
      header: 'Detail / Client',
      accessor: 'detail',
      render: (r) => (
        <span className="text-xs text-gray-600 truncate max-w-xs block" title={r.detail || r.userAgentShort}>
          {r.detail || r.userAgentShort || '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col">
      <DemoRibbon />
      <StaffNavbar />

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Audit & Access Log
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Append-only tamper-resistant log of every patient and staff action.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleExportCSV}>
            📥 Export CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center bg-white p-3.5 rounded-xl border border-gray-200 text-xs">
          <span className="font-semibold text-gray-500 uppercase tracking-wider text-[11px]">
            Filters:
          </span>

          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs bg-white text-gray-700 outline-none"
          >
            <option value="">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="OTP_SEND">OTP_SEND</option>
            <option value="OTP_VERIFY">OTP_VERIFY</option>
            <option value="OTP_FAIL">OTP_FAIL</option>
            <option value="LINK_OPEN">LINK_OPEN</option>
            <option value="REPORT_VIEW">REPORT_VIEW</option>
            <option value="PDF_DOWNLOAD">PDF_DOWNLOAD</option>
            <option value="RESEND_LINK">RESEND_LINK</option>
            <option value="PHONE_REVEAL">PHONE_REVEAL</option>
            <option value="TASK_DONE">TASK_DONE</option>
            <option value="WRONG_NUMBER">WRONG_NUMBER</option>
            <option value="IMPORT">IMPORT</option>
          </select>

          <select
            value={outcomeFilter}
            onChange={(e) => { setOutcomeFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs bg-white text-gray-700 outline-none"
          >
            <option value="">All Outcomes</option>
            <option value="OK">OK</option>
            <option value="DENIED">DENIED</option>
            <option value="OTP_FAIL">OTP_FAIL</option>
            <option value="EXPIRED">EXPIRED</option>
            <option value="RATE_LIMITED">RATE_LIMITED</option>
          </select>

          {(actionFilter || outcomeFilter) && (
            <button
              onClick={() => { setActionFilter(''); setOutcomeFilter(''); setPage(1); }}
              className="text-xs text-red-600 hover:underline font-semibold ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Log Table */}
        {loading ? (
          <SkeletonTable rows={10} cols={6} />
        ) : error ? (
          <ErrorState description={error} onRetry={fetchLogs} />
        ) : (
          <div className="space-y-4">
            <Table
              columns={columns}
              data={logs}
              keyField="id"
              emptyMessage="No access log records found."
            />

            {pagination.totalPages > 1 && (
              <div className="flex justify-between items-center text-xs text-gray-500 pt-2">
                <span>
                  Showing page <strong className="text-gray-800">{page}</strong> of <strong className="text-gray-800">{pagination.totalPages}</strong> ({pagination.total} entries)
                </span>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    ← Previous
                  </Button>
                  <Button variant="secondary" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>
                    Next →
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

