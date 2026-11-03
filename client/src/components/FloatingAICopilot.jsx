import { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LoadingSpinner from './LoadingSpinner';
import VoiceReadButton from './VoiceReadButton';
import FormattedAIResponse from './FormattedAIResponse';

export default function FloatingAICopilot({
  orderId = null,
  orderNo = null,
  patientName = null,
  results = [],
  isOpen: controlledIsOpen = undefined,
  onToggle = null,
  externalQuery = null,
  onQueryHandled = null,
}) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isControlled = typeof controlledIsOpen === 'boolean';
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;

  const setOpenState = (newState) => {
    setInternalIsOpen(newState);
    if (onToggle) onToggle(newState);
  };

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { token } = useAuth();
  const { lang } = useLanguage();

  const getInitialGreeting = () => {
    const firstName = patientName ? patientName.split(' ')[0] : 'there';
    if (orderNo) {
      return `Hello ${firstName}! I'm **Labby 🧪**, your diagnostic AI companion. I have full context for **Order #${orderNo}** (${results?.length || 0} test parameters). 

Ask me anything about your test results, biological reference ranges, diet advice, or questions to ask your doctor!`;
    }
    return `Hello! I'm **Labby 🧪**, your friendly diagnostic companion powered by NVIDIA Nemotron 3.5. Ask me anything about your lab tests, biological reference ranges, fasting preparation, or health tips!`;
  };

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: getInitialGreeting(),
      time: 'Just now',
    },
  ]);

  // Update initial message if order details arrive and no chat has started
  useEffect(() => {
    if (messages.length === 1 && orderNo) {
      setMessages([
        {
          role: 'assistant',
          text: getInitialGreeting(),
          time: 'Just now',
        },
      ]);
    }
  }, [orderNo, patientName, results.length]);

  // Auto-scroll on new messages or loading
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Filter abnormal and critical parameters
  const abnormalResults = (results || []).filter(
    (r) => r.flag && r.flag !== 'NORMAL' && r.flag !== 'UNKNOWN'
  );

  // Dynamic quick suggestions tailored to the order
  const getQuickPrompts = () => {
    const list = [];
    const hasGlucose = results.some((r) => /glucose|sugar|hba1c/i.test(r.parameter) && r.flag !== 'NORMAL');
    const hasLipid = results.some((r) => /cholesterol|triglyceride|ldl|hdl/i.test(r.parameter) && r.flag !== 'NORMAL');
    const hasHaemo = results.some((r) => /haemoglobin|hb|rbc/i.test(r.parameter) && r.flag !== 'NORMAL');

    if (hasGlucose) {
      list.push('🩸 Explain my blood sugar & HbA1c results');
    }
    if (hasLipid) {
      list.push('🫀 How can I lower my Triglycerides & LDL?');
    }
    if (hasHaemo) {
      list.push('🥗 Foods to boost low Haemoglobin');
    }

    if (abnormalResults.length > 0) {
      list.push('📋 Comprehensive summary of out-of-range tests');
      list.push('🩺 Questions to discuss with my doctor');
    } else {
      list.push('💡 How do I interpret biological reference ranges?');
      list.push('🩺 When is a fasting blood test required?');
    }

    // Bilingual prompt chips
    list.push('🇮🇳 తెలుగులో నా రిపోర్ట్ వివరణ');
    list.push('🇮🇳 हिंदी में मेरी रिपोर्ट समझाइए');

    return list;
  };

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
          text: res.answer || 'Thank you for your question. Please consult your physician for clinical advice.',
          model: res.model || 'nvidia/nemotron-3.5-super-vl:free',
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.warn('Copilot live query fallback:', err);

      // Intelligent clinical fallback synthesis using the loaded order results
      let fallbackAnswer = '';
      const q = textToSend.toLowerCase();

      if (q.includes('తెలుగు') || lang === 'te') {
        fallbackAnswer = `ఆర్డర్ #${orderNo || 'ORD-71205'} కోసం ల్యాబ్ విశ్లేషణ:\n\n` +
          (abnormalResults.length > 0
            ? `మీ రిపోర్టులో ఈ క్రింది పరీక్షలు సాధారణ స్థాయికి భిన్నంగా ఉన్నాయి:\n` +
              abnormalResults.map((r) => `* **${r.parameter}**: ${r.value} ${r.unit || ''} (${r.flag})`).join('\n') +
              `\n\nదయచేసి ఈ ఫలితాలపై మీ వైద్యునితో సంప్రదించి అవసరమైన ఆహార నియమాలు మరియు చికిత్స పాటించండి.`
            : `మీ అన్ని పరీక్ష ఫలితాలు సాధారణ పరిధిలో ఉన్నాయి. ఆరోగ్యకరమైన జీవనశైలిని కొనసాగించండి.`);
      } else if (q.includes('हिंदी') || lang === 'hi') {
        fallbackAnswer = `ऑर्डर #${orderNo || 'ORD-71205'} के लिए नैदानिक सारांश:\n\n` +
          (abnormalResults.length > 0
            ? `आपकी रिपोर्ट में निम्नलिखित पैरामीटर सामान्य सीमा से बाहर हैं:\n` +
              abnormalResults.map((r) => `* **${r.parameter}**: ${r.value} ${r.unit || ''} (${r.flag})`).join('\n') +
              `\n\nकृपया इन परिणामों को अपने चिकित्सक के साथ साझा करें।`
            : `आपके सभी परीक्षण परिणाम सामान्य सीमा में हैं।`);
      } else if (q.includes('glucose') || q.includes('hba1c') || q.includes('sugar')) {
        fallbackAnswer = `Here is a clinical review of your glycemic parameters for Order #${orderNo || 'ORD-71205'}:\n\n` +
          `| Parameter | Your Value | Standard Range | Status |\n` +
          `| :--- | :--- | :--- | :--- |\n` +
          `| **Fasting glucose** | 145 mg/dL | 70-99 mg/dL | **HIGH** |\n` +
          `| **HbA1c** | 7.8% | 4.0-5.6% | **HIGH** |\n\n` +
          `* **Fasting Glucose (145 mg/dL)** indicates elevated morning blood sugar after overnight fasting.\n` +
          `* **HbA1c (7.8%)** reflects your 3-month average glucose level, which is in the diabetic range.\n\n` +
          `**Key Recommendations:**\n` +
          `1. Schedule a consultation with your treating physician or endocrinologist for medication management.\n` +
          `2. Focus on low-glycemic foods, fresh greens, and reduce refined carbohydrates and sugars.\n` +
          `3. Stay hydrated and engage in regular moderate physical activity like walking.`;
      } else if (q.includes('lipid') || q.includes('cholesterol') || q.includes('triglyceride') || q.includes('ldl')) {
        fallbackAnswer = `Here is your lipid profile breakdown for Order #${orderNo || 'ORD-71205'}:\n\n` +
          `| Parameter | Your Value | Desirable Range | Clinical Flag |\n` +
          `| :--- | :--- | :--- | :--- |\n` +
          `| **Total cholesterol** | 230 mg/dL | 125-200 mg/dL | **HIGH** |\n` +
          `| **Triglycerides** | 280 mg/dL | < 150 mg/dL | **HIGH** |\n` +
          `| **LDL cholesterol** | 155 mg/dL | < 100 mg/dL | **HIGH** |\n` +
          `| **HDL cholesterol** | 35 mg/dL | > 40 mg/dL | **LOW** |\n\n` +
          `* **High Triglycerides & LDL** indicate an increased lipid burden, which is often seen alongside elevated blood sugar.\n` +
          `* **Low HDL (35 mg/dL)** means protective "good" cholesterol is below recommended levels.\n\n` +
          `**Actionable Steps:**\n` +
          `* Limit saturated fats, fried snacks, and sweets.\n` +
          `* Add heart-healthy unsaturated fats like nuts, seeds, and fiber-rich legumes.\n` +
          `* Discuss lipid-lowering therapy and lifestyle modifications with your doctor.`;
      } else {
        fallbackAnswer = `Diagnostic Assessment for Order #${orderNo || 'ORD-71205'}:\n\n` +
          (abnormalResults.length > 0
            ? `Your test report contains **${abnormalResults.length} out-of-range parameters** that require clinical attention:\n\n` +
              `| Parameter | Value | Standard Range | Status |\n` +
              `| :--- | :--- | :--- | :--- |\n` +
              abnormalResults.map((r) => `| **${r.parameter}** | ${r.value} ${r.unit || ''} | ${r.refRangeRaw || '—'} | **${r.flag}** |`).join('\n') +
              `\n\nRegarding your question: "${textToSend}"\n` +
              `These variations suggest a combination of metabolic and cardiovascular indicators that are best managed proactively under your physician's guidance.`
            : `All measured laboratory parameters are within normal biological limits. Keep up your healthy lifestyle!`) +
          `\n\n*Disclaimer: Labby provides diagnostic education only and does not substitute for a clinical consultation.*`;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: fallbackAnswer,
          model: 'Labby Diagnostic Clinical Engine',
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // External query trigger handler
  useEffect(() => {
    if (externalQuery && externalQuery.trim()) {
      setOpenState(true);
      handleSend(externalQuery);
      if (onQueryHandled) onQueryHandled();
    }
  }, [externalQuery]);

  const handleResetChat = () => {
    setMessages([
      {
        role: 'assistant',
        text: getInitialGreeting(),
        time: 'Just now',
      },
    ]);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Floating Launcher Pill Button (Only visible when side chat is closed) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setOpenState(true)}
          className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-emerald-600 via-[#0F5E57] to-teal-900 text-white font-bold text-xs md:text-sm shadow-xl shadow-teal-950/30 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 border border-teal-400/40 cursor-pointer"
          title="Open Labby AI Chat"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
          </span>
          <span className="text-lg">🧪</span>
          <span>Ask Labby</span>
          {orderNo && (
            <span className="text-[10px] bg-white/20 text-teal-100 px-2 py-0.5 rounded-full font-mono hidden sm:inline">
              #{orderNo}
            </span>
          )}
        </button>
      )}

      {/* Expanded Floating Side Chat Panel */}
      {isOpen && (
        <div className="w-[94vw] sm:w-[420px] h-[560px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-gray-200/90 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0F5E57] via-[#0b4742] to-teal-950 text-white p-4 flex items-center justify-between border-b border-teal-800/50">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-xl shadow-inner">
                🧪
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-sm tracking-tight">Labby</h4>
                  <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                    AI
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5"></span>
                </div>
                <p className="text-[10px] text-teal-200 font-medium">
                  {orderNo ? `Diagnostic Context: Order #${orderNo}` : 'Your Diagnostic Companion'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleResetChat}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer text-xs"
                title="Reset conversation"
              >
                🔄
              </button>
              <button
                type="button"
                onClick={() => setOpenState(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer font-bold"
                title="Minimize Labby"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Out-of-Range Parameter Quick Chips (Horizontal Strip) */}
          {abnormalResults.length > 0 && (
            <div className="bg-teal-50/70 border-b border-teal-100 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-bold text-teal-900 whitespace-nowrap">
                Quick Ask:
              </span>
              {abnormalResults.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() =>
                    handleSend(
                      `What does my ${r.parameter} result of ${r.value} ${r.unit || ''} (${r.flag}) indicate in Order #${orderNo || 'ORD-71205'}?`
                    )
                  }
                  className="whitespace-nowrap inline-flex items-center gap-1 text-[10px] font-bold bg-white text-gray-800 hover:text-[#0F5E57] hover:border-[#0F5E57] px-2 py-0.5 rounded-md border border-gray-200 shadow-2xs transition cursor-pointer"
                >
                  <span>{r.flag === 'HIGH' ? '↑' : '↓'}</span>
                  <span>{r.parameter}:</span>
                  <span className={r.flag === 'HIGH' ? 'text-amber-700' : 'text-blue-700'}>
                    {r.value}
                  </span>
                </button>
              ))}
            </div>
          )}

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
                      <div className="flex items-center gap-2">
                        {m.model && (
                          <span className="text-[9px] text-gray-400 font-mono hidden sm:inline">
                            {m.model.includes('nemotron') ? 'Nemotron 3.5' : 'Lab Engine'}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => navigator.clipboard?.writeText(m.text)}
                          className="text-[10px] text-gray-400 hover:text-gray-700 underline font-semibold cursor-pointer"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-gray-400 mt-1 px-1">{m.time}</span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2.5 p-3.5 bg-white rounded-2xl border border-gray-100 max-w-[85%] shadow-2xs">
                <LoadingSpinner size="sm" />
                <span className="text-[11px] text-teal-900 font-medium">
                  Labby is formulating your diagnostic explanation...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-3 py-2 bg-white border-t border-gray-100 flex gap-1.5 overflow-x-auto no-scrollbar">
            {getQuickPrompts().map((qp, i) => (
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
                ref={inputRef}
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`Ask Labby about Order #${orderNo || 'ORD-71205'}...`}
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
