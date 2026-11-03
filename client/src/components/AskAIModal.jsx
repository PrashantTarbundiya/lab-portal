import { useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Modal from './Modal';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import FormattedAIResponse from './FormattedAIResponse';

export default function AskAIModal({ isOpen, onClose, orderId, orderNo, patientName, results = [] }) {
  const [customPrompt, setCustomPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);

  const { token } = useAuth();
  const { lang } = useLanguage();

  const QUICK_PROMPTS = [
    { label: '💡 Plain English Summary', prompt: 'Please explain all my test results in simple, reassuring, non-medical language that anyone can understand.' },
    { label: '🥗 Diet & Lifestyle Tips', prompt: 'Based on these specific lab values, what general diet, hydration, or lifestyle habits are typically recommended?' },
    { label: '🩺 Questions for my Doctor', prompt: 'What key questions should I prepare to ask my doctor during my appointment regarding these results?' },
    { label: '⚡ Check for Urgent Values', prompt: 'Are any of my parameters dangerously out of range or requiring urgent emergency care?' },
    { label: '🇮🇳 తెలుగులో వివరణ (Telugu)', prompt: 'దయచేసి నా ల్యాబ్ నివేదికలోని ఫలితాలను సరళమైన తెలుగులో వివరించండి.' },
    { label: '🇮🇳 हिंदी में समझाइए (Hindi)', prompt: 'कृपया मेरे इन लैब टेस्ट परिणामों को आसान हिंदी भाषा में समझाइए।' },
  ];

  const handleAsk = async (promptToSend) => {
    const text = (promptToSend || customPrompt).trim();
    if (!text) return;

    setError('');
    setLoading(true);

    try {
      const res = await api(`/orders/${orderId}/ask-ai`, {
        method: 'POST',
        body: {
          question: text,
          lang,
        },
        token,
      });

      setConversation((prev) => [
        ...prev,
        {
          question: text,
          answer: res.answer || 'No response generated.',
          model: res.model || 'nvidia/nemotron-3.5-super-vl:free',
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      setCustomPrompt('');
    } catch (err) {
      console.error('Ask AI error:', err);
      setError(err.message || 'Failed to get answer from AI. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard?.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🧪 Ask Labby (Diagnostic AI)"
      size="lg"
    >
      <div className="space-y-4 max-h-[75vh] flex flex-col">
        {/* Header Subtitle */}
        <div className="flex items-center justify-between text-xs text-gray-500 pb-2 border-b border-gray-100">
          <div>
            Patient: <strong className="text-gray-800">{patientName || 'Patient'}</strong> • Order:{' '}
            <span className="font-mono font-bold text-[#0F5E57]">#{orderNo}</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 font-bold text-[11px] border border-teal-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Labby AI • Nemotron 3.5
          </span>
        </div>

        {/* Conversation History / Output Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[160px] max-h-[380px]">
          {conversation.length === 0 && !loading && (
            <div className="text-center py-6 px-4 bg-teal-50/40 rounded-2xl border border-dashed border-teal-200">
              <span className="text-3xl block mb-2">🧪</span>
              <h4 className="text-sm font-bold text-gray-800 mb-1">
                Hi, I'm Labby! Have a question about your report?
              </h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mb-3">
                Select a quick prompt below or type your own question. I'll explain your biological values, reference ranges, and wellness tips.
              </p>
              {results.length > 0 && (
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {results.slice(0, 4).map((r, i) => (
                    <span key={i} className="text-[11px] bg-white border border-gray-200 px-2 py-0.5 rounded-md text-gray-600 font-medium">
                      {r.parameter}: {r.value} {r.unit}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {conversation.map((c, idx) => (
            <div key={idx} className="space-y-2.5">
              {/* Question bubble */}
              <div className="flex justify-end">
                <div className="bg-[#0F5E57] text-white px-4 py-2.5 rounded-2xl rounded-tr-xs text-xs md:text-sm max-w-[85%] shadow-xs">
                  <p className="font-medium">{c.question}</p>
                  <span className="block text-[10px] text-teal-200/80 text-right mt-1">
                    {c.time}
                  </span>
                </div>
              </div>

              {/* AI Answer card with Formatted Markdown / Tables / Bold */}
              <div className="flex justify-start">
                <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl rounded-tl-xs p-4 text-xs md:text-sm text-gray-800 max-w-[95%] space-y-2 shadow-xs">
                  <div className="flex items-center justify-between text-[11px] text-emerald-900 font-bold border-b border-emerald-100 pb-1.5">
                    <span className="flex items-center gap-1.5">
                      <span>🧪</span> Labby's Clinical Explanation
                    </span>
                    <button
                      onClick={() => handleCopy(c.answer, idx)}
                      className="text-emerald-700 hover:text-emerald-900 font-semibold underline cursor-pointer"
                    >
                      {copiedIndex === idx ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                  
                  {/* Clean Formatted AI Output (Bold, Tables, Lists without raw asterisks/hashes) */}
                  <FormattedAIResponse content={c.answer} />

                  <div className="pt-1 flex items-center justify-between text-[10px] text-gray-400">
                    <span>Powered by Labby & NVIDIA Nemotron 3.5</span>
                    <span className="italic">Educational AI • Consult your doctor</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="p-4 bg-teal-50/50 border border-teal-100 rounded-2xl flex items-center gap-3">
              <LoadingSpinner size="sm" />
              <div className="text-xs text-teal-900 font-medium">
                Labby is reviewing your test values with NVIDIA Nemotron 3.5 Super VL...
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Quick Prompts Bar */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-bold text-gray-600 block uppercase tracking-wider">
            Quick Prompts:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((qp, i) => (
              <button
                key={i}
                type="button"
                disabled={loading}
                onClick={() => handleAsk(qp.prompt)}
                className="text-[11px] bg-gray-100 hover:bg-emerald-100 hover:text-emerald-900 text-gray-700 px-2.5 py-1 rounded-lg font-medium transition cursor-pointer disabled:opacity-50"
              >
                {qp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Prompt Input Box */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <label className="block text-xs font-bold text-gray-700">
            Custom Question / Prompt:
          </label>
          <div className="flex gap-2">
            <textarea
              rows={2}
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAsk();
                }
              }}
              disabled={loading}
              placeholder="Type your question for Labby (e.g. 'What caused my high potassium and what foods should I avoid?')..."
              className="flex-1 rounded-xl border border-gray-300 p-2.5 text-xs md:text-sm focus:border-[#0F5E57] focus:ring-1 focus:ring-[#0F5E57] outline-none resize-none"
            />
            <Button
              variant="primary"
              size="sm"
              loading={loading}
              disabled={!customPrompt.trim()}
              onClick={() => handleAsk()}
              className="self-end px-4 py-2.5 font-bold text-xs"
            >
              Ask Labby →
            </Button>
          </div>
        </div>

        {/* Disclaimer Footer */}
        <div className="text-[11px] text-gray-400 bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex items-start gap-1.5 leading-tight">
          <span>ℹ️</span>
          <span>
            This AI tool provides patient education based on your lab values. It is not an official medical diagnosis.
            Always review critical or abnormal results with your physician.
          </span>
        </div>
      </div>
    </Modal>
  );
}

