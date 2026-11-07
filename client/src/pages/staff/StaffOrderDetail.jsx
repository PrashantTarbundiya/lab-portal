import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import StatusChip from '../../components/StatusChip';
import MaskedPhone from '../../components/MaskedPhone';
import DemoRibbon from '../../components/DemoRibbon';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorState from '../../components/ErrorState';
import AskAIModal from '../../components/AskAIModal';
import SampleBarcodeModal from '../../components/SampleBarcodeModal';

export default function StaffOrderDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals & Action States
  const [isResendModalOpen, setIsResendModalOpen] = useState(false);
  const [resending, setResending] = useState(false);
  const [isCallbackModalOpen, setIsCallbackModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [callbackNote, setCallbackNote] = useState('');
  const [submittingCallback, setSubmittingCallback] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [isMessageDrawerOpen, setIsMessageDrawerOpen] = useState(false);

  const navigate = useNavigate();
  const { token } = useAuth();
  const { addToast } = useToast();

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api(`/orders/${id}`, { token });
      setData(res);
    } catch (err) {
      console.warn('Staff order fetch error, demo fallback:', err);
      // Demo fallback
      setData({
        order: {
          id: id || 'demo-1',
          orderNo: 'ORD-71233',
          patient: {
            fullName: 'Farzana Begum',
            sex: 'F',
            dob: '1990-01-20',
            account: { mobileE164: '+919000000003' },
          },
          doctor: { name: 'Dr. K. Suresh' },
          status: 'SIGNED',
          hasCritical: true,
          signedAt: '2026-11-01T11:40:00+05:30',
          createdAt: '2026-11-01T08:30:00+05:30',
          results: [
            { id: 'r1', parameter: 'Potassium', value: '6.8', unit: 'mmol/L', refRangeRaw: '3.5-5.1', flag: 'CRITICAL_HIGH' },
            { id: 'r2', parameter: 'Sodium', value: '138', unit: 'mmol/L', refRangeRaw: '136-145', flag: 'NORMAL' },
            { id: 'r3', parameter: 'Creatinine', value: '0.9', unit: 'mg/dL', refRangeRaw: '0.6-1.2', flag: 'NORMAL' },
          ],
          linkTokens: [
            { id: 'lt1', expiresAt: '2026-11-04T11:40:00+05:30', openCount: 0, revokedAt: null },
          ],
          callbackTasks: [
            {
              id: 'cb-1',
              type: 'CRITICAL_CALLBACK',
              parameter: 'Potassium',
              value: '6.8',
              reason: 'Critical high potassium (6.8 mmol/L, critical threshold: 6.5)',
              status: 'OPEN',
            },
          ],
        },
        messages: [
          {
            id: 'm1',
            channel: 'WHATSAPP',
            body: 'Company A Diagnostics: Your lab report is ready. View it securely here: https://... Link valid 72 hours.',
            status: 'QUEUED',
            createdAt: '2026-11-01T11:40:00+05:30',
          },
        ],
        patientPhoneMasked: '••••••0003',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleResendLink = async () => {
    try {
      setResending(true);
      await api(`/links/resend/${id}`, { method: 'POST', token });
      addToast('New expiring link created & message queued', 'success');
      setIsResendModalOpen(false);
      fetchOrder();
    } catch (err) {
      addToast(err.message || 'Failed to resend link', 'error');
    } finally {
      setResending(false);
    }
  };

  const handleResendSMS = async (messageId) => {
    try {
      await api(`/messages/${messageId}/resend-sms`, { method: 'POST', token });
      addToast('Fallback message queued via SMS', 'success');
      fetchOrder();
    } catch (err) {
      addToast(err.message || 'Failed to resend SMS', 'error');
    }
  };

  const handleCallbackDone = async (e) => {
    e.preventDefault();
    if (!activeTask) return;
    if (!callbackNote.trim()) {
      addToast('Please enter a note describing the callback', 'error');
      return;
    }

    try {
      setSubmittingCallback(true);
      await api(`/tasks/${activeTask.id}/done`, {
        method: 'PUT',
        body: { note: callbackNote },
        token,
      });

      addToast('Callback completed! Link has been released to patient.', 'success');
      setIsCallbackModalOpen(false);
      setCallbackNote('');
      fetchOrder();
    } catch (err) {
      addToast(err.message || 'Failed to complete task', 'error');
    } finally {
      setSubmittingCallback(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07151f] flex items-center justify-center text-white">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !data?.order) {
    return (
      <div className="min-h-screen bg-[#07151f] p-8 text-white">
        <ErrorState description={error || 'Order not found'} onRetry={fetchOrder} />
      </div>
    );
  }

  const { order, messages, patientPhoneMasked } = data;
  const openCallback = order.callbackTasks?.find((t) => t.status === 'OPEN');

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="min-h-screen bg-[#07151f] text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-emerald-400 selection:text-slate-950 font-sans">
      {/* Stitch Deep-Teal Atmospheric Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-36 left-1/4 w-[750px] h-[750px] bg-teal-500/10 rounded-full blur-[140px]"></div>
        <div className="absolute top-1/3 -right-40 w-[620px] h-[620px] bg-emerald-500/10 rounded-full blur-[160px]"></div>
        <div className="absolute -bottom-32 left-1/3 w-[850px] h-[850px] bg-slate-900/40 rounded-full blur-[180px]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(#4edea3_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.035]"></div>
      </div>

      <DemoRibbon />

      {/* Subheader / Breadcrumb */}
      <div className="bg-[#0c1a24]/80 backdrop-blur-xl border-b border-white/10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <button
            onClick={() => navigate('/staff')}
            className="text-xs sm:text-sm font-semibold text-emerald-300 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Orders Console</span>
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-teal-300 bg-white/10 px-2.5 py-1 rounded-lg border border-white/15 tabular-nums">
              Order: #{order.orderNo}
            </span>
            <StatusChip status={order.status} isHeld={!!openCallback} />
            <button
              type="button"
              onClick={() => setIsBarcodeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              title="Print Thermal Vacuum Tube Barcodes (ISO 15189)"
            >
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span>Tube Barcodes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Desktop Grid */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT 2 COLUMNS: Order Facts + Results Table */}
          <div className="lg:col-span-2 space-y-6">
            {/* Critical Alert Banner if open callback exists */}
            {openCallback && (
              <div className="bg-rose-950/40 border-2 border-rose-500/50 rounded-3xl p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 className="text-base font-bold text-rose-300 font-display">
                      Critical Result Callback Required
                    </h3>
                  </div>
                  <Badge variant="danger">HELD</Badge>
                </div>
                <p className="text-sm text-rose-200 leading-relaxed font-medium">
                  {openCallback.reason}
                </p>
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-rose-300/80">
                    Patient link is held until staff contacts the patient/doctor.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTask(openCallback);
                      setIsCallbackModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/30 transition cursor-pointer"
                  >
                    <span>Mark Callback Done</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Order Facts Card */}
            <div className="glass-card rounded-3xl border border-white/10 p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-bold text-white font-display">
                Order & Patient Information
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block font-sans">Patient Name</span>
                  <strong className="text-sm text-white font-semibold font-sans">{order.patient?.fullName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans">Mobile (Audited)</span>
                  <MaskedPhone
                    phoneMasked={patientPhoneMasked}
                    orderId={order.id}
                    canReveal={true}
                    className="text-sm font-semibold text-emerald-400"
                  />
                </div>
                <div>
                  <span className="text-slate-400 block font-sans">Signed At (IST)</span>
                  <strong className="text-sm text-white font-semibold">{formatDate(order.signedAt)}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block font-sans">Referring Doctor</span>
                  <strong className="text-sm text-teal-300 font-semibold font-sans">{order.doctor?.name || 'Self-referred'}</strong>
                </div>
              </div>
            </div>

            {/* Test Results Table with Flags */}
            <div className="glass-card rounded-3xl border border-white/10 p-6 shadow-xl space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-white font-display">
                  Diagnostic Test Results ({order.results?.length || 0})
                </h2>
                <a
                  href={`/api/orders/${order.id}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-400 hover:text-emerald-300 hover:underline font-semibold flex items-center gap-1 font-mono"
                >
                  <span>View Signed PDF</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#132330]/90 text-xs uppercase font-mono font-bold text-slate-300 border-b border-white/10">
                    <tr>
                      <th className="py-3 px-4">Parameter</th>
                      <th className="py-3 px-4 text-right">Result</th>
                      <th className="py-3 px-4">Unit</th>
                      <th className="py-3 px-4">Reference Range</th>
                      <th className="py-3 px-4 text-center">Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 tabular-nums font-mono text-xs">
                    {order.results?.map((r) => {
                      const isCritical = (r.flag || '').includes('CRITICAL');
                      const isAbnormal = r.flag === 'LOW' || r.flag === 'HIGH';

                      const rowBg = isCritical ? 'bg-rose-950/40 text-rose-200 font-semibold' :
                        isAbnormal ? 'bg-amber-950/40 text-amber-200' : 'text-slate-200 hover:bg-white/5 transition';

                      return (
                        <tr key={r.id} className={rowBg}>
                          <td className="py-3 px-4 text-white font-medium font-sans">{r.parameter}</td>
                          <td className="py-3 px-4 text-right font-bold">
                            <span className={isCritical ? 'text-rose-400 font-extrabold' : isAbnormal ? 'text-amber-300 font-bold' : 'text-white'}>
                              {r.value}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400 text-xs">{r.unit || '—'}</td>
                          <td className="py-3 px-4 text-slate-400 text-xs">{r.refRangeRaw || '—'}</td>
                          <td className="py-3 px-4 text-center">
                            {r.flag === 'NORMAL' ? (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-bold">
                                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Normal</span>
                              </span>
                            ) : (
                              <Badge variant={isCritical ? 'danger' : 'warning'} size="sm">
                                {r.flag}
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Delivery Timeline & Actions */}
          <div className="space-y-6">
            {/* Quick Actions Card */}
            <div className="glass-card rounded-3xl border border-white/10 p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white font-display">
                Delivery Controls
              </h3>

              <div className="space-y-2.5">
                {order.patient?.account?.mobileE164 && (
                  <a
                    href={`https://wa.me/${order.patient.account.mobileE164.replace('+', '')}?text=${encodeURIComponent(
                      `Hello ${order.patient?.fullName || 'Patient'}, your diagnostic test report (${order.orderNo}) from Company A Diagnostics is ready. You can securely view your digital report and download the hospital-grade PDF here: ${window.location.origin}/report/${order.linkTokens?.[0]?.token || ''}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#25D366] hover:bg-[#20ba59] shadow-sm transition"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c1.001.572 1.777.854 2.806.854 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.737-5.768-5.737zm3.374 8.163c-.145.407-.743.765-1.026.81-.274.043-.627.067-1.009-.054-.374-.118-.86-.277-1.488-.549-2.668-1.157-4.416-3.87-4.55-4.049-.133-.18-1.085-1.444-1.085-2.754 0-1.31.688-1.954.932-2.221.244-.268.533-.335.711-.335.178 0 .356.002.511.01.167.008.39-.063.61.467.225.542.766 1.869.833 2.005.067.135.111.294.022.473-.089.178-.133.29-.267.445-.133.156-.28.347-.399.467-.134.133-.274.28-.118.549.156.268.694 1.144 1.488 1.85 1.022.909 1.884 1.19 2.152 1.323.268.134.423.112.579-.068.156-.178.667-.778.845-1.045.178-.268.356-.223.6-.134.245.089 1.557.734 1.824.868.267.133.445.2.511.311.067.112.067.646-.078 1.053z" />
                    </svg>
                    <span>Send via WhatsApp (Free wa.me)</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setIsResendModalOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs transition shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Resend Link (Queue Message)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsMessageDrawerOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>View Outbox Message</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAIModalOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 font-bold text-xs border border-teal-500/30 transition cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  <span>Ask Labby AI (Custom Prompt)</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400 leading-tight">
                Resends revoke previous link tokens and generate a fresh 72-hour token. Rate limit: 3 resends / order / 24 hours.
              </p>
            </div>

            {/* Delivery Timeline Card */}
            <div className="glass-card rounded-3xl border border-white/10 p-6 shadow-xl space-y-4">
              <h3 className="text-base font-bold text-white font-display">
                Delivery Lifecycle
              </h3>

              <div className="relative pl-6 border-l-2 border-white/10 space-y-6 my-2 text-xs">
                {/* Event 1: Created */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#07151f]"></div>
                  <strong className="block text-white font-semibold text-sm">Order Created</strong>
                  <span className="text-slate-400 font-mono">{formatDate(order.createdAt)}</span>
                </div>

                {/* Event 2: Signed */}
                <div className="relative">
                  <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 border-[#07151f] ${
                    order.signedAt ? 'bg-emerald-400' : 'bg-slate-600'
                  }`}></div>
                  <strong className="block text-white font-semibold text-sm">Pathologist Signed</strong>
                  <span className="text-slate-400 font-mono">{formatDate(order.signedAt)}</span>
                </div>

                {/* Event 3: Message Sent */}
                {messages && messages.length > 0 && (
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#07151f]"></div>
                    <div className="flex items-center justify-between">
                      <strong className="text-white font-semibold text-sm">
                        {messages[0].channel} Notification
                      </strong>
                      <Badge variant={messages[0].status === 'FAILED' ? 'danger' : 'success'} size="sm">
                        {messages[0].status}
                      </Badge>
                    </div>
                    <span className="text-slate-400 block font-mono">{formatDate(messages[0].createdAt)}</span>

                    {messages[0].status === 'FAILED' && (
                      <button
                        onClick={() => handleResendSMS(messages[0].id)}
                        className="mt-2 text-xs text-sky-400 hover:underline font-bold cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>Send SMS Fallback</span>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}
                  </div>
                )}

                {/* Event 4: Opened */}
                <div className="relative">
                  {order.linkTokens?.[0]?.firstOpenedAt ? (
                    <>
                      <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#07151f]"></div>
                      <strong className="block text-white font-semibold text-sm">Opened by Patient</strong>
                      <span className="text-slate-400 font-mono">{formatDate(order.linkTokens[0].firstOpenedAt)}</span>
                    </>
                  ) : (
                    <>
                      <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-slate-600 border-2 border-[#07151f]"></div>
                      <strong className="block text-slate-400 font-semibold text-sm">Pending Patient Access</strong>
                      <span className="text-slate-500">Not opened yet</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Resend Confirm Dialog */}
      <Modal
        isOpen={isResendModalOpen}
        onClose={() => setIsResendModalOpen(false)}
        title="Confirm Link Resend"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-200 leading-relaxed">
            Are you sure you want to resend the report link to <strong className="text-white font-mono">{patientPhoneMasked}</strong>?
          </p>
          <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-xl text-xs text-amber-200 flex items-start gap-2">
            <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>This will revoke any previously issued link tokens for this order and send a new link valid for 72 hours.</span>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsResendModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={resending}
              onClick={handleResendLink}
            >
              Confirm Resend
            </Button>
          </div>
        </div>
      </Modal>

      {/* Mark Callback Done Modal */}
      <Modal
        isOpen={isCallbackModalOpen}
        onClose={() => setIsCallbackModalOpen(false)}
        title="Complete Critical Callback"
      >
        <form onSubmit={handleCallbackDone} className="space-y-4">
          <p className="text-xs text-gray-600">
            Document your conversation with the patient or referring doctor before releasing the digital report.
          </p>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Callback Clinical Note <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={callbackNote}
              onChange={(e) => setCallbackNote(e.target.value)}
              placeholder="e.g. Spoke to patient at 11:55 AM. Informed about high potassium (6.8 mmol/L). Advised to report to emergency at Government General Hospital immediately..."
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-[#0F5E57] outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsCallbackModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              loading={submittingCallback}
            >
              Submit & Release Report
            </Button>
          </div>
        </form>
      </Modal>

      {/* Message Outbox Drawer Modal */}
      <Modal
        isOpen={isMessageDrawerOpen}
        onClose={() => setIsMessageDrawerOpen(false)}
        title="Message Outbox (WhatsApp Simulation)"
      >
        <div className="space-y-4 max-h-[450px] overflow-y-auto p-1">
          {messages?.map((m) => (
            <div key={m.id} className="p-4 glass-card bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-2 text-white">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-emerald-300 font-mono">{m.channel} Message</span>
                <Badge variant={m.status === 'FAILED' ? 'danger' : 'success'} size="sm">
                  {m.status}
                </Badge>
              </div>
              <p className="text-xs text-white whitespace-pre-line font-mono bg-white/5 p-3 rounded-xl border border-white/10">
                {m.body}
              </p>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>Created: {formatDate(m.createdAt)}</span>
                {m.failureReason && <span className="text-rose-400 font-semibold">{m.failureReason}</span>}
              </div>
            </div>
          ))}
        </div>
      </Modal>
      {/* Ask AI Assistant Modal for Staff */}
      {order && (
        <AskAIModal
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          orderId={order.id}
          orderNo={order.orderNo}
          patientName={order.patient?.fullName}
          results={order.results || []}
        />
      )}

      {/* Specimen Barcode Label Generator Modal */}
      {order && (
        <SampleBarcodeModal
          isOpen={isBarcodeModalOpen}
          onClose={() => setIsBarcodeModalOpen(false)}
          order={order}
        />
      )}
    </div>
  );
}

