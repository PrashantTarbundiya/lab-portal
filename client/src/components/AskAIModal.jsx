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
  const { lang, setLang } = useLanguage();

  const QUICK_PROMPTS = [
    { label: 'Plain English Summary', prompt: 'Please explain all my test results in simple, reassuring, non-medical language that anyone can understand.', lang: 'en' },
    { label: 'Diet & Lifestyle Tips', prompt: 'Based on these specific lab values, what general diet, hydration, or lifestyle habits are typically recommended?', lang: 'en' },
    { label: 'Questions for my Doctor', prompt: 'What key questions should I prepare to ask my doctor during my appointment regarding these results?', lang: 'en' },
    { label: 'Check for Urgent Values', prompt: 'Are any of my parameters dangerously out of range or requiring urgent emergency care?', lang: 'en' },
    { label: 'తెలుగులో వివరణ (Telugu)', prompt: 'దయచేసి నా ల్యాబ్ నివేదికలోని ఫలితాలను సరళమైన తెలుగులో వివరించండి.', lang: 'te' },
    { label: 'हिंदी में समझाइए (Hindi)', prompt: 'कृपया मेरे इन लैब टेस्ट परिणामों को आसान हिंदी भाषा में समझाइए।', lang: 'hi' },
  ];

  const handleAsk = async (promptToSend, explicitLang = null) => {
    const text = (promptToSend || customPrompt).trim();
    if (!text) return;

    let targetLang = explicitLang || lang;
    if (text.includes('తెలుగు') || /[\u0C00-\u0C7F]/.test(text)) {
      targetLang = 'te';
      setLang('te');
    } else if (text.includes('हिंदी') || /[\u0900-\u097F]/.test(text)) {
      targetLang = 'hi';
      setLang('hi');
    }

    setError('');
    setLoading(true);

    try {
      const res = await api(`/orders/${orderId}/ask-ai`, {
        method: 'POST',
        body: {
          question: text,
          lang: targetLang,
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
      title="Ask Labby (Diagnostic AI)"
      size="2xl"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4 max-h-[78vh] flex flex-col text-slate-100">
        {/* Header Subtitle with Active Language Selector */}
        <div className="flex flex-wrap items-center justify-between text-xs pb-3 border-b border-white/10 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Patient:</span>
            <strong className="text-white font-bold text-sm font-display">{patientName || 'Patient'}</strong>
            <span className="text-slate-400">•</span>
            <span className="text-slate-400">Order:</span>
            <span className="font-mono font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
              #{orderNo}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Language Toggle inside Ask Labby */}
            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/15">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  lang === 'en'
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLang('te')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  lang === 'te'
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                తెలుగు
              </button>
              <button
                type="button"
                onClick={() => setLang('hi')}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  lang === 'hi'
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                हिन्दी
              </button>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px] border border-emerald-500/40 font-mono shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Labby AI • Nemotron 3.5
            </span>
          </div>
        </div>

        {/* Conversation History / Output Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[180px] max-h-[420px] custom-scrollbar">
          {conversation.length === 0 && !loading && (
            <div className="text-center py-7 px-5 bg-[#07151f]/80 rounded-3xl border border-white/10 shadow-inner space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              </div>
              <h4 className="text-base font-bold text-white font-display">
                {lang === 'te'
                  ? 'నమస్కారం! నేను ల్యాబీ (Labby) AI. మీ రిపోర్టు గురించి సందేహాలు ఉన్నాయా?'
                  : lang === 'hi'
                  ? 'नमस्ते! मैं लैबी (Labby) AI हूँ। क्या आपके पास अपनी रिपोर्ट के बारे में कोई प्रश्न है?'
                  : "Hi, I'm Labby! Have a question about this diagnostic report?"}
              </h4>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                {lang === 'te'
                  ? 'క్రింది త్వరిత ప్రశ్నను ఎంచుకోండి లేదా మీ సందేహాన్ని టైప్ చేయండి. మీ పరీక్ష విలువల ప్రామాణిక పరిధులు మరియు జీవనశైలి చిట్కాలను సరళమైన తెలుగులో వివరిస్తాను.'
                  : lang === 'hi'
                  ? 'नीचे दिए गए त्वरित प्रश्नों में से चुनें या अपना प्रश्न टाइप करें। मैं आपकी जांच रिपोर्ट और स्वास्थ्य सलाह को आसान भाषा में समझाऊंगा।'
                  : "Select a quick prompt below or type your own question. I'll explain reference ranges, biomarker deviations, and dietary guidelines."}
              </p>
              {results.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center pt-1">
                  {results.slice(0, 5).map((r, i) => (
                    <span
                      key={i}
                      className="text-xs font-mono bg-white/10 border border-white/15 px-3 py-1 rounded-xl text-emerald-300 font-semibold shadow-xs"
                    >
                      {r.parameter}: <strong className="text-white">{r.value}</strong> {r.unit || ''}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {conversation.map((c, idx) => (
            <div key={idx} className="space-y-3">
              {/* Question bubble */}
              <div className="flex justify-end">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 px-4 py-2.5 rounded-2xl rounded-tr-xs text-xs md:text-sm font-bold max-w-[85%] shadow-md shadow-emerald-500/20">
                  <p>{c.question}</p>
                  <span className="block text-[10px] text-slate-900/80 font-mono text-right mt-1">
                    {c.time}
                  </span>
                </div>
              </div>

              {/* AI Answer card with Formatted Markdown / Tables / Bold */}
              <div className="flex justify-start">
                <div className="bg-[#132330]/95 border border-white/15 rounded-2xl rounded-tl-xs p-4 sm:p-5 text-xs md:text-sm text-slate-100 max-w-[95%] space-y-3 shadow-xl">
                  <div className="flex items-center justify-between text-xs text-emerald-300 font-bold border-b border-white/10 pb-2">
                    <span className="flex items-center gap-1.5 font-display font-black">
                      <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                      <span>Labby's Clinical Diagnostic Explanation</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(c.answer, idx)}
                      className="text-emerald-400 hover:text-white font-semibold underline cursor-pointer transition text-xs inline-flex items-center gap-1"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                          <span>Copied</span>
                        </>
                      ) : (
                        <span>Copy</span>
                      )}
                    </button>
                  </div>

                  {/* Clean Formatted AI Output (Bold, Tables, Lists without raw asterisks/hashes) */}
                  <FormattedAIResponse content={c.answer} />

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="text-teal-300">Powered by NVIDIA Nemotron 3.5 Super VL</span>
                    <span className="italic">Educational AI • Consult attending physician</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="p-4 bg-[#132330]/90 border border-white/15 rounded-2xl flex items-center gap-3 shadow-md">
              <LoadingSpinner size="sm" />
              <div className="text-xs text-emerald-300 font-medium font-mono">
                Labby is reviewing laboratory values with NVIDIA Nemotron 3.5 Super VL...
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300 font-medium flex items-center gap-1.5">
              <svg className="w-4 h-4 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Quick Prompts Bar */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 block uppercase tracking-wider">
            Quick Prompts:
          </span>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((qp, i) => (
              <button
                key={i}
                type="button"
                disabled={loading}
                onClick={() => handleAsk(qp.prompt, qp.lang)}
                className="text-xs bg-white/10 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-200 border border-white/15 px-3 py-1.5 rounded-xl font-medium transition cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {qp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Prompt Input Box */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <label className="block text-xs font-mono font-bold text-slate-300">
            {lang === 'te' ? 'మీ స్వంత ప్రశ్న / అభ్యర్థన:' : lang === 'hi' ? 'आपका व्यक्तिगत प्रश्न / सुझाव:' : 'Custom Question / Prompt:'}
          </label>
          <div className="flex gap-2.5 items-end">
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
              placeholder={
                lang === 'te'
                  ? "ల్యాబీని అడగండి (ఉదా. 'SGPT అధికంగా ఉండటానికి కారణాలు ఏమిటి మరియు ఏ ఆహార జాగ్రత్తలు తీసుకోవాలి?')..."
                  : lang === 'hi'
                  ? "लैबी से पूछें (उदा. 'SGPT अधिक होने का क्या कारण है और क्या परहेज करना चाहिए?')..."
                  : "Type your question for Labby (e.g. 'What caused elevated SGPT and what dietary adjustments are recommended?')..."
              }
              className="flex-1 rounded-2xl border border-white/20 bg-[#07151f]/90 p-3 text-xs md:text-sm text-white placeholder-slate-400 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none resize-none transition shadow-inner"
            />
            <button
              type="button"
              disabled={!customPrompt.trim() || loading}
              onClick={() => handleAsk()}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/25 active:scale-95 disabled:opacity-40 transition cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <span>{lang === 'te' ? 'ల్యాబీని అడగండి' : lang === 'hi' ? 'लैबी से पूछें' : 'Ask Labby'}</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Disclaimer Footer */}
        <div className="text-[11px] text-slate-400 bg-white/5 p-3 rounded-2xl border border-white/10 flex items-start gap-2.5 leading-relaxed">
          <svg className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            This AI tool provides patient education based on your laboratory values. It is not an official medical diagnosis.
            Always correlate findings clinically with your attending physician.
          </span>
        </div>
      </div>
    </Modal>
  );
}
