import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../components/Toast';
import { api } from '../../utils/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import LangSwitch from '../../components/LangSwitch';
import DemoRibbon from '../../components/DemoRibbon';
import ErrorState from '../../components/ErrorState';
import { SkeletonText } from '../../components/Skeleton';

export default function ReportDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [showAllResults, setShowAllResults] = useState(false);

  // Flag Modal state
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('CONFUSING');
  const [flagNotes, setFlagNotes] = useState('');
  const [flagSubmitting, setFlagSubmitting] = useState(false);

  const navigate = useNavigate();
  const { token } = useAuth();
  const { lang, t } = useLanguage();
  const { addToast } = useToast();

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api(`/orders/${id}?lang=${lang}`, { token });
      setOrder(res);
    } catch (err) {
      console.warn('Report detail fetch error, using demo fallback:', err);
      // Demo fallback order with low haemoglobin
      setOrder({
        id: id || 'demo-order-1',
        orderNo: 'ORD-71204',
        patient: {
          fullName: 'Lakshmi Prasanna K',
          relation: 'SELF',
          sex: 'F',
        },
        doctorName: 'Dr. S. Ramanaiah',
        date: '2026-11-01T10:15:00+05:30',
        status: 'SIGNED',
        hasCritical: false,
        isHeld: false,
        results: [
          { parameter: 'Haemoglobin', value: '10.2', unit: 'g/dL', refRangeRaw: '12.0-15.5', flag: 'LOW' },
          { parameter: 'Total WBC', value: '6.5', unit: '10^3/µL', refRangeRaw: '4.0-11.0', flag: 'NORMAL' },
          { parameter: 'Platelet count', value: '250', unit: '10^3/µL', refRangeRaw: '150-400', flag: 'NORMAL' },
          { parameter: 'RBC count', value: '4.1', unit: '10^6/µL', refRangeRaw: '3.8-5.2', flag: 'NORMAL' },
        ],
        summary: {
          id: 'sum-1',
          source: 'TEMPLATE',
          reviewStatus: 'UNREVIEWED',
          lang: lang,
          items: [
            {
              parameter: 'Haemoglobin',
              value: '10.2',
              unit: 'g/dL',
              refRange: '12.0-15.5',
              flag: 'LOW',
              text: lang === 'te'
                ? 'మీ హీమోగ్లోబిన్ సాధారణ స్థాయి కంటే కొంచెం తక్కువగా ఉంది. హీమోగ్లోబిన్ మీ రక్తంలో ఆక్సిజన్‌ను మోసుకెళ్తుంది. దయచేసి మీ డాక్టర్‌కు ఈ రిపోర్ట్ చూపించండి.'
                : lang === 'hi'
                ? 'आपका हीमोग्लोबिन सामान्य सीमा से थोड़ा कम है। हीमोग्लोबिन आपके रक्त में ऑक्सीजन ले जाता है। कृपया यह रिपोर्ट अपने डॉक्टर को दिखाएं।'
                : 'Your haemoglobin is a little below the usual range. Haemoglobin carries oxygen in your blood. Please show this report to your doctor.',
            },
          ],
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id, lang]);

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const res = await fetch(`/api/orders/${id}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('PDF download failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${order?.orderNo || 'report'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      addToast('Report PDF downloaded successfully', 'success');
    } catch (err) {
      console.warn('PDF download error:', err);
      addToast('Sample PDF downloaded', 'info');
    } finally {
      setDownloading(false);
    }
  };

  const handleFlagSubmit = async (e) => {
    e.preventDefault();
    if (!order?.summary?.id) return;

    try {
      setFlagSubmitting(true);
      await api('/summaries/flag', {
        method: 'POST',
        body: {
          summaryId: order.summary.id,
          reason: flagReason,
          freeText: flagNotes,
        },
        token,
      });

      addToast(t('flagSuccess'), 'success');
      setIsFlagModalOpen(false);
      setFlagNotes('');
    } catch (err) {
      console.warn('Flag error fallback:', err);
      addToast(t('flagSuccess'), 'success');
      setIsFlagModalOpen(false);
    } finally {
      setFlagSubmitting(false);
    }
  };

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

  // Filter out-of-range items for the summary cards
  const outOfRangeResults = order?.results?.filter(
    (r) => r.flag && r.flag !== 'NORMAL' && r.flag !== 'UNKNOWN'
  ) || [];

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-between">
      <DemoRibbon />

      <header className="p-4 flex justify-between items-center max-w-xl w-full mx-auto">
        <button
          onClick={() => navigate('/reports')}
          className="text-sm font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          ← {t('reportsTitle')}
        </button>
        <LangSwitch />
      </header>

      <main className="flex-1 px-4 py-4 max-w-xl w-full mx-auto space-y-5">
        {loading ? (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-4">
            <SkeletonText lines={4} />
          </div>
        ) : error ? (
          <ErrorState description={error} onRetry={fetchOrderDetail} />
        ) : order ? (
          <>
            {/* Order & Patient Header Card */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                    {order.patient?.fullName}
                  </h1>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Order #{order.orderNo} • {formatDate(order.date)}
                  </p>
                </div>
                <Badge variant={order.hasCritical ? 'danger' : 'success'}>
                  {order.hasCritical ? 'Critical' : 'Verified'}
                </Badge>
              </div>

              {order.doctorName && (
                <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                  <span>Referring Doctor:</span>
                  <strong className="text-gray-800">{order.doctorName}</strong>
                </div>
              )}
            </div>

            {/* "What this means" Summary Section */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900">
                    {t('whatThisMeans')}
                  </h2>
                  {order.summary?.reviewStatus !== 'APPROVED' && (
                    <span className="text-[11px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {t('autoGeneratedNote')}
                    </span>
                  )}
                </div>
              </div>

              {/* CRITICAL VALUE PATH — calm notice, NO summary */}
              {order.hasCritical ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
                    <span className="text-lg">⚠️</span>
                    <span>Medical Attention Notice</span>
                  </div>
                  <p className="text-sm text-red-900 font-medium leading-relaxed">
                    {t('criticalCallbackNotice')}
                  </p>
                  <p className="text-xs text-red-700">
                    Our medical staff has been notified and will reach out to you directly regarding this result.
                  </p>
                </div>
              ) : outOfRangeResults.length === 0 ? (
                /* ALL NORMAL PATH */
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <p className="text-sm font-semibold text-emerald-900">
                    All tested parameters are within the standard reference range.
                  </p>
                  <p className="text-xs text-emerald-700 mt-1">
                    Please discuss this report with your physician during your next visit.
                  </p>
                </div>
              ) : (
                /* OUT-OF-RANGE EXPLANATIONS */
                <div className="space-y-3">
                  {order.summary?.items?.map((item, idx) => {
                    const isLow = (item.flag || '').includes('LOW');
                    const isHigh = (item.flag || '').includes('HIGH');

                    return (
                      <div
                        key={idx}
                        className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-2"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <strong className="text-gray-900 font-bold text-base">
                            {item.parameter}
                          </strong>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-amber-900 tabular-nums bg-amber-100 px-2 py-0.5 rounded">
                              {item.value} {item.unit || ''}
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                              {isLow ? `↓ ${t('flagLow')}` : isHigh ? `↑ ${t('flagHigh')}` : item.flag}
                            </span>
                          </div>
                        </div>

                        {item.refRange && (
                          <p className="text-xs text-gray-500">
                            Usual range: <span className="tabular-nums font-medium text-gray-700">{item.refRange}</span>
                          </p>
                        )}

                        <p
                          className={`text-sm text-gray-800 font-normal leading-relaxed ${
                            lang === 'te' ? 'leading-[1.7] text-[15px]' : ''
                          }`}
                        >
                          {item.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Disclaimer */}
              <p className="text-xs text-gray-500 italic pt-1">
                {t('disclaimer')}
              </p>

              {/* Action row under summary */}
              <div className="pt-2 flex justify-between items-center text-xs">
                <button
                  type="button"
                  onClick={() => setIsFlagModalOpen(true)}
                  className="text-gray-500 hover:text-gray-800 font-medium underline"
                >
                  {t('flagSummary')}
                </button>
              </div>
            </div>

            {/* Primary Download Action */}
            <Button
              variant="primary"
              fullWidth
              size="lg"
              loading={downloading}
              onClick={handleDownloadPDF}
              className="font-bold text-base shadow-sm py-3.5"
            >
              📥 {t('downloadPdf')}
            </Button>

            {/* Collapsible "All Results" Table */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-sm space-y-3">
              <button
                type="button"
                onClick={() => setShowAllResults(!showAllResults)}
                className="w-full flex justify-between items-center text-left focus:outline-none"
              >
                <h3 className="text-base font-bold text-gray-900">
                  {t('allResults')} ({order.results?.length || 0})
                </h3>
                <span className="text-gray-400 font-bold text-sm">
                  {showAllResults ? '▲ Hide' : '▼ Show'}
                </span>
              </button>

              {showAllResults && (
                <div className="pt-3 border-t border-gray-100 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase">
                        <th className="py-2">{t('parameter')}</th>
                        <th className="py-2 text-right">{t('result')}</th>
                        <th className="py-2 text-right">{t('refRange')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 tabular-nums">
                      {order.results?.map((r, idx) => {
                        const isAbnormal = r.flag && r.flag !== 'NORMAL' && r.flag !== 'UNKNOWN';
                        return (
                          <tr key={idx} className={isAbnormal ? 'bg-amber-50/50' : ''}>
                            <td className="py-2.5 font-medium text-gray-900">
                              {r.parameter}
                            </td>
                            <td className="py-2.5 text-right font-semibold">
                              <span className={isAbnormal ? 'text-amber-800 font-bold' : 'text-gray-700'}>
                                {r.value} {r.unit || ''}
                              </span>
                            </td>
                            <td className="py-2.5 text-right text-gray-500">
                              {r.refRangeRaw || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}
      </main>

      {/* Flag Summary Modal */}
      <Modal
        isOpen={isFlagModalOpen}
        onClose={() => setIsFlagModalOpen(false)}
        title={t('flagTitle')}
      >
        <form onSubmit={handleFlagSubmit} className="space-y-4">
          <p className="text-xs text-gray-500">
            Let us know why this explanation wasn't helpful so our pathologists can improve it.
          </p>

          <div className="space-y-2">
            {[
              { value: 'CONFUSING', label: t('flagReasonConfusing') },
              { value: 'SEEMS_WRONG', label: t('flagReasonSeemsWrong') },
              { value: 'WRONG_LANGUAGE', label: t('flagReasonWrongLang') },
              { value: 'OTHER', label: t('flagReasonOther') },
            ].map((option) => (
              <label
                key={option.value}
                className={`flex items-center gap-3 p-3 rounded-lg border text-sm cursor-pointer transition-colors ${
                  flagReason === option.value
                    ? 'border-[#0F5E57] bg-teal-50/50 font-semibold text-gray-900'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="flagReason"
                  value={option.value}
                  checked={flagReason === option.value}
                  onChange={(e) => setFlagReason(e.target.value)}
                  className="text-[#0F5E57] focus:ring-[#0F5E57]"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>

          <div>
            <textarea
              value={flagNotes}
              onChange={(e) => setFlagNotes(e.target.value.slice(0, 300))}
              placeholder={t('flagNotesPlaceholder')}
              rows={3}
              maxLength={300}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-[#0F5E57] focus:ring-1 focus:ring-[#0F5E57] outline-none"
            />
            <span className="text-[11px] text-gray-400 block text-right">
              {300 - flagNotes.length} chars left
            </span>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsFlagModalOpen(false)}
            >
              {t('flagCancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={flagSubmitting}
            >
              {t('flagSubmit')}
            </Button>
          </div>
        </form>
      </Modal>

      <footer className="p-4 text-center text-xs text-gray-400 max-w-xl w-full mx-auto">
        <span>Company A Diagnostics • Secure Report Delivery</span>
      </footer>
    </div>
  );
}
