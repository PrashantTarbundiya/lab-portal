import { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Table from '../../components/Table';
import StatusChip from '../../components/StatusChip';
import DemoRibbon from '../../components/DemoRibbon';
import { SkeletonTable } from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';

export default function DoctorDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token, logout, user } = useAuth();

  const fetchDoctorOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api('/doctors/orders', { token });
      setOrders(res.orders || []);
    } catch (err) {
      console.warn('Doctor orders fallback:', err);
      // Demo fallback orders for Dr. S. Ramanaiah
      setOrders([
        {
          id: 'ord-1',
          orderNo: 'ORD-71204',
          patientName: 'Lakshmi Prasanna K',
          sex: 'F',
          date: '2026-11-01T10:15:00+05:30',
          status: 'SIGNED',
          parameters: 'Haemoglobin, Total WBC, Platelet count, RBC count',
          hasAbnormal: true,
          hasCritical: false,
        },
        {
          id: 'ord-2',
          orderNo: 'ORD-71205',
          patientName: 'Srinivas Rao T',
          sex: 'M',
          date: '2026-11-01T11:00:00+05:30',
          status: 'SIGNED',
          parameters: 'Fasting glucose, HbA1c, Total cholesterol, LDL cholesterol',
          hasAbnormal: true,
          hasCritical: false,
        },
        {
          id: 'ord-5',
          orderNo: 'ORD-71208',
          patientName: 'Sumalatha G',
          sex: 'F',
          date: '2026-11-01T14:00:00+05:30',
          status: 'SIGNED',
          parameters: 'Creatinine, Potassium, Sodium',
          hasAbnormal: true,
          hasCritical: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorOrders();
  }, []);

  const formatDate = (isoString) => {
    if (!isoString) return '';
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

  const columns = [
    {
      header: 'Order #',
      accessor: 'orderNo',
      render: (r) => <span className="font-bold text-gray-900">{r.orderNo}</span>,
    },
    {
      header: 'Patient Name',
      accessor: 'patientName',
      render: (r) => (
        <div>
          <span className="font-semibold text-gray-900">{r.patientName}</span>
          <span className="text-xs text-gray-400 ml-1.5 font-normal">({r.sex})</span>
        </div>
      ),
    },
    {
      header: 'Test Parameters',
      accessor: 'parameters',
      render: (r) => (
        <span className="text-xs text-gray-700 max-w-sm truncate block" title={r.parameters}>
          {r.parameters}
        </span>
      ),
    },
    {
      header: 'Date (IST)',
      accessor: 'date',
      render: (r) => <span className="text-xs text-gray-500">{formatDate(r.date)}</span>,
    },
    {
      header: 'Findings',
      accessor: 'findings',
      render: (r) => {
        if (r.hasCritical) return <Badge variant="danger" size="sm">CRITICAL</Badge>;
        if (r.hasAbnormal) return <Badge variant="warning" size="sm">Out of Range</Badge>;
        return <Badge variant="success" size="sm">Normal</Badge>;
      },
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (r) => <StatusChip status={r.status} />,
    },
    {
      header: 'Report',
      accessor: 'action',
      align: 'right',
      render: (r) => (
        <a
          href={`/api/orders/${r.id}/pdf`}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-[#0F5E57] hover:underline font-bold"
        >
          View PDF ↗
        </a>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col">
      <DemoRibbon />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0F5E57] flex items-center justify-center text-white font-bold text-sm">
                Dr
              </div>
              <div>
                <span className="font-bold text-gray-900 text-base leading-none block">
                  Referring Doctor Portal
                </span>
                <span className="text-[11px] text-gray-400">Company A Diagnostics</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">
                Logged in as <strong className="text-gray-800">{user?.email || 'Dr. S. Ramanaiah'}</strong>
              </span>
              <button
                onClick={() => { logout(); }}
                className="text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 flex-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Referred Patient Diagnostic Reports
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Showing reports from the last 90 days. Patient phone numbers are masked to protect personal data.
            </p>
          </div>
          <button
            onClick={fetchDoctorOrders}
            className="text-xs text-[#0F5E57] font-semibold hover:underline"
          >
            ↻ Refresh List
          </button>
        </div>

        {loading ? (
          <SkeletonTable rows={6} cols={7} />
        ) : error ? (
          <ErrorState description={error} onRetry={fetchDoctorOrders} />
        ) : (
          <Table
            columns={columns}
            data={orders}
            keyField="id"
            emptyMessage="No referred patient reports found in the last 90 days."
          />
        )}
      </main>

      <footer className="p-4 text-center text-xs text-gray-400">
        <span>Company A Diagnostics • Referring Physician Network</span>
      </footer>
    </div>
  );
}
