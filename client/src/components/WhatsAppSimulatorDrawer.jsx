import { useState } from 'react';

export default function WhatsAppSimulatorDrawer({
  isOpen,
  onClose,
  order,
  facilityName = 'Apollo Specialty Hospital',
}) {
  const [templateLang, setTemplateLang] = useState('EN'); // 'EN' | 'TE' | 'HI'
  const [simulatedChat, setSimulatedChat] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [deliveryTick, setDeliveryTick] = useState('READ'); // 'SENT' | 'DELIVERED' | 'READ'

  if (!isOpen || !order) return null;

  const patientName = order.patient?.name || order.patientName || 'Lakshmi Prasanna K';
  const orderNo = order.orderNo || order.id || 'ORD-71250';
  const phone = order.patient?.mobileE164 || order.mobile || '+91 90000 00001';
  const reportLink = `https://labora.health/r/tok_${orderNo.toLowerCase()}`;
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Multi-Language WhatsApp Official Templates
  const templates = {
    EN: {
      greeting: `Namaste ${patientName},`,
      body: `Your official diagnostic test reports from *${facilityName}* (Order: *${orderNo}*) have been certified by our Consultant Pathologist and are now ready.`,
      testsLabel: 'Tests Included',
      tests: 'Complete Blood Picture (CBC), Serum Ferritin, HbA1c',
      pinNotice: `*Access PIN / OTP:* Your one-time verification code is *4821*.`,
      expiryNotice: `This secure link adheres to Indian DPDP Act 2023 & NABL ISO 15189 encryption standards and remains active for 72 hours.`,
      buttonPdf: 'View & Download Report (PDF)',
      buttonAi: 'Ask Labby AI (Explainer)',
      buttonSupport: 'Connect with Lab Helpdesk',
    },
    TE: {
      greeting: `నమస్కారం ${patientName} గారు,`,
      body: `*${facilityName}* నుండి మీ ల్యాబ్ పరీక్ష నివేదిక (ఆర్డర్: *${orderNo}*) సిద్ధంగా ఉంది. పాథాలజిస్ట్ చేత ధృవీకరించబడింది.`,
      testsLabel: 'పరీక్షలు',
      tests: 'కంప్లీట్ బ్లడ్ పిక్చర్ (CBC), సీరం ఫెర్రిటిన్, HbA1c',
      pinNotice: `*OTP పిన్:* మీ సురక్షిత కోడ్ *4821*.`,
      expiryNotice: `ఈ లింక్ 72 గంటల పాటు చెల్లుబాటులో ఉంటుంది. భారతీయ DPDP చట్టం 2023 ప్రకారం ఎన్‌క్రిప్ట్ చేయబడింది.`,
      buttonPdf: 'రిపోర్ట్ డౌన్‌లోడ్ చేసుకోండి (PDF)',
      buttonAi: 'ల్యాబీ AI వివరణ పొందండి',
      buttonSupport: 'సహాయం కోసం చాట్ చేయండి',
    },
    HI: {
      greeting: `नमस्ते ${patientName} जी,`,
      body: `*${facilityName}* से आपकी जांच रिपोर्ट (ऑर्डर: *${orderNo}*) हमारे कंसल्टेंट पैथोलॉजिस्ट द्वारा प्रमाणित कर दी गई है और तैयार है।`,
      testsLabel: 'शामिल परीक्षण',
      tests: 'कम्प्लीट ब्लड काउंट (CBC), सीरम फेरिटिन, HbA1c',
      pinNotice: `*सुरक्षा पिन / OTP:* आपका सत्यापन कोड *4821* है।`,
      expiryNotice: `यह लिंक 72 घंटों के लिए सक्रिय है। DPDP अधिनियम 2023 और NABL मानकों के तहत सुरक्षित है।`,
      buttonPdf: 'रिपोर्ट देखें और डाउनलोड करें (PDF)',
      buttonAi: 'लैबी AI से समझें',
      buttonSupport: 'लैब हेल्पडेस्क से बात करें',
    },
  };

  const t = templates[templateLang];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = {
      sender: 'PATIENT',
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setSimulatedChat((prev) => [...prev, userMsg]);
    setChatInput('');

    // Automated WhatsApp Business Chatbot response
    setTimeout(() => {
      let botReply = "Thank you for reaching out! Our medical desk at " + facilityName + " has received your query. A duty coordinator will connect with you shortly.";
      if (userMsg.text.toLowerCase().includes('time') || userMsg.text.toLowerCase().includes('timing')) {
        botReply = "Our collection centers are open 07:00 AM to 08:30 PM everyday. Sample pickup is available 24x7 for emergencies.";
      } else if (userMsg.text.toLowerCase().includes('fasting') || userMsg.text.toLowerCase().includes('sugar')) {
        botReply = "For fasting blood sugar and lipid profile, 8-10 hours of overnight fasting with water allowed is advised.";
      }
      setSimulatedChat((prev) => [
        ...prev,
        {
          sender: 'BOT',
          text: botReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in">
      {/* Backdrop overlay dismiss */}
      <div className="flex-1" onClick={onClose}></div>

      {/* Slide-Over Drawer Container */}
      <div className="w-full max-w-md sm:max-w-lg bg-[#07131d] border-l border-emerald-500/30 text-white shadow-2xl flex flex-col h-full relative z-10 overflow-hidden">
        {/* Drawer Header Toolbar */}
        <div className="p-4 bg-[#0c1e2b] border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 font-bold">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                Front Desk Simulator
              </span>
              <h3 className="text-sm font-display font-black text-white">
                WhatsApp Business API Preview
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Template Language Selector */}
            <div className="flex items-center bg-black/40 rounded-xl p-0.5 border border-white/10 text-[10px] font-mono font-bold">
              <button
                type="button"
                onClick={() => setTemplateLang('EN')}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                  templateLang === 'EN' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setTemplateLang('TE')}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                  templateLang === 'TE' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400'
                }`}
              >
                తెలుగు
              </button>
              <button
                type="button"
                onClick={() => setTemplateLang('HI')}
                className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                  templateLang === 'HI' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400'
                }`}
              >
                हिंदी
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Operational Status Pill */}
        <div className="px-4 py-2 bg-[#0a1824] border-b border-white/5 flex items-center justify-between text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-slate-400">Recipient:</span>
            <strong className="text-white">{patientName}</strong>
            <span className="text-emerald-400">({phone})</span>
          </div>
          <span className="text-emerald-400 font-mono text-[10px] font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
            ● Meta Cloud API Active
          </span>
        </div>

        {/* Smartphone Realistic Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex justify-center bg-gradient-to-b from-[#050e15] to-[#081520]">
          {/* Phone Frame */}
          <div className="w-full max-w-[380px] bg-[#0b141a] rounded-[36px] border-4 border-slate-700/60 shadow-2xl overflow-hidden flex flex-col h-[650px] relative">
            {/* Phone Notch & Status Bar */}
            <div className="bg-[#0b141a] px-6 py-2.5 flex items-center justify-between text-[11px] text-slate-400 font-mono shrink-0 border-b border-white/5">
              <span>{nowTime}</span>
              <div className="w-20 h-4 bg-black rounded-full mx-auto"></div>
              <div className="flex items-center gap-2">
                <span>5G</span>
                <svg className="w-3.5 h-3.5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 18.25l1.41 1.41.64-.64C7.93 20.26 9.88 21 12 21s4.07-.74 5.61-1.97l.64.64 1.41-1.41-.64-.64C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9zm0 2c3.87 0 7 3.13 7 7 0 1.62-.55 3.12-1.49 4.31L7.69 6.49C8.88 5.55 10.38 5 12 5zm-7 7c0-1.62.55-3.12 1.49-4.31l9.82 9.82C15.12 18.45 13.62 19 12 19c-3.87 0-7-3.13-7-7z"/>
                </svg>
                <span className="font-mono text-[10px]">94%</span>
              </div>
            </div>

            {/* WhatsApp App Bar */}
            <div className="bg-[#1f2c34] px-3.5 py-2.5 flex items-center justify-between gap-2.5 shrink-0 border-b border-white/10 shadow-sm">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold text-sm shadow-inner relative">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  {/* Verified Badge */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#1f2c34] flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white tracking-tight">Labora Diagnostics</span>
                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  </div>
                  <span className="text-[10px] text-slate-400 block">Official Business Account</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-slate-300 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                <span>⋮</span>
              </div>
            </div>

            {/* WhatsApp Chat Background with Wallpaper pattern */}
            <div
              className="flex-1 overflow-y-auto p-3 space-y-3"
              style={{
                backgroundColor: '#0b141a',
                backgroundImage:
                  'radial-gradient(#1f2c34 1px, transparent 1px), radial-gradient(#1f2c34 1px, #0b141a 1px)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 10px 10px',
              }}
            >
              {/* Security Encryption Pill */}
              <div className="flex justify-center">
                <span className="bg-[#182229] text-amber-200/90 text-[9px] px-3 py-1.5 rounded-lg border border-amber-500/20 shadow-xs text-center max-w-[280px] leading-tight font-mono flex items-center justify-center gap-1.5">
                  <svg className="w-3 h-3 text-amber-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Messages to this business are end-to-end encrypted under Indian DPDP Act 2023.</span>
                </span>
              </div>

              {/* Official Template Card Bubble */}
              <div className="max-w-[320px] rounded-2xl rounded-tl-xs bg-[#202c33] border border-white/10 text-white p-3 space-y-2.5 shadow-md">
                {/* Header Banner Image Placeholder */}
                <div className="h-24 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-900 border border-white/10 p-2.5 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[10px] font-mono text-emerald-200">
                    <span>LABORA NABL ISO 15189</span>
                    <span className="bg-emerald-500/30 px-1.5 py-0.5 rounded text-[8px] font-bold">CERTIFIED</span>
                  </div>
                  <div>
                    <span className="text-xs font-display font-black text-white block">Official Medical Report</span>
                    <span className="text-[10px] text-slate-200">{facilityName}</span>
                  </div>
                </div>

                {/* Message Body */}
                <div className="text-[11px] text-slate-100 space-y-2 leading-relaxed">
                  <p className="font-semibold text-white">{t.greeting}</p>
                  <p>{t.body}</p>

                  <div className="p-2 rounded-lg bg-black/30 border border-white/5 space-y-1 font-mono text-[10px]">
                    <div className="text-emerald-300 font-bold">{t.testsLabel}:</div>
                    <div className="text-slate-300">{t.tests}</div>
                  </div>

                  <p className="text-amber-300 text-[10px] font-mono">{t.pinNotice}</p>
                  <p className="text-[9px] text-slate-400 leading-tight">{t.expiryNotice}</p>
                </div>

                {/* Time & Read Ticks */}
                <div className="flex items-center justify-end gap-1 text-[9px] text-slate-400 font-mono pt-1">
                  <span>{nowTime}</span>
                  <span className="text-sky-400 font-bold inline-flex items-center">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7m-5 0l4 4L23 7" /></svg>
                  </span>
                </div>

                {/* Meta WhatsApp Interactive CTA Buttons */}
                <div className="pt-2 border-t border-white/10 space-y-1.5">
                  <a
                    href={reportLink}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 px-3 rounded-xl bg-[#00a884] hover:bg-[#008f72] text-slate-950 font-black text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
                  >
                    <span>{t.buttonPdf}</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setSimulatedChat((prev) => [
                        ...prev,
                        { sender: 'PATIENT', text: 'Tell me about my report in plain language', time: nowTime },
                        {
                          sender: 'BOT',
                          text: `Labby AI Summary for ${patientName}: Your HbA1c is 6.2% (pre-diabetes range). CBC indices are normal. Fasting glucose adherence recommended.`,
                          time: nowTime,
                        },
                      ]);
                    }}
                    className="w-full py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-emerald-300 font-bold text-[10px] flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <span>{t.buttonAi}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSimulatedChat((prev) => [
                        ...prev,
                        { sender: 'PATIENT', text: 'I want to schedule a doctor consultation for this report', time: nowTime },
                        {
                          sender: 'BOT',
                          text: `Certainly! Front desk coordinator at ${facilityName} has been assigned. You can reach the desk directly at +91 866 245 9000.`,
                          time: nowTime,
                        },
                      ]);
                    }}
                    className="w-full py-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-semibold text-[10px] flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <span>{t.buttonSupport}</span>
                  </button>
                </div>
              </div>

              {/* Patient Replies and Interactive Chat Stream */}
              {simulatedChat.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'PATIENT' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[280px] p-2.5 rounded-2xl text-[11px] shadow-sm leading-relaxed ${
                      msg.sender === 'PATIENT'
                        ? 'bg-[#005c4b] text-white rounded-tr-xs'
                        : 'bg-[#202c33] text-slate-100 rounded-tl-xs border border-white/5'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <div className="flex items-center justify-end gap-1 text-[8px] text-slate-300/80 font-mono pt-1">
                      <span>{msg.time}</span>
                      {msg.sender === 'PATIENT' && (
                        <span className="text-sky-300 font-bold inline-flex items-center">
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7m-5 0l4 4L23 7" /></svg>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* WhatsApp Interactive Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="bg-[#1f2c34] p-2 flex items-center gap-2 shrink-0 border-t border-white/10"
            >
              <button type="button" className="text-slate-400 hover:text-white p-1" aria-label="Attachment">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
              </button>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message as patient..."
                className="flex-1 bg-[#2a3942] text-white text-xs px-3 py-1.5 rounded-2xl border-none focus:outline-none focus:ring-1 focus:ring-emerald-400 placeholder-slate-400 font-sans"
              />
              <button
                type="submit"
                className="w-8 h-8 rounded-full bg-[#00a884] hover:bg-[#008f72] text-slate-950 flex items-center justify-center shadow-sm transition active:scale-95 cursor-pointer"
                aria-label="Send message"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </form>
          </div>
        </div>

        {/* Footer Audit Bar */}
        <div className="p-3 bg-[#0a1824] border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 font-mono shrink-0">
          <div className="flex items-center gap-2">
            <span>Webhook: <strong>HTTP 200 OK</strong></span>
            <span>•</span>
            <span className="text-emerald-400 font-bold inline-flex items-center gap-1">
              <span>Delivery Status: READ</span>
              <svg className="w-3 h-3 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7m-5 0l4 4L23 7" /></svg>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSimulatedChat([])}
            className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
          >
            Reset Simulator
          </button>
        </div>
      </div>
    </div>
  );
}

