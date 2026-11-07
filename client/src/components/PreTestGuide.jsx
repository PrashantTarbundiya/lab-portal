import { useState } from 'react';

export default function PreTestGuide({ lang = 'en' }) {
  const [isOpen, setIsOpen] = useState(false);

  const GUIDELINES = [
    {
      id: 'fasting',
      title: lang === 'te' ? 'ఉపవాస నియమాలు (Fasting)' : lang === 'hi' ? 'उपवास के नियम' : 'Fasting Guidelines (8-10 Hours)',
      detail: lang === 'te'
        ? 'షుగర్ (Fasting Glucose) లేదా లిపిడ్ ప్రొఫైల్ పరీక్షలకు 8 నుండి 10 గంటల ఉపవాసం అవసరం. నీరు తాగడం పూర్తిగా సురక్షితం.'
        : lang === 'hi'
        ? 'फास्टिंग ग्लूकोज या लिपिड प्रोफाइल के लिए 8-10 घंटे का उपवास आवश्यक है। पानी पीना सुरक्षित है।'
        : 'Tests like Fasting Blood Glucose and Lipid Profile require 8–10 hours of overnight fasting. Plain water is permitted and encouraged.',
    },
    {
      id: 'hydration',
      title: lang === 'te' ? 'తగినంత నీరు తాగడం' : lang === 'hi' ? 'भरपूर पानी पिएं' : 'Stay Hydrated Before Blood Draw',
      detail: lang === 'te'
        ? 'రక్త సేకరణకు ముందు బాగా నీరు తాగడం వల్ల నరాలు స్పష్టంగా కనిపిస్తాయి మరియు రక్త సేకరణ నొప్పి లేకుండా సులభంగా జరుగుతుంది.'
        : lang === 'hi'
        ? 'रक्त का नमूना देने से पहले पर्याप्त पानी पीने से नसें आसानी से मिल जाती हैं और प्रक्रिया सुगम होती है।'
        : 'Drinking water prior to venipuncture increases blood volume, making veins plump and easy to locate for a gentle, painless draw.',
    },
    {
      id: 'intervals',
      title: lang === 'te' ? 'రిఫరెన్స్ పరిధిని అర్థం చేసుకోవడం' : lang === 'hi' ? 'सामान्य सीमा को समझें' : 'Understanding Reference Intervals',
      detail: lang === 'te'
        ? 'రిఫరెన్స్ పరిధి 95% ఆరోగ్యవంతమైన వ్యక్తుల సగటును సూచిస్తుంది. కొద్దిపాటి తేడాలు సాధారణమే, మీ డాక్టర్ సలహా తీసుకోండి.'
        : lang === 'hi'
        ? 'संदर्भ सीमा 95% स्वस्थ आबादी का औसत दर्शाती है। मामूली भिन्नता सामान्य हो सकती है।'
        : 'Reference intervals cover 95% of a healthy benchmark population. Mild variations outside this range do not necessarily signify illness—always interpret them in clinical context with your physician.',
    },
    {
      id: 'doctor',
      title: lang === 'te' ? 'వైద్యుల సంప్రదింపు సూచన' : lang === 'hi' ? 'चिकित्सक परामर्श' : 'Discussing Results With Your Physician',
      detail: lang === 'te'
        ? 'ఏదైనా అసాధారణ ఫలితం ఉంటే ల్యాబీ AI సలహాను తీసుకుని, మీ పూర్తి రిపోర్ట్‌ను డాక్టర్‌కు చూపించండి.'
        : lang === 'hi'
        ? 'असामान्य परिणामों के लिए लैब AI से समझें और पूरी रिपोर्ट अपने डॉक्टर को दिखाएं।'
        : 'Bring this digital report or downloaded PDF to your consultation. Use Labby AI’s checklist for specific questions tailored to your results.',
    },
  ];

  const renderIcon = (id) => {
    switch (id) {
      case 'fasting':
        return <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case 'hydration':
        return <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
      case 'intervals':
        return <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
      case 'doctor':
      default:
        return <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
    }
  };

  return (
    <div className="glass-card rounded-2xl border border-white/10 shadow-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition cursor-pointer text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
          </span>
          <div>
            <h4 className="font-bold text-white text-sm font-display">
              {lang === 'te' ? 'రోగుల అవగాహన & పరీక్షల మార్గదర్శకాలు' : lang === 'hi' ? 'मरीजों के लिए स्वास्थ्य दिशानिर्देश' : 'Patient Health & Test Preparation Guide'}
            </h4>
            <p className="text-[11px] text-slate-400">
              {lang === 'te' ? 'ఉపవాసం, రిఫరెన్స్ పరిధి & వైద్యుల సలహాలు' : lang === 'hi' ? 'उपवास, संदर्भ सीमा और परीक्षण युक्तियाँ' : 'Fasting duration, reference ranges & consultation tips'}
            </p>
          </div>
        </div>

        <svg className={`w-4 h-4 text-slate-400 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-1 border-t border-white/10 space-y-3 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            {GUIDELINES.map((g) => (
              <div key={g.id} className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs text-white">
                  <span>{renderIcon(g.id)}</span>
                  <span>{g.title}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {g.detail}
                </p>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-between text-xs text-teal-300 font-mono">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              <span>24x7 Diagnostics Helpline: <strong className="text-white">1800-425-LABS</strong> (Toll Free)</span>
            </span>
            <span className="font-semibold text-[11px] text-slate-400">Vijayawada Central Lab</span>
          </div>
        </div>
      )}
    </div>
  );
}

