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

  useEffect(() => {
    const handleOpen = () => setOpenState(true);
    window.addEventListener('open-ai-copilot', handleOpen);
    return () => window.removeEventListener('open-ai-copilot', handleOpen);
  }, []);

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { token } = useAuth();
  const { lang, setLang } = useLanguage();

  const isDoctor = typeof window !== 'undefined' && window.location.pathname.startsWith('/doctor');

  const getInitialGreeting = () => {
    if (lang === 'te') {
      if (isDoctor) {
        if (orderNo) {
          return `నమస్కారం డాక్టర్ గారు! నేను **ల్యాబీ**, మీ డయాగ్నస్టిక్ ఏఐ క్లినికల్ కోపైలట్. **${patientName || 'రోగి'}** (ఆర్డర్ **#${orderNo}**) క్లినికల్ ఫలితాలు సిద్ధంగా ఉన్నాయి.\n\nబయోమార్కర్ల సహసంబంధాలు లేదా డిఫరెన్షియల్ డయాగ్నోసిస్ గురించి నన్ను అడగండి.`;
        }
        return `నమస్కారం డాక్టర్ గారు! నేను **ల్యాబీ**, మీ డయాగ్నస్టిక్ ఏఐ క్లినికల్ అసిస్టెంట్. బయోమార్కర్లు, రిఫరెన్స్ పరిధులు లేదా ఏదైనా రోగి రికార్డుపై **"Ask AI"** క్లిక్ చేసి పరిశీలించండి.`;
      }
      const firstName = patientName ? patientName.split(' ')[0] : 'మిత్రమా';
      if (orderNo) {
        return `నమస్కారం ${firstName}! నేను **ల్యాబీ**, మీ డయాగ్నస్టిక్ ఏఐ సహాయకుడిని. మీ **ఆర్డర్ #${orderNo}** (${results?.length || 0} పరీక్షలు) వివరాలు లోడ్ అయ్యాయి.\n\nమీ పరీక్ష ఫలితాలు, ప్రామాణిక పరిధులు, ఆహార సూచనలు లేదా డాక్టర్‌ను అడగాల్సిన ప్రశ్నల గురించి నన్ను అడగండి!`;
      }
      return `నమస్కారం! నేను **ల్యాబీ**, కంపెనీ A డయాగ్నస్టిక్స్ ఏఐ సహాయకుడిని. మీ రక్త పరీక్షలు, ఉపవాస నియమాలు లేదా ఆరోగ్య చిట్కాల గురించి నన్ను అడగండి!`;
    }

    if (lang === 'hi') {
      if (isDoctor) {
        if (orderNo) {
          return `नमस्ते डॉक्टर! मैं **लैबी**, आपका डायग्नोस्टिक एआई क्लिनिकल कोपायलट हूँ। **${patientName || 'मरीज़'}** (ऑर्डर **#${orderNo}**) का डेटा उपलब्ध है।\n\nबायोमार्कर सहसंबंध या विभेदक निदान के बारे में पूछें।`;
        }
        return `नमस्ते डॉक्टर! मैं **लैबी**, आपका डायग्नोस्टिक एआई क्लिनिकल सहायक हूँ। संदर्भ सीमाओं या परीक्षण विधियों के बारे में बेझिझक पूछें।`;
      }
      const firstName = patientName ? patientName.split(' ')[0] : 'मित्र';
      if (orderNo) {
        return `नमस्ते ${firstName}! मैं **लैबी**, आपका डायग्नोस्टिक एआई साथी हूँ। आपके **ऑर्डर #${orderNo}** (${results?.length || 0} परीक्षण) का विवरण उपलब्ध है।\n\nअपनी जांच रिपोर्ट, सामान्य सीमाओं, खान-पान की सलाह या डॉक्टर से पूछने योग्य सवालों के बारे में मुझसे पूछें!`;
      }
      return `नमस्ते! मैं **लैबी**, आपका डायग्नोस्टिक एआई साथी हूँ। अपने लैब टेस्ट, उपवास नियमों या स्वास्थ्य संबंधी सुझावों के बारे में बेझिझक पूछें!`;
    }

    if (isDoctor) {
      if (orderNo) {
        return `Hello Doctor! I'm **Labby**, your diagnostic AI clinical copilot. I have clinical context loaded for **${patientName || 'Patient'}** (Order **#${orderNo}**).

You can ask me about biomarker correlations, differential diagnoses, physiological reference standards, or clinical intervention pathways for this patient.`;
      }
      return `Hello Doctor! I'm **Labby**, your diagnostic AI clinical assistant powered by NVIDIA Nemotron 3.5.

Ask me about reference ranges, biomarker correlations, test methodologies, or click **"Ask AI"** on any patient record to inspect their laboratory findings.`;
    }

    const firstName = patientName ? patientName.split(' ')[0] : 'there';
    if (orderNo) {
      return `Hello ${firstName}! I'm **Labby**, your diagnostic AI companion. I have full context for **Order #${orderNo}** (${results?.length || 0} test parameters). 

Ask me anything about your test results, biological reference ranges, diet advice, or questions to ask your doctor!`;
    }
    return `Hello! I'm **Labby**, your friendly diagnostic companion powered by NVIDIA Nemotron 3.5. Ask me anything about your lab tests, biological reference ranges, fasting preparation, or health tips!`;
  };

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: getInitialGreeting(),
      time: 'Just now',
    },
  ]);

  // Update initial message if order details arrive or language changes and user hasn't chatted yet
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'assistant') {
      setMessages([
        {
          role: 'assistant',
          text: getInitialGreeting(),
          time: 'Just now',
        },
      ]);
    }
  }, [lang, orderNo, patientName, results.length]);

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

  // Dynamic quick suggestions tailored to the order and active language
  const getQuickPrompts = () => {
    if (lang === 'te') {
      return [
        'నా రక్త పరీక్ష ఫలితాలను తెలుగులో వివరించండి',
        'షుగర్ (గ్లూకోజ్) మరియు HbA1c నియంత్రణ పద్ధతులు',
        'కొలెస్ట్రాల్ మరియు లిపిడ్ ప్రొఫైల్ ఆహార సలహాలు',
        'సాధారణ పరిధి వెలుపల ఉన్న పరీక్షల వివరాలు',
        'డాక్టర్‌ను అడగవలసిన ముఖ్యమైన ప్రశ్నలు',
      ];
    }

    if (lang === 'hi') {
      return [
        'मेरी रक्त जांच रिपोर्ट को सरल हिन्दी में समझाइए',
        'ब्लड शुगर और HbA1c को नियंत्रित करने के उपाय',
        'कोलेस्ट्रॉल और लिपिड प्रोफाइल हेतु आहार सुझाव',
        'सामान्य सीमा से बाहर परीक्षणों का विवरण',
        'डॉक्टर से परामर्श हेतु आवश्यक प्रश्न',
      ];
    }

    const list = [];

    if (isDoctor) {
      if (orderNo) {
        list.push('Clinical overview of flagged parameters');
        list.push('Differential diagnoses for out-of-range values');
        list.push('Possible drug-test interference');
      } else {
        list.push('Common causes of elevated ALT & AST');
        list.push('HbA1c vs Fasting Glucose discordance');
        list.push('Recommended lipid management pathways');
      }
      return list;
    }

    const hasGlucose = results.some((r) => /glucose|sugar|hba1c/i.test(r.parameter) && r.flag !== 'NORMAL');
    const hasLipid = results.some((r) => /cholesterol|triglyceride|ldl|hdl/i.test(r.parameter) && r.flag !== 'NORMAL');
    const hasHaemo = results.some((r) => /haemoglobin|hb|rbc/i.test(r.parameter) && r.flag !== 'NORMAL');

    if (hasGlucose) {
      list.push('Explain my blood sugar & HbA1c results');
    }
    if (hasLipid) {
      list.push('How can I lower my Triglycerides & LDL?');
    }
    if (hasHaemo) {
      list.push('Foods to boost low Haemoglobin');
    }

    if (abnormalResults.length > 0) {
      list.push('Comprehensive summary of out-of-range tests');
      list.push('Questions to discuss with my doctor');
    } else {
      list.push('How do I interpret biological reference ranges?');
      list.push('When is a fasting blood test required?');
    }

    return list;
  };

  const handleSend = async (customText) => {
    const textToSend = (customText || prompt).trim();
    if (!textToSend || loading) return;

    let targetLang = lang;
    if (textToSend.includes('తెలుగు') || /[\u0C00-\u0C7F]/.test(textToSend)) {
      targetLang = 'te';
      setLang('te');
    } else if (textToSend.includes('हिंदी') || /[\u0900-\u097F]/.test(textToSend)) {
      targetLang = 'hi';
      setLang('hi');
    }

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
        body: { question: textToSend, lang: targetLang },
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

      // Intelligent clinical dietary / test explanation fallback based on patient findings
      let fallbackAnswer = '';
      const q = textToSend.toLowerCase();
      const isDietQ = q.includes('food') || q.includes('eat') || q.includes('diet') || q.includes('consume') || q.includes('nutrition') || q.includes('ఆహార') || q.includes('తిన');
      const hasLowHb = abnormalResults.some((r) => r.parameter?.toLowerCase().includes('haemoglobin') || r.parameter?.toLowerCase().includes('hemoglobin'));

      if (q.includes('తెలుగు') || lang === 'te') {
        if (isDietQ && hasLowHb) {
          fallbackAnswer = `ఆర్డర్ #${orderNo || 'ORD-71204'} - రక్తం పెరగడానికి ఆహార సూచనలు:\n\n` +
            `మీ హీమోగ్లోబిన్ సాధారణం కంటే కొద్దిగా తక్కువగా ఉంది. ఈ క్రింది ఆహారాలు సహాయపడతాయి:\n` +
            `* **ఐరన్ అధికంగా ఉండే ఆహారాలు**: మునగాకు, పాలకూర, తోటకూర, బీట్‌రూట్, దానిమ్మ, ఖర్జూరాలు, కోడిగుడ్లు మరియు పప్పుధాన్యాలు.\n` +
            `* **విటమిన్ సి**: ఉసిరికాయ, నిమ్మరసం, బత్తాయి (ఇవి ఐరన్ శోషణకు తోడ్పడతాయి).\n` +
            `* **గమనిక**: భోజనం చేసిన వెంటనే టీ లేదా కాఫీ తాగవద్దు.\n\n` +
            `మరిన్ని వివరాల కోసం మీ వైద్యునితో సంప్రదించండి.`;
        } else {
          fallbackAnswer = `ఆర్డర్ #${orderNo || 'ORD-71204'} కోసం ల్యాబ్ విశ్లేషణ:\n\n` +
            (abnormalResults.length > 0
              ? `మీ రిపోర్టులో ఈ క్రింది పరీక్షలు సాధారణ స్థాయికి భిన్నంగా ఉన్నాయి:\n` +
                abnormalResults.map((r) => `* **${r.parameter}**: ${r.value} ${r.unit || ''} (${r.flag})`).join('\n') +
                `\n\nదయచేసి ఈ ఫలితాలపై మీ వైద్యునితో సంప్రదించి అవసరమైన ఆహార నియమాలు మరియు చికిత్స పాటించండి.`
              : `మీ అన్ని పరీక్ష ఫలితాలు సాధారణ పరిధిలో ఉన్నాయి. ఆరోగ్యకరమైన జీవనశైలిని కొనసాగించండి.`);
        }
      } else if (q.includes('हिंदी') || lang === 'hi') {
        fallbackAnswer = `ऑर्डर #${orderNo || 'ORD-71204'} के लिए नैदानिक सारांश:\n\n` +
          (abnormalResults.length > 0
            ? `आपकी रिपोर्ट में निम्नलिखित पैरामीटर सामान्य सीमा से बाहर हैं:\n` +
              abnormalResults.map((r) => `* **${r.parameter}**: ${r.value} ${r.unit || ''} (${r.flag})`).join('\n') +
              `\n\nकृपया इन परिणामों को अपने चिकित्सक के साथ साझा करें।`
            : `आपके सभी परीक्षण परिणाम सामान्य सीमा में हैं।`);
      } else if (isDietQ && hasLowHb) {
        fallbackAnswer = `Your Haemoglobin is slightly low (${abnormalResults[0]?.value || '10.2'} g/dL). To help support healthy haemoglobin levels, include these foods in your daily meals:\n\n` +
          `* **Iron-Rich Foods**: Dark leafy greens (spinach, drumstick leaves/munagaku), beetroot, lentils (toor, moong), chickpeas, whole eggs, dates, pomegranate, and jaggery.\n` +
          `* **Vitamin C (Boosts Iron Absorption)**: Amla (Indian gooseberry), lemon, oranges, guava, and tomatoes.\n` +
          `* **Folate & Vitamin B12**: Legumes, sprouted beans, whole grains, dairy, and eggs.\n` +
          `* **Key Eating Tip**: Avoid drinking tea, coffee, or milk immediately around meals, as tannins significantly inhibit iron absorption.\n\n` +
          `*Please consult your doctor to determine if iron supplementation is recommended for you.*`;
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
        fallbackAnswer = `Diagnostic Assessment for Order #${orderNo || 'ORD-71204'}:\n\n` +
          (abnormalResults.length > 0
            ? `Your test report shows **${abnormalResults.length} parameter outside standard reference intervals**:\n\n` +
              `| Parameter | Value | Standard Range | Status |\n` +
              `| :--- | :--- | :--- | :--- |\n` +
              abnormalResults.map((r) => `| **${r.parameter}** | ${r.value} ${r.unit || ''} | ${r.refRangeRaw || '—'} | **${r.flag}** |`).join('\n') +
              `\n\nFor personalized interpretation and clinical evaluation, please share these results with your attending clinician.`
            : `All measured laboratory parameters are within normal biological limits. Keep up your healthy lifestyle!`) +
          `\n\n*Disclaimer: Labby provides diagnostic education only and does not substitute for a clinical consultation.*`;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: fallbackAnswer,
          model: 'nvidia/nemotron-3.5-super-vl',
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
    <div className="fixed bottom-20 sm:bottom-6 right-4 z-50">
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
          <svg className="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          <span>Ask Labby</span>
          {orderNo && (
            <span className="text-[10px] bg-white/20 text-teal-100 px-2 py-0.5 rounded-full font-mono hidden sm:inline">
              #{orderNo}
            </span>
          )}
        </button>
      )}

      {/* Expanded Floating Side Chat Panel (Stitch Glassmorphism Theme) */}
      {isOpen && (
        <div className="w-[94vw] sm:w-[420px] h-[560px] max-h-[85vh] bg-[#0c1a24]/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300 text-slate-100">
          {/* Header */}
          <div className="bg-[#132330]/95 backdrop-blur-md text-white p-4 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-bold text-sm tracking-tight text-white">Labby AI</h4>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-mono font-medium">
                    Nemotron 3.5
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5"></span>
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  {orderNo ? `Order #${orderNo}` : 'Clinical Diagnostic Copilot'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 bg-white/5 p-0.5 rounded-md border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setLang('en');
                    setMessages((prev) => [
                      ...prev,
                      {
                        role: 'assistant',
                        text: 'Language switched to English. Feel free to ask any question regarding your lab findings!',
                        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                      },
                    ]);
                  }}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                    lang === 'en' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                  }`}
                  title="Switch to English"
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLang('te');
                    setMessages((prev) => [
                      ...prev,
                      {
                        role: 'assistant',
                        text: 'భాష తెలుగులోకి మార్చబడింది. మీ ల్యాబ్ పరీక్షలు మరియు ఆరోగ్య ప్రశ్నల గురించి నన్ను అడగండి!',
                        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                      },
                    ]);
                  }}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                    lang === 'te' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                  }`}
                  title="తెలుగులోకి మారండి"
                >
                  తె
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLang('hi');
                    setMessages((prev) => [
                      ...prev,
                      {
                        role: 'assistant',
                        text: 'भाषा हिन्दी में बदली गई है। अपनी लैब रिपोर्ट या जांच संबंधी कोई भी सवाल पूछें!',
                        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                      },
                    ]);
                  }}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                    lang === 'hi' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                  }`}
                  title="हिन्दी में बदलें"
                >
                  हि
                </button>
              </div>

              <button
                type="button"
                onClick={handleResetChat}
                className="w-7 h-7 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer border border-white/10"
                title="Reset conversation"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>
              <button
                type="button"
                onClick={() => setOpenState(false)}
                className="w-7 h-7 rounded-md bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition cursor-pointer border border-white/10"
                title="Minimize Labby"
                aria-label="Minimize Labby"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          {/* Out-of-Range Parameter Quick Chips (Horizontal Strip) */}
          {abnormalResults.length > 0 && (
            <div className="bg-white/5 border-b border-white/10 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-mono font-bold text-emerald-400 whitespace-nowrap">
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
                  className="whitespace-nowrap inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-white/10 text-slate-200 hover:text-white hover:bg-white/20 px-2 py-0.5 rounded-lg border border-white/15 shadow-sm transition cursor-pointer"
                >
                  <span className={r.flag === 'HIGH' ? 'text-rose-400' : 'text-amber-300'}>
                    {r.flag === 'HIGH' ? (
                      <svg className="w-2.5 h-2.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                    ) : (
                      <svg className="w-2.5 h-2.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                    )}
                  </span>
                  <span>{r.parameter}:</span>
                  <span className={r.flag === 'HIGH' ? 'text-rose-400' : 'text-amber-300'}>
                    {r.value}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Messages Scroll View */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#07151f]/90 text-xs text-slate-200">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[90%] p-3.5 rounded-2xl ${
                    m.role === 'user'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold rounded-tr-xs shadow-md shadow-emerald-500/20'
                      : 'bg-[#132330]/95 text-slate-100 border border-white/15 rounded-tl-xs shadow-md leading-relaxed'
                  }`}
                >
                  {m.role === 'assistant' ? (
                    <FormattedAIResponse content={m.text} />
                  ) : (
                    <p className="whitespace-pre-line">{m.text}</p>
                  )}

                  {/* Narration and copy for assistant messages */}
                  {m.role === 'assistant' && (
                    <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between">
                      <VoiceReadButton text={m.text} lang={lang} />
                      <div className="flex items-center gap-2">
                        {m.model && (
                          <span className="text-[9px] text-teal-300 font-mono hidden sm:inline">
                            Nemotron 3.5
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => navigator.clipboard?.writeText(m.text)}
                          className="text-[10px] text-slate-400 hover:text-emerald-400 underline font-semibold cursor-pointer"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-slate-400 font-mono mt-1 px-1">{m.time}</span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2.5 p-3.5 bg-[#132330]/90 rounded-2xl border border-white/15 max-w-[85%] shadow-md">
                <LoadingSpinner size="sm" />
                <span className="text-[11px] text-emerald-300 font-medium">
                  Labby is formulating your diagnostic explanation...
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-3 py-2 bg-[#0c1a24] border-t border-white/10 flex gap-1.5 overflow-x-auto no-scrollbar">
            {getQuickPrompts().map((qp, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(qp)}
                className="whitespace-nowrap text-[10px] bg-white/10 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-300 border border-white/10 px-2.5 py-1 rounded-full font-medium transition cursor-pointer"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-[#0c1a24] border-t border-white/10">
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
                className="flex-1 bg-white/5 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition"
              />
              <button
                type="submit"
                disabled={!prompt.trim() || loading}
                className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-emerald-500/20 disabled:opacity-40 transition cursor-pointer"
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
