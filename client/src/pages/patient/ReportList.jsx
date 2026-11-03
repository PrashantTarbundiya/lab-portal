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

export default function ReportList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const { t } = useLanguage();

  const patientId = searchParams.get('patientId');

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

        {loading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : error ? (
          <ErrorState description={error} onRetry={fetchOrders} />
        ) : orders.length === 0 ? (
          <EmptyState
            title={t('emptyReports')}
            description="When your reports are processed and verified by the pathologist, they will appear here."
            actionLabel={t('emptyReportsAction')}
            onAction={fetchOrders}
          />
        ) : (
          <div className="space-y-3.5">
            {orders.map((order) => (
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
    </div>
  );
}

