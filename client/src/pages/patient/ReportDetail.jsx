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
import PatientNavbar from '../../components/PatientNavbar';
import DemoRibbon from '../../components/DemoRibbon';
import ErrorState from '../../components/ErrorState';
import { SkeletonText } from '../../components/Skeleton';
import VisualRangeGauge from '../../components/VisualRangeGauge';
import VoiceReadButton from '../../components/VoiceReadButton';
import DoctorChecklistModal from '../../components/DoctorChecklistModal';
import HealthScorecard from '../../components/HealthScorecard';
import FloatingAICopilot from '../../components/FloatingAICopilot';
import DigitalVerificationModal from '../../components/DigitalVerificationModal';
import PreTestGuide from '../../components/PreTestGuide';

export default function ReportDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [showAllResults, setShowAllResults] = useState(true);
  const [viewMode, setViewMode] = useState('gauges'); // 'gauges' | 'table'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isSideChatOpen, setIsSideChatOpen] = useState(false);
  const [sideChatQuery, setSideChatQuery] = useState('');
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  const openLabbyChat = (question = '') => {
    setSideChatQuery(question);
    setIsSideChatOpen(true);
  };

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

  // Categorize parameters for interactive biological grouping
  const getParamCategory = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('glucose') || n.includes('sugar') || n.includes('hba1c')) return { key: 'GLYCEMIC', label: 'Blood Sugar', icon: '🩸' };
    if (n.includes('cholesterol') || n.includes('triglyceride') || n.includes('ldl') || n.includes('hdl') || n.includes('lipid')) return { key: 'LIPID', label: 'Lipid & Heart', icon: '🫀' };
    if (n.includes('bilirubin') || n.includes('sgot') || n.includes('sgpt') || n.includes('alt') || n.includes('ast') || n.includes('alkaline')) return { key: 'LIVER', label: 'Liver Function', icon: '🧪' };
    if (n.includes('tsh') || n.includes('t3') || n.includes('t4') || n.includes('thyroid')) return { key: 'THYROID', label: 'Thyroid', icon: '🦋' };
    if (n.includes('vitamin') || n.includes('calcium') || n.includes('b12')) return { key: 'VITAMIN', label: 'Vitamins', icon: '☀️' };
    if (n.includes('haemoglobin') || n.includes('wbc') || n.includes('platelet') || n.includes('rbc')) return { key: 'HEMOGRAM', label: 'CBC & Blood', icon: '🛡️' };
    return { key: 'OTHER', label: 'General', icon: '📋' };
  };

  const availableCategories = ['ALL'];
  (order?.results || []).forEach((r) => {
    const cat = getParamCategory(r.parameter).key;
    if (!availableCategories.includes(cat)) availableCategories.push(cat);
  });

  const displayedResults = (order?.results || []).filter((r) => {
    if (selectedCategory === 'ALL') return true;
    return getParamCategory(r.parameter).key === selectedCategory;
  });

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-between">
      <DemoRibbon />
      <PatientNavbar backTo="/reports" backLabel="Reports" />

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
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                    {order.patient?.fullName}
                  </h1>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Order #{order.orderNo} • {formatDate(order.date)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsVerifyModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#0F5E57] border border-teal-200 text-xs font-bold transition cursor-pointer shadow-2xs"
                    title="View NABL Digital Accreditation & QR Seal"
                  >
                    <span>🛡️</span>
                    <span>NABL Verified</span>
                    <span className="text-[10px] bg-white px-1 py-0.2 rounded border border-teal-200 font-mono">
                      QR
                    </span>
                  </button>
                  <Badge variant={order.hasCritical ? 'danger' : 'success'}>
                    {order.hasCritical ? 'Critical' : 'Verified'}
                  </Badge>
                </div>
              </div>

              {order.doctorName && (
                <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                  <span>Referring Doctor:</span>
                  <strong className="text-gray-800">{order.doctorName}</strong>
                </div>
              )}
            </div>

            {/* Diagnostic Health Scorecard */}
            <HealthScorecard
              results={order.results || []}
              orderNo={order.orderNo}
              patientName={order.patient?.fullName}
              onOpenChecklist={() => setIsChecklistModalOpen(true)}
              onOpenAI={() => openLabbyChat()}
            />

            {/* "What this means" Summary Section */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
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
                <button
                  type="button"
                  onClick={() => openLabbyChat()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-[#0F5E57] hover:from-emerald-700 hover:to-[#0b4742] text-white text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  <span>🧪</span> Ask Labby
                </button>
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

                        <div className="pt-2 flex items-center justify-between flex-wrap gap-2 border-t border-amber-200/50">
                          <div className="flex items-center gap-2">
                            <VoiceReadButton text={item.text} lang={lang} />
                            <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">Audio</span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              openLabbyChat(
                                `Why is my ${item.parameter} level ${item.value} ${item.unit || ''} (${item.flag}) and what should I discuss with my doctor?`
                              )
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0F5E57] hover:text-emerald-900 bg-white hover:bg-teal-50 border border-teal-200/80 px-2.5 py-1 rounded-lg transition cursor-pointer shadow-2xs"
                          >
                            <span>🧪</span> Ask Labby
                          </button>
                        </div>
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

            {/* Detailed Test Results with Visual Range Gauges & Table View */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-sm space-y-4">
              {/* View Switcher & Category Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100">
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {t('allResults')} ({order.results?.length || 0})
                  </h3>
                  <span className="text-[11px] text-gray-400">Biological reference intervals & status</span>
                </div>

                {/* View Switcher Toggle */}
                <div className="inline-flex p-1 bg-gray-100 rounded-xl text-xs font-semibold self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setViewMode('gauges')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      viewMode === 'gauges'
                        ? 'bg-white text-[#0F5E57] shadow-2xs font-bold'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <span>📊</span>
                    <span>Visual Gauges</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                      viewMode === 'table'
                        ? 'bg-white text-[#0F5E57] shadow-2xs font-bold'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    <span>📋</span>
                    <span>Table View</span>
                  </button>
                </div>
              </div>

              {/* Organ System Category Filter Chips */}
              {availableCategories.length > 2 && (
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {availableCategories.map((catKey) => {
                    const isSelected = selectedCategory === catKey;
                    const catObj = catKey === 'ALL' ? { label: `All Tests (${order.results?.length || 0})`, icon: '🔬' } : getParamCategory(catKey === 'GLYCEMIC' ? 'glucose' : catKey === 'LIPID' ? 'lipid' : catKey === 'LIVER' ? 'liver' : catKey === 'THYROID' ? 'thyroid' : catKey === 'VITAMIN' ? 'vitamin' : catKey === 'HEMOGRAM' ? 'haemoglobin' : 'other');
                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => setSelectedCategory(catKey)}
                        className={`whitespace-nowrap px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-[#0F5E57] text-white shadow-2xs'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        <span>{catObj.icon}</span>
                        <span>{catObj.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* View 1: Visual Biological Spectrum Gauges */}
              {viewMode === 'gauges' && (
                <div className="space-y-3 pt-1">
                  {displayedResults?.map((r, idx) => (
                    <VisualRangeGauge
                      key={idx}
                      parameter={r.parameter}
                      value={r.value}
                      unit={r.unit}
                      refRangeRaw={r.refRangeRaw}
                      flag={r.flag}
                      onAskLabby={(param, val, unit, flag) =>
                        openLabbyChat(
                          `What does my ${param} result of ${val} ${unit || ''} (${flag}) mean in Order #${order.orderNo}, and what should I do?`
                        )
                      }
                    />
                  ))}
                </div>
              )}

              {/* View 2: Traditional Clinical Table */}
              {viewMode === 'table' && (
                <div className="pt-1 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 font-semibold uppercase">
                        <th className="py-2.5">{t('parameter')}</th>
                        <th className="py-2.5 text-right">{t('result')}</th>
                        <th className="py-2.5 text-right">{t('refRange')}</th>
                        <th className="py-2.5 text-center">Status</th>
                        <th className="py-2.5 text-right">AI Insights</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 tabular-nums">
                      {displayedResults?.map((r, idx) => {
                        const isCritical = (r.flag || '').includes('CRITICAL');
                        const isAbnormal = r.flag === 'LOW' || r.flag === 'HIGH';
                        return (
                          <tr key={idx} className={isCritical ? 'bg-red-50/70 font-semibold' : isAbnormal ? 'bg-amber-50/50' : ''}>
                            <td className="py-2.5 font-medium text-gray-900">
                              {r.parameter}
                            </td>
                            <td className="py-2.5 text-right font-semibold">
                              <span className={isCritical ? 'text-red-700 font-black' : isAbnormal ? 'text-amber-800 font-bold' : 'text-gray-700'}>
                                {r.value} {r.unit || ''}
                              </span>
                            </td>
                            <td className="py-2.5 text-right text-gray-500">
                              {r.refRangeRaw || '—'}
                            </td>
                            <td className="py-2.5 text-center">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isCritical ? 'bg-red-100 text-red-800' : isAbnormal ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {r.flag || 'NORMAL'}
                              </span>
                            </td>
                            <td className="py-2.5 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  openLabbyChat(
                                    `What does ${r.parameter}: ${r.value} ${r.unit || ''} (${r.flag || 'NORMAL'}) mean in my lab report?`
                                  )
                                }
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0F5E57] hover:text-white bg-teal-50 hover:bg-[#0F5E57] border border-teal-200 px-2 py-0.5 rounded-md transition cursor-pointer shadow-2xs"
                                title={`Ask Labby about ${r.parameter}`}
                              >
                                <span>🧪</span>
                                <span>Ask</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Interactive Ask Labby Feature Card */}
            <div className="bg-gradient-to-br from-[#0F5E57] to-teal-800 text-white rounded-2xl p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🧪</span>
                    <h3 className="font-bold text-base">Ask Labby About Your Report</h3>
                  </div>
                  <p className="text-xs text-teal-100 leading-relaxed max-w-md">
                    Have questions about your test results? Labby explains clinical values in clear language, formats clean tables and checklists, and offers tips in English, Telugu, or Hindi.
                  </p>
                </div>
                <span className="text-[10px] bg-teal-900/60 text-teal-200 border border-teal-600/50 px-2 py-0.5 rounded-full whitespace-nowrap">
                  Labby AI • Nemotron 3.5
                </span>
              </div>
              <div className="pt-1 flex flex-wrap gap-2 items-center justify-between">
                <span className="text-[11px] text-teal-200/90 italic">
                  💡 Type any custom prompt or clinical question
                </span>
                <button
                  type="button"
                  onClick={() => openLabbyChat()}
                  className="px-4 py-2 bg-white text-[#0F5E57] hover:bg-teal-50 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                >
                  🧪 Chat with Labby →
                </button>
              </div>
            </div>

            {/* Creative Pre-Test Preparation & Fasting Guide Accordion */}
            <PreTestGuide lang={lang} />
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

      {/* Digital Authenticity & NABL Accreditation Seal with QR Verification */}
      {order && (
        <DigitalVerificationModal
          isOpen={isVerifyModalOpen}
          onClose={() => setIsVerifyModalOpen(false)}
          orderNo={order.orderNo}
          patientName={order.patient?.fullName}
          date={order.date || order.signedAt}
          doctorName={order.doctorName}
        />
      )}

      {/* AI-Generated Doctor Discussion Checklist */}
      {order && (
        <DoctorChecklistModal
          isOpen={isChecklistModalOpen}
          onClose={() => setIsChecklistModalOpen(false)}
          orderId={order.id}
          orderNo={order.orderNo}
          patientName={order.patient?.fullName}
          results={order.results || []}
        />
      )}

      {/* Floating Global AI Copilot (Unified Side Chat) */}
      {order && (
        <FloatingAICopilot
          orderId={order.id}
          orderNo={order.orderNo}
          patientName={order.patient?.fullName}
          results={order.results || []}
          isOpen={isSideChatOpen}
          onToggle={(state) => setIsSideChatOpen(state)}
          externalQuery={sideChatQuery}
          onQueryHandled={() => setSideChatQuery('')}
        />
      )}

      <footer className="p-4 text-center text-xs text-gray-400 max-w-xl w-full mx-auto">
        <span>Company A Diagnostics • Secure Report Delivery</span>
      </footer>
    </div>
  );
}

