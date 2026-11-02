import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

export default function StaffConsole() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const navigate = useNavigate();
  const { token, logout, user } = useAuth();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
      });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (deliveryFilter) params.append('deliveryStatus', deliveryFilter);

      const res = await api(`/orders?${params.toString()}`, { token });
      setOrders(res.orders || []);
      if (res.pagination) setPagination(res.pagination);
    } catch (err) {
      console.warn('Orders fetch error, demo fallback:', err);
      // Demo fallback orders
      setOrders([
        {
          id: 'ord-1',
          orderNo: 'ORD-71204',
          patientName: 'Lakshmi Prasanna K',
          patientPhoneMasked: '••••••0001',
          status: 'SIGNED',
          linkStatus: 'Active',
          deliveryStatus: 'DELIVERED',
          hasCritical: false,
          hasOpenCallback: false,
          date: '2026-11-01T10:15:00+05:30',
        },
        {
          id: 'ord-2',
          orderNo: 'ORD-71205',
          patientName: 'Srinivas Rao T',
          patientPhoneMasked: '••••••0001',
          status: 'SIGNED',
          linkStatus: 'Active',
          deliveryStatus: 'DELIVERED',
          hasCritical: false,
          hasOpenCallback: false,
          date: '2026-11-01T11:00:00+05:30',
        },
        {
          id: 'ord-3',
          orderNo: 'ORD-71233',
          patientName: 'Farzana Begum',
          patientPhoneMasked: '••••••0003',
          status: 'SIGNED',
          linkStatus: 'Held',
          deliveryStatus: 'NOT_SENT',
          hasCritical: true,
          hasOpenCallback: true,
          date: '2026-11-01T11:40:00+05:30',
        },
        {
          id: 'ord-4',
          orderNo: 'ORD-71219',
          patientName: 'Venkata Rao M',
          patientPhoneMasked: '••••••0002',
          status: 'PROCESSING',
          linkStatus: 'Not sent',
          deliveryStatus: 'NOT_SENT',
          hasCritical: false,
          hasOpenCallback: false,
          date: '2026-11-01T09:00:00+05:30',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, deliveryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleString('en-IN', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
    } catch {
      return isoString;
    }
  };

  const columns = [
    {
      header: 'Order #',
      accessor: 'orderNo',
      render: (r) => (
        <span className="font-bold text-gray-900">{r.orderNo}</span>
      ),
    },
    {
      header: 'Patient & Contact',
      accessor: 'patientName',
      render: (r) => (
        <div>
          <div className="font-semibold text-gray-900">{r.patientName}</div>
          <div className="text-xs text-gray-500 font-mono">{r.patientPhoneMasked}</div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (r) => <StatusChip status={r.status} isHeld={r.hasOpenCallback} />,
    },
    {
      header: 'Link Status',
      accessor: 'linkStatus',
      render: (r) => {
        const v = r.linkStatus;
        const color = v === 'Active' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
          v === 'Held' ? 'text-amber-800 bg-amber-50 border-amber-200' :
          v === 'Expired' ? 'text-red-700 bg-red-50 border-red-200' :
          'text-gray-600 bg-gray-50 border-gray-200';
        return (
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${color}`}>
            {v}
          </span>
        );
      },
    },
    {
      header: 'Delivery',
      accessor: 'deliveryStatus',
      render: (r) => {
        const d = r.deliveryStatus;
        const badgeVariant = d === 'DELIVERED' || d === 'OPENED' ? 'success' :
          d === 'FAILED' ? 'danger' :
          d === 'QUEUED' || d === 'SENT' ? 'warning' : 'default';
        return (
          <Badge variant={badgeVariant} size="sm">
            {d}
          </Badge>
        );
      },
    },
    {
      header: 'Date (IST)',
      accessor: 'date',
      render: (r) => <span className="text-xs text-gray-500">{formatDate(r.date)}</span>,
    },
    {
      header: 'Action',
      accessor: 'actions',
      align: 'right',
      render: (r) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(`/staff/orders/${r.id}`)}
          className="text-xs"
        >
          Open →
        </Button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col">
      <DemoRibbon />

      {/* Staff Header & Navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0F5E57] flex items-center justify-center text-white font-bold text-sm">
                  A
                </div>
                <span className="font-bold text-gray-900 text-base">
                  Lab Console
                </span>
              </div>

              <nav className="hidden md:flex space-x-1">
                <Link
                  to="/staff"
                  className="px-3 py-2 rounded-lg text-sm font-semibold bg-[#0F5E57]/10 text-[#0F5E57]"
                >
                  Orders
                </Link>
                <Link
                  to="/staff/import"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  LIS Import
                </Link>
                <Link
                  to="/staff/tasks"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  Tasks & Flags
                </Link>
                <Link
                  to="/staff/access-log"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  Access Log
                </Link>
                <Link
                  to="/staff/operations"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                >
                  Operations Report
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 hidden sm:inline">
                Signed in as <strong className="text-gray-700">{user?.email || 'Staff'}</strong>
              </span>
              <button
                onClick={() => {
                  logout();
                  navigate('/staff/login');
                }}
                className="text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 flex-1">
        {/* Title & Search/Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Patient Orders & Delivery Console
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Track report readiness, link delivery, and critical alerts
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md w-full">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order #, name, or last 4 digits..."
              className="flex-1 rounded-lg border border-gray-300 px-3.5 py-2 text-sm focus:outline-none focus:border-[#0F5E57] focus:ring-1 focus:ring-[#0F5E57]"
            />
            <Button type="submit" variant="primary" size="sm" className="whitespace-nowrap">
              Search
            </Button>
          </form>
        </div>

        {/* 3 Simple Filters per spec */}
        <div className="flex flex-wrap gap-3 items-center bg-white p-3.5 rounded-xl border border-gray-200 text-xs">
          <span className="font-semibold text-gray-500 uppercase tracking-wider text-[11px]">
            Filters:
          </span>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs bg-white text-gray-700 outline-none focus:border-[#0F5E57]"
          >
            <option value="">All Statuses</option>
            <option value="SIGNED">Signed / Ready</option>
            <option value="PROCESSING">Processing</option>
          </select>

          <select
            value={deliveryFilter}
            onChange={(e) => {
              setDeliveryFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs bg-white text-gray-700 outline-none focus:border-[#0F5E57]"
          >
            <option value="">All Delivery States</option>
            <option value="DELIVERED">Delivered</option>
            <option value="OPENED">Opened by Patient</option>
            <option value="FAILED">Failed (WhatsApp)</option>
            <option value="NOT_SENT">Not Sent / Held</option>
          </select>

          {(statusFilter || deliveryFilter || search) && (
            <button
              onClick={() => {
                setStatusFilter('');
                setDeliveryFilter('');
                setSearch('');
                setPage(1);
              }}
              className="text-xs text-red-600 hover:underline font-semibold ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Orders Table */}
        {loading ? (
          <SkeletonTable rows={8} cols={7} />
        ) : error ? (
          <ErrorState description={error} onRetry={fetchOrders} />
        ) : (
          <div className="space-y-4">
            <Table
              columns={columns}
              data={orders}
              keyField="id"
              emptyMessage="No matching orders found."
            />

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-between items-center text-xs text-gray-500 pt-2">
                <span>
                  Showing page <strong className="text-gray-800">{page}</strong> of <strong className="text-gray-800">{pagination.totalPages}</strong> ({pagination.total} total orders)
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    ← Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                  >
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
