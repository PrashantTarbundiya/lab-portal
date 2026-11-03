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
import StaffNavbar from '../../components/StaffNavbar';

export default function StaffOrderDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals & Action States
  const [isResendModalOpen, setIsResendModalOpen] = useState(false);
  const [resending, setResending] = useState(false);
  const [isCallbackModalOpen, setIsCallbackModalOpen] = useState(false);
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
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !data?.order) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] p-8">
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
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col">
      <DemoRibbon />
      <StaffNavbar />

      {/* Subheader / Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <button
            onClick={() => navigate('/staff')}
            className="text-sm font-semibold text-gray-600 hover:text-[#0F5E57] flex items-center gap-1.5 transition"
          >
            ← Back to Orders Console
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-gray-500">
              Order: #{order.orderNo}
            </span>
            <StatusChip status={order.status} isHeld={!!openCallback} />
          </div>
        </div>
      </div>

      {/* Main 2-Column Desktop Grid */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT 2 COLUMNS: Order Facts + Results Table */}
          <div className="lg:col-span-2 space-y-6">
            {/* Critical Alert Banner if open callback exists */}
            {openCallback && (
              <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🚨</span>
                    <h3 className="text-base font-bold text-red-900">
                      Critical Result Callback Required
                    </h3>
                  </div>
                  <Badge variant="danger">HELD</Badge>
                </div>
                <p className="text-sm text-red-800 leading-relaxed font-medium">
                  {openCallback.reason}
                </p>
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-red-700">
                    Patient link is held until staff contacts the patient/doctor.
                  </span>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      setActiveTask(openCallback);
                      setIsCallbackModalOpen(true);
                    }}
                    className="font-bold shadow-sm"
                  >
                    Mark Callback Done →
                  </Button>
                </div>
              </div>
            )}

            {/* Order Facts Card */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-gray-900">
                Order & Patient Information
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-gray-500 block">Patient Name</span>
                  <strong className="text-sm text-gray-900 font-semibold">{order.patient?.fullName}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Mobile (Audited)</span>
                  <MaskedPhone
                    phoneMasked={patientPhoneMasked}
                    orderId={order.id}
                    canReveal={true}
                    className="text-sm font-semibold"
                  />
                </div>
                <div>
                  <span className="text-gray-500 block">Signed At (IST)</span>
                  <strong className="text-sm text-gray-900 font-semibold">{formatDate(order.signedAt)}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Referring Doctor</span>
                  <strong className="text-sm text-gray-900 font-semibold">{order.doctor?.name || 'Self-referred'}</strong>
                </div>
              </div>
            </div>

            {/* Test Results Table with Flags */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900">
                  Diagnostic Test Results ({order.results?.length || 0})
                </h2>
                <a
                  href={`/api/orders/${order.id}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#0F5E57] hover:underline font-semibold flex items-center gap-1"
                >
                  View Signed PDF ↗
                </a>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F7F8FA] text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4">Parameter</th>
                      <th className="py-3 px-4 text-right">Result</th>
                      <th className="py-3 px-4">Unit</th>
                      <th className="py-3 px-4">Reference Range</th>
                      <th className="py-3 px-4 text-center">Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 tabular-nums">
                    {order.results?.map((r) => {
                      const isCritical = (r.flag || '').includes('CRITICAL');
                      const isAbnormal = r.flag === 'LOW' || r.flag === 'HIGH';

                      const rowBg = isCritical ? 'bg-red-50/70 font-semibold' :
                        isAbnormal ? 'bg-amber-50/50' : '';

                      return (
                        <tr key={r.id} className={rowBg}>
                          <td className="py-3 px-4 text-gray-900 font-medium">{r.parameter}</td>
                          <td className="py-3 px-4 text-right font-bold">
                            <span className={isCritical ? 'text-red-700' : isAbnormal ? 'text-amber-800' : 'text-gray-800'}>
                              {r.value}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-500 text-xs">{r.unit || '—'}</td>
                          <td className="py-3 px-4 text-gray-600 text-xs">{r.refRangeRaw || '—'}</td>
                          <td className="py-3 px-4 text-center">
                            {r.flag === 'NORMAL' ? (
                              <span className="text-xs text-gray-400">Normal</span>
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
            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900">
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
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-[#25D366] hover:bg-[#20ba59] shadow-sm transition"
                  >
                    <span>📱</span> Send via WhatsApp (Free wa.me)
                  </a>
                )}

                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => setIsResendModalOpen(true)}
                  className="font-semibold text-sm"
                >
                  🔄 Resend Link (Queue Message)
                </Button>

                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setIsMessageDrawerOpen(true)}
                  className="font-semibold text-sm"
                >
                  💬 View Outbox Message
                </Button>
              </div>

              <p className="text-[11px] text-gray-400 leading-tight">
                Resends revoke previous link tokens and generate a fresh 72-hour token. Rate limit: 3 resends / order / 24 hours.
              </p>
            </div>

            {/* Delivery Timeline Card */}
            <div className="bg-white rounded-2xl border border-gray-200/90 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-900">
                Delivery Lifecycle
              </h3>

              <div className="relative pl-6 border-l-2 border-gray-200 space-y-6 my-2 text-xs">
                {/* Event 1: Created */}
                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white"></div>
                  <strong className="block text-gray-900 font-semibold text-sm">Order Created</strong>
                  <span className="text-gray-500">{formatDate(order.createdAt)}</span>
                </div>

                {/* Event 2: Signed */}
                <div className="relative">
                  <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 border-white ${
                    order.signedAt ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}></div>
                  <strong className="block text-gray-900 font-semibold text-sm">Pathologist Signed</strong>
                  <span className="text-gray-500">{formatDate(order.signedAt)}</span>
                </div>

                {/* Event 3: Message Sent */}
                {messages && messages.length > 0 && (
                  <div className="relative">
                    <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white"></div>
                    <div className="flex items-center justify-between">
                      <strong className="text-gray-900 font-semibold text-sm">
                        {messages[0].channel} Notification
                      </strong>
                      <Badge variant={messages[0].status === 'FAILED' ? 'danger' : 'success'} size="sm">
                        {messages[0].status}
                      </Badge>
                    </div>
                    <span className="text-gray-500 block">{formatDate(messages[0].createdAt)}</span>

                    {messages[0].status === 'FAILED' && (
                      <button
                        onClick={() => handleResendSMS(messages[0].id)}
                        className="mt-2 text-xs text-blue-600 hover:underline font-bold"
                      >
                        Send SMS Fallback →
                      </button>
                    )}
                  </div>
                )}

                {/* Event 4: Opened */}
                <div className="relative">
                  {order.linkTokens?.[0]?.firstOpenedAt ? (
                    <>
                      <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white"></div>
                      <strong className="block text-gray-900 font-semibold text-sm">Opened by Patient</strong>
                      <span className="text-gray-500">{formatDate(order.linkTokens[0].firstOpenedAt)}</span>
                    </>
                  ) : (
                    <>
                      <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-gray-300 border-2 border-white"></div>
                      <strong className="block text-gray-400 font-medium text-sm">Not yet opened</strong>
                      <span className="text-gray-400">Awaiting patient OTP verification</span>
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
          <p className="text-sm text-gray-600 leading-relaxed">
            Are you sure you want to resend the report link to <strong className="text-gray-900 font-mono">{patientPhoneMasked}</strong>?
          </p>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            ⚠️ This will revoke any previously issued link tokens for this order and send a new link valid for 72 hours.
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
            <div key={m.id} className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-emerald-900">{m.channel} Message</span>
                <Badge variant={m.status === 'FAILED' ? 'danger' : 'success'} size="sm">
                  {m.status}
                </Badge>
              </div>
              <p className="text-xs text-gray-800 whitespace-pre-line font-mono bg-white p-3 rounded-xl border border-emerald-100">
                {m.body}
              </p>
              <div className="flex justify-between text-[11px] text-gray-400">
                <span>Created: {formatDate(m.createdAt)}</span>
                {m.failureReason && <span className="text-red-600 font-semibold">{m.failureReason}</span>}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}

