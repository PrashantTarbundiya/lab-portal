import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../utils/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusChip from '../../components/StatusChip';
import PatientNavbar from '../../components/PatientNavbar';
import DemoRibbon from '../../components/DemoRibbon';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { SkeletonCard } from '../../components/Skeleton';
import FloatingAICopilot from '../../components/FloatingAICopilot';

export default function ReportList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('ALL');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const { t } = useLanguage();

  const patientId = searchParams.get('patientId');

  const filteredOrders = orders.filter((o) => {
    if (filterTab === 'SIGNED' && o.status !== 'SIGNED') return false;
    if (filterTab === 'PROCESSING' && o.status !== 'PROCESSING') return false;
    if (filterTab === 'CRITICAL' && !o.hasCritical) return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (o.testName || '').toLowerCase().includes(term) ||
      (o.patientName || '').toLowerCase().includes(term) ||
      (o.orderNo || '').toLowerCase().includes(term)
    );
  });

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const query = patientId ? `?patientId=${patientId}` : '';
      const res = await api(`/orders${query}`, { token });
      setOrders(res.orders || []);
    } catch (err) {
      console.warn('Orders fetch fallback:', err);
      // Demo fallback orders
      setOrders([
        {
          id: 'ord-1',
          orderNo: 'ORD-71204',
          testName: 'Haemoglobin + Complete Blood Count',
          patientName: 'Lakshmi Prasanna K',
          date: '2026-11-01T10:15:00+05:30',
          status: 'SIGNED',
          isHeld: false,
          hasCritical: false,
        },
        {
          id: 'ord-2',
          orderNo: 'ORD-71205',
          testName: 'Lipid Profile & Glucose Panel',
          patientName: 'Srinivas Rao T',
          date: '2026-11-01T11:00:00+05:30',
          status: 'SIGNED',
          isHeld: false,
          hasCritical: false,
        },
        {
          id: 'ord-3',
          orderNo: 'ORD-71233',
          testName: 'Electrolytes & Renal Function',
          patientName: 'Farzana Begum',
          date: '2026-11-01T11:40:00+05:30',
          status: 'SIGNED',
          isHeld: true,
          hasCritical: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [patientId]);

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-between">
      <DemoRibbon />
      <PatientNavbar backTo="/profiles" backLabel="Profiles" />

      <main className="flex-1 px-4 py-4 max-w-lg w-full mx-auto space-y-4">
        <div className="flex justify-between items-end pb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {t('reportsTitle')}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Showing diagnostic test reports
            </p>
          </div>
          <button
            onClick={fetchOrders}
            className="text-xs text-[#0F5E57] font-semibold hover:underline"
          >
            ↻ Refresh
          </button>
        </div>

        {/* Search Bar & Status Filter */}
        {orders.length > 0 && (
          <div className="space-y-2">
            <div className="relative">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 text-xs">
                🔍
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by test name, order #, or patient..."
                className="w-full pl-8 pr-3 py-2 bg-white rounded-xl border border-gray-200 text-xs focus:border-[#0F5E57] focus:ring-1 focus:ring-[#0F5E57] outline-none shadow-2xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs font-bold">
              {[
                { id: 'ALL', label: `All (${orders.length})` },
                { id: 'SIGNED', label: `Verified (${orders.filter(o => o.status === 'SIGNED').length})` },
                { id: 'PROCESSING', label: `Processing (${orders.filter(o => o.status === 'PROCESSING').length})` },
                { id: 'CRITICAL', label: `Critical (${orders.filter(o => o.hasCritical).length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterTab(tab.id)}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer whitespace-nowrap ${
                    filterTab === tab.id
                      ? 'bg-[#0F5E57] text-white shadow-2xs'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : error ? (
          <ErrorState description={error} onRetry={fetchOrders} />
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            title={searchTerm ? 'No matching reports' : t('emptyReports')}
            description={
              searchTerm
                ? `No diagnostic reports match "${searchTerm}". Try adjusting your search term or filters.`
                : 'When your reports are processed and verified by the pathologist, they will appear here.'
            }
            actionLabel={searchTerm ? 'Clear Search' : t('emptyReportsAction')}
            onAction={searchTerm ? () => setSearchTerm('') : fetchOrders}
          />
        ) : (
          <div className="space-y-3.5">
            {filteredOrders.map((order) => (
              <Card
                key={order.id}
                className="p-5 border-gray-200/90 hover:border-gray-300 transition-all shadow-sm"
              >
                <div className="flex justify-between items-start gap-3 mb-2.5">
                  <div>
                    <h2 className="font-bold text-gray-900 text-base leading-snug">
                      {order.testName}
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Patient: <strong className="text-gray-700 font-semibold">{order.patientName}</strong>
                    </p>
                  </div>
                  <StatusChip status={order.status} isHeld={order.isHeld} />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100 mt-3">
                  <div className="tabular-nums">
                    <span>Order: #{order.orderNo}</span>
                    <span className="mx-1.5">•</span>
                    <span>{formatDate(order.date)}</span>
                  </div>

                  {order.isHeld ? (
                    <span className="text-amber-700 text-xs font-medium">
                      Lab calling soon
                    </span>
                  ) : order.status === 'PROCESSING' ? (
                    <span className="text-gray-400 text-xs font-medium">
                      In progress
                    </span>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/reports/${order.id}`)}
                      className="text-xs font-semibold px-3 py-1.5 min-h-[36px]"
                    >
                      {t('openReport')} →
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <footer className="p-4 text-center text-xs text-gray-400 max-w-lg w-full mx-auto">
        <a href="/privacy" className="hover:underline text-gray-500">
          Privacy & Data Rights
        </a>
        <span className="mx-2">•</span>
        <span>Company A Diagnostics</span>
      </footer>

      {/* Floating Global AI Copilot */}
      <FloatingAICopilot />
    </div>
  );
}

