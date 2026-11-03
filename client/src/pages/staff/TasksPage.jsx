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
  const [activeTab, setActiveTab] = useState('CALLBACKS'); // CALLBACKS | WRONG_NUMBER | MOBILE_CHANGE | CONSENT_WITHDRAWAL | FLAGS | PATHOLOGIST_SAMPLE
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

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col">
      <DemoRibbon />

      {/* Staff Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0F5E57] flex items-center justify-center text-white font-bold text-sm">
                  A
                </div>
                <span className="font-bold text-gray-900 text-base">Lab Console</span>
              </div>

              <nav className="hidden md:flex space-x-1">
                <Link to="/staff" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                  Orders
                </Link>
                <Link to="/staff/import" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                  LIS Import
                </Link>
                <Link to="/staff/tasks" className="px-3 py-2 rounded-lg text-sm font-semibold bg-[#0F5E57]/10 text-[#0F5E57]">
                  Tasks & Flags
                </Link>
                <Link to="/staff/access-log" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                  Access Log
                </Link>
                <Link to="/staff/operations" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                  Operations Report
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 hidden sm:inline">{user?.email}</span>
              <button onClick={() => { logout(); }} className="text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5">
                Log out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 flex-1">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Clinical Tasks, Wrong Numbers & Quality Assurance
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Resolve held critical calls, audit wrong number reports, and conduct weekly pathologist reviews.
          </p>
        </div>

        {/* Tab Strip */}
        <div className="flex overflow-x-auto gap-2 border-b border-gray-200 pb-2">
          {[
            { id: 'CRITICAL_CALLBACK', label: 'Critical Callbacks' },
            { id: 'WRONG_NUMBER', label: 'Wrong Number Reports' },
            { id: 'MOBILE_CHANGE', label: 'Mobile Changes' },
            { id: 'CONSENT_WITHDRAWAL', label: 'Consent Erasure' },
            { id: 'FLAGS', label: 'Patient Flagged Summaries' },
            { id: 'PATHOLOGIST_SAMPLE', label: 'Pathologist Weekly 50' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-[#0F5E57] text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : activeTab === 'FLAGS' ? (
          /* Flagged Summaries View */
          <div className="space-y-3">
            {flags.length === 0 ? (
              <p className="text-center py-12 text-sm text-gray-400">No open summary flags.</p>
            ) : (
              flags.map((f) => (
                <Card key={f.id} className="p-5 border-gray-200 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-gray-500">Order #{f.summary?.order?.orderNo}</span>
                      <h3 className="text-base font-bold text-gray-900">
                        Reason: {f.reason}
                      </h3>
                      {f.freeText && (
                        <p className="text-sm text-gray-700 bg-gray-50 p-2.5 rounded-lg mt-1 italic">
                          "{f.freeText}"
                        </p>
                      )}
                    </div>
                    <Badge variant={f.status === 'OPEN' ? 'warning' : 'default'} size="sm">
                      {f.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                    Flagged by patient on {formatDate(f.createdAt)}
                  </div>
                </Card>
              ))
            )}
          </div>
        ) : activeTab === 'PATHOLOGIST_SAMPLE' ? (
          /* Pathologist Weekly 50 Sample Review View */
          <div className="space-y-3">
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 font-medium">
              📋 <strong>Weekly Pathologist Review (50 Random Summaries):</strong> Review auto-generated explanations and approve or modify before archiving.
            </div>

            {sampleSummaries.length === 0 ? (
              <p className="text-center py-12 text-sm text-gray-400">No summaries generated in the past 7 days.</p>
            ) : (
              sampleSummaries.map((s) => (
                <Card key={s.id} className="p-5 border-gray-200 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs text-gray-500">Order #{s.order?.orderNo} • Language: {s.lang.toUpperCase()}</span>
                      <h4 className="text-sm font-bold text-gray-900 mt-0.5">
                        Patient: {s.order?.patient?.fullName}
                      </h4>
                    </div>
                    <Badge variant={s.reviewStatus === 'APPROVED' ? 'success' : 'default'} size="sm">
                      {s.reviewStatus}
                    </Badge>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-800 leading-relaxed font-mono">
                    {s.body}
                  </div>

                  <div className="flex justify-between items-center text-xs text-gray-400 pt-1">
                    <span>Source: {s.source}</span>
                    {s.reviewStatus !== 'APPROVED' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleApproveSummary(s.id)}
                        className="text-xs px-3 py-1 min-h-[30px]"
                      >
                        ✓ Pathologist Approve
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        ) : (
          /* Callback Tasks List */
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <p className="text-center py-12 text-sm text-gray-400">No open tasks in this category.</p>
            ) : (
              tasks.map((task) => (
                <Card key={task.id} className="p-5 border-gray-200 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-500">
                          {task.order ? `Order #${task.order.orderNo}` : 'Account Task'}
                        </span>
                        <Badge variant={task.status === 'OPEN' ? 'danger' : 'default'} size="sm">
                          {task.status}
                        </Badge>
                      </div>
                      <h3 className="text-base font-bold text-gray-900 mt-1">
                        {task.reason}
                      </h3>
                      {task.order?.patient?.fullName && (
                        <p className="text-xs text-gray-600 mt-0.5">
                          Patient: <strong className="text-gray-800">{task.order.patient.fullName}</strong>
                        </p>
                      )}
                    </div>

                    {task.status === 'OPEN' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setSelectedTask(task);
                          setIsDoneModalOpen(true);
                        }}
                      >
                        Resolve →
                      </Button>
                    )}
                  </div>

                  {task.note && (
                    <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-700">
                      <strong>Resolution Note:</strong> {task.note}
                    </div>
                  )}

                  <div className="text-[11px] text-gray-400 pt-1 border-t border-gray-100 flex justify-between">
                    <span>Created: {formatDate(task.createdAt)}</span>
                    {task.doneBy && <span>Resolved by: {task.doneBy.name}</span>}
                  </div>
                </Card>
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
          <p className="text-xs text-gray-600">
            {selectedTask?.reason}
          </p>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Resolution Note / Pathologist Action <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Verified with patient by phone, confirmed number correction / callback completed..."
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-[#0F5E57] outline-none"
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

