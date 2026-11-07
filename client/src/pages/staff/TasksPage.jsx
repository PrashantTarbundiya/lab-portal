import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import DemoRibbon from '../../components/DemoRibbon';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState('CRITICAL_CALLBACK'); // CRITICAL_CALLBACK | WRONG_NUMBER | MOBILE_CHANGE | CONSENT_WITHDRAWAL | FLAGS | PATHOLOGIST_SAMPLE
  const [tasks, setTasks] = useState([]);
  const [flags, setFlags] = useState([]);
  const [sampleSummaries, setSampleSummaries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mark callback modal
  const [isDoneModalOpen, setIsDoneModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { token, logout, user } = useAuth();
  const { addToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'FLAGS') {
        const res = await api('/summaries/flags', { token });
        setFlags(res.flags || []);
      } else if (activeTab === 'PATHOLOGIST_SAMPLE') {
        const res = await api('/summaries/sample', { token });
        setSampleSummaries(res.summaries || []);
      } else {
        const res = await api(`/tasks?type=${activeTab}`, { token });
        setTasks(res.tasks || []);
      }
    } catch (err) {
      console.warn('Task fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleMarkDone = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    try {
      setSubmitting(true);
      await api(`/tasks/${selectedTask.id}/done`, {
        method: 'PUT',
        body: { note },
        token,
      });

      addToast('Task completed successfully', 'success');
      setIsDoneModalOpen(false);
      setNote('');
      fetchData();
    } catch (err) {
      addToast(err.message || 'Failed to update task', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveSummary = async (summaryId) => {
    try {
      await api(`/summaries/${summaryId}/review`, {
        method: 'PUT',
        body: { status: 'APPROVED' },
        token,
      });
      addToast('Summary approved by pathologist', 'success');
      fetchData();
    } catch (err) {
      addToast(err.message || 'Approval failed', 'error');
    }
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

  const tabs = [
    {
      id: 'CRITICAL_CALLBACK',
      label: 'Critical Callbacks',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      id: 'WRONG_NUMBER',
      label: 'Wrong Number Reports',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'MOBILE_CHANGE',
      label: 'Mobile Changes',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: 'CONSENT_WITHDRAWAL',
      label: 'Consent Erasure',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
    {
      id: 'FLAGS',
      label: 'Patient Flagged Summaries',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
      ),
    },
    {
      id: 'PATHOLOGIST_SAMPLE',
      label: 'Pathologist Weekly 50',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#07151f] text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-emerald-400 selection:text-slate-950 font-sans">
      <DemoRibbon />

      {/* Atmospheric Ambience Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-36 left-1/4 w-[750px] h-[750px] bg-teal-500/10 rounded-full blur-[140px]"></div>
        <div className="absolute top-1/3 -right-40 w-[620px] h-[620px] bg-emerald-500/10 rounded-full blur-[160px]"></div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 flex-1 relative z-10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
            Clinical Tasks, Wrong Numbers & Quality Assurance
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Resolve held critical calls, audit wrong number reports, and conduct weekly pathologist reviews.
          </p>
        </div>

        {/* Tab Strip */}
        <div className="bg-[#0c1c28]/90 p-1.5 rounded-2xl border border-white/10 flex overflow-x-auto gap-1.5 no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : activeTab === 'FLAGS' ? (
          /* Flagged Summaries View */
          <div className="space-y-3">
            {flags.length === 0 ? (
              <p className="text-center py-12 text-sm text-slate-400">No open summary flags.</p>
            ) : (
              flags.map((f) => (
                <div key={f.id} className="bg-[#0c1c28]/90 p-5 rounded-2xl border border-white/10 space-y-2 text-white">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <span className="text-xs font-mono font-bold text-emerald-400">Order #{f.summary?.order?.orderNo}</span>
                      <h3 className="text-base font-display font-bold text-white mt-0.5">
                        Reason: {f.reason}
                      </h3>
                      {f.freeText && (
                        <p className="text-sm text-slate-300 bg-white/5 border border-white/10 p-3 rounded-xl mt-2 italic">
                          "{f.freeText}"
                        </p>
                      )}
                    </div>
                    <Badge variant={f.status === 'OPEN' ? 'warning' : 'default'} size="sm">
                      {f.status}
                    </Badge>
                  </div>
                  <div className="text-xs font-mono text-slate-400 pt-2 border-t border-white/10">
                    Flagged by patient on {formatDate(f.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === 'PATHOLOGIST_SAMPLE' ? (
          /* Pathologist Weekly 50 Sample Review View */
          <div className="space-y-3">
            <div className="p-4 bg-[#0c1c28]/90 border border-teal-500/30 rounded-2xl text-xs text-teal-200 font-medium flex items-center gap-2.5">
              <svg className="w-4 h-4 text-teal-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <strong className="text-white">Weekly Pathologist Review (50 Random Summaries):</strong> Review auto-generated explanations and approve or modify before archiving.
              </div>
            </div>

            {sampleSummaries.length === 0 ? (
              <p className="text-center py-12 text-sm text-slate-400">No summaries generated in the past 7 days.</p>
            ) : (
              sampleSummaries.map((s) => (
                <div key={s.id} className="bg-[#0c1c28]/90 p-5 rounded-2xl border border-white/10 space-y-3 text-white">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <span className="text-xs font-mono text-emerald-400">Order #{s.order?.orderNo} • Language: {s.lang.toUpperCase()}</span>
                      <h4 className="text-sm font-display font-bold text-white mt-0.5">
                        Patient: {s.order?.patient?.fullName}
                      </h4>
                    </div>
                    <Badge variant={s.reviewStatus === 'APPROVED' ? 'success' : 'default'} size="sm">
                      {s.reviewStatus}
                    </Badge>
                  </div>

                  <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-200 leading-relaxed font-mono">
                    {s.body}
                  </div>

                  <div className="flex justify-between items-center text-xs text-slate-400 pt-1 border-t border-white/10">
                    <span className="font-mono">Source: {s.source}</span>
                    {s.reviewStatus !== 'APPROVED' && (
                      <button
                        type="button"
                        onClick={() => handleApproveSummary(s.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-sm"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Pathologist Approve</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Callback Tasks List */
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-center py-12 text-sm text-slate-400">No open tasks in this category.</p>
            ) : (
              tasks.map((task) => (
                <div key={task.id} className="bg-[#0c1c28]/90 p-5 rounded-2xl border border-white/10 space-y-3 text-white">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-emerald-400">
                          {task.order ? `Order #${task.order.orderNo}` : 'Account Task'}
                        </span>
                        <Badge variant={task.status === 'OPEN' ? 'danger' : 'default'} size="sm">
                          {task.status}
                        </Badge>
                      </div>
                      <h3 className="text-base font-display font-bold text-white mt-1">
                        {task.reason}
                      </h3>
                      {task.order?.patient?.fullName && (
                        <p className="text-xs text-slate-300 mt-0.5">
                          Patient: <strong className="text-white">{task.order.patient.fullName}</strong>
                        </p>
                      )}
                    </div>

                    {task.status === 'OPEN' && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTask(task);
                          setIsDoneModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-all cursor-pointer shadow-sm active:scale-95"
                      >
                        <span>Resolve</span>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {task.note && (
                    <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-200 font-mono">
                      <strong className="text-emerald-300">Resolution Note:</strong> {task.note}
                    </div>
                  )}

                  <div className="text-[11px] font-mono text-slate-400 pt-1 border-t border-white/10 flex justify-between">
                    <span>Created: {formatDate(task.createdAt)}</span>
                    {task.doneBy && <span>Resolved by: {task.doneBy.name}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* Task Complete Modal */}
      <Modal
        isOpen={isDoneModalOpen}
        onClose={() => setIsDoneModalOpen(false)}
        title="Resolve Staff Task"
      >
        <form onSubmit={handleMarkDone} className="space-y-4">
          <p className="text-xs text-slate-300">
            {selectedTask?.reason}
          </p>
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 mb-1">
              Resolution Note / Pathologist Action <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Verified with patient by phone, confirmed number correction / callback completed..."
              className="w-full rounded-xl border border-white/15 p-3 text-sm bg-white/5 text-white focus:outline-none focus:border-emerald-400 outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setIsDoneModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={submitting}>
              Confirm Resolved
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
