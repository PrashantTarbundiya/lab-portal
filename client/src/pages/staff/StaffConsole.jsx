import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Table from '../../components/Table';
import StatusChip from '../../components/StatusChip';
import DemoRibbon from '../../components/DemoRibbon';
import StaffNavbar from '../../components/StaffNavbar';
import { SkeletonTable } from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import CreateOrderModal from '../../components/CreateOrderModal';
import LiveSampleTrackingMap from '../../components/LiveSampleTrackingMap';
import WhatsAppSimulatorDrawer from '../../components/WhatsAppSimulatorDrawer';
import PhlebotomistBarcodeScanner from '../../components/PhlebotomistBarcodeScanner';
import { HOSPITALS } from '../../components/TopMainNavbar';

export default function StaffConsole() {
  const { hospitalSlug } = useParams();
  const activeHospitalSlug =
    hospitalSlug || localStorage.getItem('labora_active_hospital_slug') || 'company-a-main-hospital';
  const activeHospital =
    HOSPITALS.find((h) => h.slug === activeHospitalSlug) || HOSPITALS[0];

  const [activeView, setActiveView] = useState('ORDERS'); // 'ORDERS' | 'HOME_COLLECTIONS'
  const [orders, setOrders] = useState([]);
  const [homeCollections, setHomeCollections] = useState([]);
  const [selectedHcForTracking, setSelectedHcForTracking] = useState(null);
  const [hcSearch, setHcSearch] = useState('');
  const [hcFilter, setHcFilter] = useState('ALL');
  const [updatingHcId, setUpdatingHcId] = useState(null);
  const [resendingId, setResendingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [simulatingOrder, setSimulatingOrder] = useState(null);
  const [scanningHcOrder, setScanningHcOrder] = useState(null);

  const navigate = useNavigate();
  const { token, logout, user } = useAuth();
  const { addToast } = useToast();

  // Keep URL canonical: /:hospitalSlug/front-desk
  useEffect(() => {
    if (!hospitalSlug) {
      navigate(`/${activeHospitalSlug}/front-desk`, { replace: true });
    }
  }, [hospitalSlug, activeHospitalSlug, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
        hospitalSlug: activeHospitalSlug,
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
          parameters: 'Complete Blood Count (CBC) • 14 Parameters',
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
          parameters: 'Comprehensive Diabetic & Lipid Profile',
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
          parameters: 'Serum Electrolytes & Critical Renal Panel',
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
          parameters: 'Liver Function Tests (LFT)',
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

  const fetchHomeCollections = async () => {
    try {
      const params = new URLSearchParams({ all: 'true' });
      if (activeHospitalSlug && activeHospitalSlug !== 'all') {
        params.append('hospitalSlug', activeHospitalSlug);
      }
      const res = await api(`/patients/home-collections?${params.toString()}`, { token });
      setHomeCollections(res.collections || []);
    } catch (err) {
      console.warn('Home collections fetch error:', err);
    }
  };

  useEffect(() => {
    setSelectedHcForTracking(null);
    fetchOrders();
    fetchHomeCollections();
  }, [page, statusFilter, deliveryFilter, activeHospitalSlug]);

  const handleUpdateHcStatus = async (bookingId, newStatus) => {
    // 1. Optimistic UI update
    setHomeCollections(prev => prev.map(c => {
      if (c.bookingId === bookingId || c.id === bookingId) {
        return { ...c, status: newStatus };
      }
      return c;
    }));
    setSelectedHcForTracking(prev => {
      if (prev && (prev.bookingId === bookingId || prev.id === bookingId)) {
        return { ...prev, status: newStatus };
      }
      return prev;
    });

    try {
      setUpdatingHcId(bookingId);
      const res = await api(`/patients/home-collections/${bookingId}/status`, {
        method: 'PATCH',
        body: { status: newStatus },
        token,
      });
      addToast(res.message || `Booking updated to ${newStatus}`, 'success');
      fetchHomeCollections();
    } catch (err) {
      console.warn('Status update fallback:', err);
      addToast(`Booking updated to ${newStatus}`, 'info');
    } finally {
      setUpdatingHcId(null);
    }
  };

  const handleQuickResend = async (orderId) => {
    try {
      setResendingId(orderId);
      await api(`/links/resend/${orderId}`, { method: 'POST', token });
      addToast('Secure 72-hour report link regenerated & queued for notification!', 'success');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, linkStatus: 'Active', deliveryStatus: 'SENT' } : o));
    } catch (err) {
      addToast(err.message || 'Resend link queued (Demo Mode)', 'success');
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, linkStatus: 'Active', deliveryStatus: 'SENT' } : o));
    } finally {
      setResendingId(null);
    }
  };

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

  const filteredHc = homeCollections.filter((c) => {
    if (hcFilter !== 'ALL' && c.status !== hcFilter) return false;
    if (!hcSearch.trim()) return true;
    const q = hcSearch.toLowerCase();
    return (
      (c.bookingId || '').toLowerCase().includes(q) ||
      (c.patientName || '').toLowerCase().includes(q) ||
      (c.packageName || '').toLowerCase().includes(q) ||
      (c.address || '').toLowerCase().includes(q)
    );
  });

  const columns = [
    {
      header: 'Order #',
      accessor: 'orderNo',
      render: (r) => (
        <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-xl border inline-block bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-xs">
          {r.orderNo}
        </span>
      ),
    },
    {
      header: 'Patient & Contact',
      accessor: 'patientName',
      render: (r) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-white text-xs leading-snug">
            {r.patientName}
          </div>
          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
            <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="tabular-nums">{r.patientPhoneMasked || '••••••0001'}</span>
          </div>
          {r.parameters && (
            <div className="text-[11px] text-teal-300/80 font-medium truncate max-w-xs mt-0.5">
              {r.parameters}
            </div>
          )}
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
        const v = r.linkStatus || 'Active';
        const color = v === 'Active' ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40 font-bold' :
          v === 'Held' ? 'text-amber-300 bg-amber-500/20 border-amber-500/40 font-bold' :
          v === 'Expired' ? 'text-rose-300 bg-rose-500/20 border-rose-500/40 font-bold' :
          'text-slate-300 bg-white/10 border-white/15 font-medium';
        return (
          <span className={`text-xs px-2.5 py-1 rounded-full border inline-block font-mono ${color}`}>
            {v}
          </span>
        );
      },
    },
    {
      header: 'Delivery',
      accessor: 'deliveryStatus',
      render: (r) => {
        const d = r.deliveryStatus || 'DELIVERED';
        const badgeVariant = d === 'DELIVERED' || d === 'OPENED' ? 'success' :
          d === 'FAILED' ? 'danger' :
          d === 'QUEUED' || d === 'SENT' ? 'warning' : 'info';
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
      render: (r) => <span className="text-xs text-slate-300 font-mono">{formatDate(r.date)}</span>,
    },
    {
      header: 'Action',
      accessor: 'actions',
      align: 'right',
      render: (r) => {
        const rawPhone = (r.patientPhoneMasked || '').replace(/\D/g, '');
        const waText = encodeURIComponent(
          `Hello ${r.patientName}, your test report (${r.orderNo}) from Company A Diagnostics is ready. View it here: ${window.location.origin}/reports/${r.id} (OTP verification required, link valid 72 hours).`
        );
        const waUrl = rawPhone.length >= 10 ? `https://wa.me/91${rawPhone.slice(-10)}?text=${waText}` : `https://wa.me/?text=${waText}`;

        return (
          <div className="flex items-center justify-end gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleQuickResend(r.id)}
              disabled={resendingId === r.id}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 px-2.5 py-1.5 rounded-lg shadow-sm transition cursor-pointer disabled:opacity-50 active:scale-95"
              title="Regenerate 72-hour secure report access token & queue notification"
            >
              {resendingId === r.id ? (
                <svg className="w-3 h-3 animate-spin text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M4 12a8 8 0 018-8" /></svg>
              ) : (
                <svg className="w-3 h-3 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              )}
              <span>{resendingId === r.id ? 'Sending...' : 'Resend'}</span>
            </button>
            <button
              type="button"
              onClick={() => setSimulatingOrder(r)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer active:scale-95"
              title="Open WhatsApp Business smartphone preview simulator & proof of delivery"
            >
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              <span>WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={() => navigate(`/staff/orders/${r.id}`)}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/10 transition cursor-pointer"
            >
              <span>Open</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="min-h-screen bg-[#07151f] text-slate-100 flex flex-col justify-between relative overflow-x-hidden selection:bg-emerald-400 selection:text-slate-950 font-sans">
      <DemoRibbon />

      {/* Atmospheric Ambience Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-36 left-1/4 w-[750px] h-[750px] bg-teal-500/10 rounded-full blur-[140px]"></div>
        <div className="absolute top-1/3 -right-40 w-[620px] h-[620px] bg-emerald-500/10 rounded-full blur-[160px]"></div>
      </div>

      {/* Main Body */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1 relative z-10">
        {/* Hospital Facility Front Desk Header (Stitch Glassmorphism) */}
        <div className="glass-card-accent p-6 rounded-3xl border border-emerald-500/30 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
          <div className="space-y-1.5 relative z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 font-medium text-[11px] border border-emerald-500/30 flex items-center gap-1.5">
                <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                <span>Front Desk Reception & Triage</span>
              </span>
              <span className="text-slate-500 text-xs hidden sm:inline">•</span>
              <span className="text-xs text-slate-400">
                Counter Token Generator & OPD Admissions
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>{activeHospital.name}</span>
            </h1>
            <p className="text-xs text-slate-400 max-w-xl">
              Managing outpatient check-ins, laboratory collection tubes, and fast-track LIS delivery for this facility.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center relative z-10">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-right">
              <span className="text-[10px] text-slate-400 block font-mono">Active Counter</span>
              <span className="text-xs font-semibold text-white">Counter 01: Admissions</span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-right">
              <span className="text-[10px] text-emerald-400 block font-mono">OPD Tokens</span>
              <span className="text-xs font-bold text-emerald-300 tabular-nums">
                {orders.filter((o) => o.isOpdToken).length} Checked In
              </span>
            </div>
          </div>
        </div>

        {/* Top Segmented Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
          <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl w-fit border border-white/10">
            <button
              type="button"
              onClick={() => setActiveView('ORDERS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeView === 'ORDERS'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
              <span>Diagnostic Orders</span>
              <span className="tabular-nums font-mono">({orders.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('HOME_COLLECTIONS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeView === 'HOME_COLLECTIONS'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              <span>Home Collections Tracker</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                activeView === 'HOME_COLLECTIONS' ? 'bg-slate-950/20 text-slate-950' : 'bg-white/10 text-slate-300'
              }`}>
                {homeCollections.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeView === 'ORDERS' ? (
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-sm transition cursor-pointer active:scale-95"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                <span>Create New Report</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={fetchHomeCollections}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-xs font-medium text-emerald-300 border border-white/10 rounded-xl transition cursor-pointer"
              >
                <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                <span>Refresh Bookings</span>
              </button>
            )}
          </div>
        </div>

        {/* ─── VIEW 1: DIAGNOSTIC ORDERS ─── */}
        {activeView === 'ORDERS' && (
          <div className="space-y-6">
            {/* Title & Search/Filter Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-display font-black text-white tracking-tight">
                  Patient Orders & Delivery Console
                </h1>
                <p className="text-xs text-slate-300 mt-0.5">
                  Track report readiness, link delivery, and critical alerts across coastal AP centres
                </p>
              </div>

              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search order #, patient name..."
                  className="w-48 sm:w-64 glass-input rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-400 shadow-sm"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 text-xs font-bold shadow-sm transition hover:from-emerald-400 hover:to-teal-500"
                >
                  Search
                </button>
              </form>
            </div>

            {/* 3 Simple Filters */}
            <div className="flex flex-wrap gap-3 items-center glass-card p-3.5 rounded-2xl border border-white/10 text-xs shadow-lg">
              <span className="font-mono font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                Filters:
              </span>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="glass-input rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-400 cursor-pointer"
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
                className="glass-input rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-400 cursor-pointer"
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
                  className="text-xs text-rose-400 hover:text-rose-300 hover:underline font-bold ml-auto cursor-pointer"
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
                <div className="glass-card rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                  <Table
                    columns={columns}
                    data={orders}
                    keyField="id"
                    emptyMessage="No matching orders found."
                  />
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-between items-center text-xs text-slate-400 pt-2 font-mono">
                    <span>
                      Showing page <strong className="text-white font-medium">{page}</strong> of <strong className="text-white font-medium">{pagination.totalPages}</strong> ({pagination.total} total orders)
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage(page - 1)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 hover:text-white border border-white/10 transition cursor-pointer disabled:opacity-40"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        <span>Previous</span>
                      </button>
                      <button
                        type="button"
                        disabled={page >= pagination.totalPages}
                        onClick={() => setPage(page + 1)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 hover:text-white border border-white/10 transition cursor-pointer disabled:opacity-40"
                      >
                        <span>Next</span>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── VIEW 2: HOME COLLECTIONS TRACKER FOR FRONT DESK ─── */}
        {activeView === 'HOME_COLLECTIONS' && (
          <div className="space-y-5">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Home Sample Collection & Dispatch Desk
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage phlebotomist assignments, cold-chain logistics, patient OTP verification, and lab reception
              </p>
            </div>

            {/* 4 KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Total Requests</span>
                  <strong className="text-lg font-bold text-white font-mono tabular-nums">{homeCollections.length} Bookings</strong>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2" /><polygon points="12 8 8 12 12 16 16 12 12 8" /></svg>
                </div>
                <div>
                  <span className="text-[11px] text-sky-300 block font-medium">Dispatched</span>
                  <strong className="text-lg font-bold text-white font-mono tabular-nums">
                    {homeCollections.filter(c => c.status === 'PHLEBOTOMIST_ASSIGNED').length} Active
                  </strong>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                </div>
                <div>
                  <span className="text-[11px] text-purple-300 block font-medium">Samples Collected</span>
                  <strong className="text-lg font-bold text-white font-mono tabular-nums">
                    {homeCollections.filter(c => c.status === 'SAMPLE_COLLECTED').length} In Transit
                  </strong>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <div>
                  <span className="text-[11px] text-emerald-300 block font-medium">Received in Lab</span>
                  <strong className="text-lg font-bold text-white font-mono tabular-nums">
                    {homeCollections.filter(c => c.status === 'RECEIVED_AT_LAB').length} Checked In
                  </strong>
                </div>
              </div>
            </div>

            {/* Search Bar & Filter Chips */}
            <div className="space-y-3 p-3.5 rounded-xl bg-white/5 border border-white/10">
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </span>
                <input
                  type="text"
                  value={hcSearch}
                  onChange={(e) => setHcSearch(e.target.value)}
                  placeholder="Search by patient name, booking ID, address, or package..."
                  className="w-full pl-9 pr-8 py-2.5 glass-input rounded-xl border border-white/15 text-xs sm:text-sm text-white placeholder-slate-400 focus:border-emerald-400 outline-none transition"
                />
                {hcSearch && (
                  <button
                    type="button"
                    onClick={() => setHcSearch('')}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
                    aria-label="Clear search"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>

              <div className="flex gap-2 overflow-x-auto no-scrollbar py-0.5 text-xs font-mono">
                {[
                  { id: 'ALL', label: `All Requests (${homeCollections.length})` },
                  { id: 'CONFIRMED', label: `Confirmed (${homeCollections.filter(c => c.status === 'CONFIRMED').length})` },
                  { id: 'PHLEBOTOMIST_ASSIGNED', label: `Phlebotomist Assigned (${homeCollections.filter(c => c.status === 'PHLEBOTOMIST_ASSIGNED').length})` },
                  { id: 'SAMPLE_COLLECTED', label: `Sample Collected (${homeCollections.filter(c => c.status === 'SAMPLE_COLLECTED').length})` },
                  { id: 'RECEIVED_AT_LAB', label: `Received in Lab (${homeCollections.filter(c => c.status === 'RECEIVED_AT_LAB').length})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setHcFilter(tab.id)}
                    className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap text-xs font-bold ${
                      hcFilter === tab.id
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-sm'
                        : 'bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live GPS Phlebotomist Dispatch & Sample Collection Tracking Map */}
            <div id="staff-dispatch-map" className="glass-card p-4 rounded-3xl border border-white/10 shadow-xl space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span>Phlebotomist Live Dispatch & Sample Collection GPS Map</span>
                  </span>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    Real-Time Cold-Chain Tracking
                  </span>
                </div>
                {selectedHcForTracking && (
                  <span className="text-[11px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    Active Patient: #{selectedHcForTracking.bookingId} ({selectedHcForTracking.patientName})
                  </span>
                )}
              </div>

              <div className="rounded-xl overflow-hidden border border-white/10 shadow-inner">
                <LiveSampleTrackingMap
                  bookingId={selectedHcForTracking?.bookingId || filteredHc[0]?.bookingId || 'HC-841920'}
                  hospitalName={activeHospital.name}
                  patientAddress={selectedHcForTracking?.address || filteredHc[0]?.address || 'Benz Circle, Vijayawada'}
                  phlebotomistName={selectedHcForTracking?.assignedPhlebotomist?.name || filteredHc[0]?.assignedPhlebotomist?.name || 'Ravi Teja'}
                  phlebotomistPhone={selectedHcForTracking?.assignedPhlebotomist?.phone || '+91 98480 22119'}
                  temperature={4.2}
                  etaMinutes={selectedHcForTracking?.status === 'CONFIRMED' ? 20 : 12}
                  height="280px"
                />
              </div>
            </div>

            {/* Home Collections Cards List */}
            {filteredHc.length === 0 ? (
              <div className="p-8 rounded-xl bg-white/5 border border-white/10 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-lg bg-white/5 flex items-center justify-center text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                </div>
                <h3 className="font-semibold text-white text-xs">No Home Collection Requests Found</h3>
                <p className="text-[11px] text-slate-400">No appointments match the selected filter criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredHc.map((c) => {
                  const statusColors = c.status === 'CONFIRMED'
                    ? { bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30', bar: 'border-l-amber-400' }
                    : c.status === 'PHLEBOTOMIST_ASSIGNED'
                    ? { bg: 'bg-sky-500/10 text-sky-300 border-sky-500/30', bar: 'border-l-sky-400' }
                    : c.status === 'SAMPLE_COLLECTED'
                    ? { bg: 'bg-purple-500/10 text-purple-300 border-purple-500/30', bar: 'border-l-purple-400' }
                    : { bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30', bar: 'border-l-emerald-400' };

                  return (
                    <div
                      key={c.id}
                      className={`p-4 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col justify-between space-y-3.5 border-l-4 ${statusColors.bar}`}
                    >
                      {/* Top Row: ID, Package, Status */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="font-mono text-xs font-semibold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              #{c.bookingId}
                            </span>
                            <h3 className="font-semibold text-white text-sm leading-snug mt-1">
                              {c.packageName}
                            </h3>
                          </div>
                          <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border ${statusColors.bg}`}>
                            {c.status.replace(/_/g, ' ')}
                          </span>
                        </div>

                        {/* Patient & Window Details */}
                        <div className="grid grid-cols-2 gap-2 p-2.5 bg-white/5 rounded-xl border border-white/10 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-mono">Patient</span>
                            <strong className="text-white font-semibold block truncate">{c.patientName}</strong>
                            <span className="text-[11px] text-slate-300 font-mono block">{c.phoneMasked || c.mobileE164}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block font-mono">Appointment Slot</span>
                            <strong className="text-white font-semibold block">{c.preferredDate}</strong>
                            <span className="text-[11px] text-emerald-400 font-medium block">{c.timeSlot}</span>
                          </div>
                        </div>

                        {/* Address */}
                        <div className="text-xs text-slate-300 bg-white/5 p-2.5 rounded-xl border border-white/10 space-y-1">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-mono">Collection Address:</span>
                            <span className="font-medium text-white block">{c.address}</span>
                            {c.landmark && <span className="text-[11px] text-slate-400 block">Landmark: {c.landmark}</span>}
                          </div>
                          
                          {/* Payment Instructions for Phlebotomist */}
                          <div className="pt-1.5 border-t border-white/10 flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-medium">Billing / Payment:</span>
                            {c.paymentMethod === 'ONLINE_RAZORPAY' ? (
                              <span className="inline-flex items-center gap-1 font-medium text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                <span>Paid Online ({c.paymentAmount || '₹450'})</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-semibold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 font-mono">
                                <span>Collect Cash: {c.paymentAmount || '₹990'}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Assigned Phlebotomist & OTP */}
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-mono">Phlebotomist:</span>
                            <strong className="text-white font-medium block">
                              {c.assignedPhlebotomist?.name || 'Unassigned'}
                            </strong>
                            <span className="text-[10px] font-mono text-teal-300">
                              {c.assignedPhlebotomist?.badgeId || ''} • {c.assignedPhlebotomist?.phone || ''}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-mono">Patient Verification OTP:</span>
                            <span className="font-mono font-bold text-xs text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/30 inline-block tabular-nums">
                              {c.collectionOtp}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Front Desk Action Bar */}
                      <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[11px] text-slate-400 font-medium">
                          Update Workflow Stage:
                        </span>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedHcForTracking(c);
                              const el = document.getElementById('staff-dispatch-map');
                              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 hover:text-white font-mono text-xs border border-teal-500/30 transition cursor-pointer flex items-center gap-1"
                            title="View patient location & phlebotomist GPS route on map"
                          >
                            <svg className="w-3 h-3 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                            <span>Map Route</span>
                          </button>

                          {c.status === 'CONFIRMED' && (
                            <button
                              type="button"
                              disabled={updatingHcId === c.id}
                              onClick={() => handleUpdateHcStatus(c.id, 'PHLEBOTOMIST_ASSIGNED')}
                              className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2" /><polygon points="12 8 8 12 12 16 16 12 12 8" /></svg>
                              <span>Dispatch Phlebotomist</span>
                            </button>
                          )}

                          {c.status === 'PHLEBOTOMIST_ASSIGNED' && (
                            <button
                              type="button"
                              disabled={updatingHcId === c.id}
                              onClick={() => handleUpdateHcStatus(c.id, 'SAMPLE_COLLECTED')}
                              className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                              <span>Mark Sample Collected</span>
                            </button>
                          )}

                          {/* Phlebotomist Barcode Tube Scanner */}
                          {c.status !== 'RECEIVED_AT_LAB' && (
                            <button
                              type="button"
                              onClick={() => setScanningHcOrder(c)}
                              className="px-2.5 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-200 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 active:scale-95"
                              title="Scan vacuum tube barcodes with camera & record cold-chain"
                            >
                              <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              <span>Scan Tube</span>
                            </button>
                          )}

                          {c.status === 'SAMPLE_COLLECTED' && (
                            <button
                              type="button"
                              disabled={updatingHcId === c.id}
                              onClick={() => handleUpdateHcStatus(c.id, 'RECEIVED_AT_LAB')}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                              <span>Check In at Central Lab</span>
                            </button>
                          )}

                          {c.status === 'RECEIVED_AT_LAB' && (
                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-300 rounded-lg text-xs font-medium border border-emerald-500/30 font-mono">
                              In Central LIS Queue
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Manual Walk-in Order Creation Modal */}
      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onOrderCreated={() => fetchOrders()}
        token={token}
      />

      {/* Feature 3: WhatsApp Interactive Template Simulator Drawer */}
      <WhatsAppSimulatorDrawer
        isOpen={!!simulatingOrder}
        onClose={() => setSimulatingOrder(null)}
        order={simulatingOrder}
        facilityName={activeHospital?.name}
      />

      {/* Feature 4: Offline PWA Barcode Scanner for Phlebotomists */}
      <PhlebotomistBarcodeScanner
        isOpen={!!scanningHcOrder}
        onClose={() => setScanningHcOrder(null)}
        defaultOrderNo={scanningHcOrder?.orderNo || 'HC-ORD-71250'}
        defaultPatient={scanningHcOrder?.patientName || 'Patient'}
      />
    </div>
  );
}

