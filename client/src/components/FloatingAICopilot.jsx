import { useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LoadingSpinner from './LoadingSpinner';
import VoiceReadButton from './VoiceReadButton';
import FormattedAIResponse from './FormattedAIResponse';

export default function FloatingAICopilot({ orderId = null, orderNo = null, patientName = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hello! I'm Labby 🧪, your friendly diagnostic companion powered by NVIDIA Nemotron 3.5. Ask me anything about your lab tests, biological reference ranges, fasting preparation, or health tips!",
      time: 'Just now',
    },
  ]);

  const { token } = useAuth();
  const { lang } = useLanguage();

  const QUICK_PROMPTS = [
    '💡 How do I interpret biological reference ranges?',
    '🥗 What foods help improve low haemoglobin?',
    '🩺 When is a fasting blood test required?',
    '🇮🇳 తెలుగులో ల్యాబ్ ఫలితాల సహాయం',
  ];

  const handleSend = async (customText) => {
    const textToSend = (customText || prompt).trim();
    if (!textToSend || loading) return;

    const userMsg = {
      role: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setPrompt('');
    setLoading(true);

    try {
      const endpoint = orderId ? `/orders/${orderId}/ask-ai` : '/orders/ai/general-ask';
      const res = await api(endpoint, {
        method: 'POST',
        body: { question: textToSend, lang },
        token,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: res.answer || 'Thank you for your question. Please consult your physician for medical advice.',
          model: res.model || 'nvidia/nemotron-3.5-super-vl:free',
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.error('Copilot send error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Sorry, I encountered an issue retrieving the answer. Please check your connection or try again.',
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-600 via-[#0F5E57] to-teal-900 text-white font-bold text-xs md:text-sm shadow-lg shadow-teal-950/25 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 border border-teal-400/40 cursor-pointer"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
          </span>
          <span className="text-base">🧪</span>
          <span>Ask Labby</span>
          <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-mono hidden sm:inline">
            Lab AI
          </span>
        </button>
      )}

      {/* Expanded Floating Chat Panel */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[410px] h-[520px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0F5E57] to-teal-900 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-xl">
                🧪
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-sm tracking-tight">Labby</h4>
                  <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.2 rounded font-bold">AI</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5"></span>
                </div>
                <p className="text-[10px] text-teal-200">
                  {orderNo ? `Diagnostic Context: Order #${orderNo}` : 'Your Diagnostic Companion'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer"
              title="Close Labby"
            >
              ✕
            </button>
          </div>

          {/* Messages Scroll View */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F9FBFA] text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] p-3.5 rounded-2xl ${
                    m.role === 'user'
                      ? 'bg-[#0F5E57] text-white rounded-tr-xs shadow-xs font-medium'
                      : 'bg-white text-gray-800 border border-gray-200/90 rounded-tl-xs shadow-2xs leading-relaxed'
                  }`}
                >
                  {m.role === 'assistant' ? (
                    <FormattedAIResponse content={m.text} />
                  ) : (
                    <p className="whitespace-pre-line">{m.text}</p>
                  )}

                  {/* Narration and copy for assistant messages */}
                  {m.role === 'assistant' && (
                    <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between">
                      <VoiceReadButton text={m.text} lang={lang} />
                      <button
                        onClick={() => navigator.clipboard?.writeText(m.text)}
                        className="text-[10px] text-gray-400 hover:text-gray-700 underline font-semibold cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-gray-400 mt-1 px-1">{m.time}</span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2.5 p-3 bg-white rounded-2xl border border-gray-100 max-w-[85%] shadow-2xs">
                <LoadingSpinner size="sm" />
                <span className="text-[11px] text-teal-900 font-medium">Labby is formulating your clinical explanation...</span>
              </div>
            )}
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-3 py-2 bg-white border-t border-gray-100 flex gap-1.5 overflow-x-auto no-scrollbar">
            {QUICK_PROMPTS.map((qp, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(qp)}
                className="whitespace-nowrap text-[10px] bg-gray-100 hover:bg-teal-50 hover:text-teal-900 text-gray-600 px-2.5 py-1 rounded-full font-medium transition cursor-pointer"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white border-t border-gray-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask Labby about your lab report or health..."
                disabled={loading}
                className="flex-1 bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-[#0F5E57] outline-none transition"
              />
              <button
                type="submit"
                disabled={!prompt.trim() || loading}
                className="px-3.5 py-2 bg-[#0F5E57] hover:bg-[#0c4b45] text-white rounded-xl font-bold text-xs shadow-xs disabled:opacity-40 transition cursor-pointer"
              >
                Ask Labby
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

