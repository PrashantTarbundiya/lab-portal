import { useState } from 'react';

export default function PreTestGuide({ lang = 'en' }) {
  const [isOpen, setIsOpen] = useState(false);

  const GUIDELINES = [
    {
      icon: '⏰',
      title: lang === 'te' ? 'ఉపవాస నియమాలు (Fasting)' : lang === 'hi' ? 'उपवास के नियम' : 'Fasting Guidelines (8-10 Hours)',
      detail: lang === 'te'
        ? 'షుగర్ (Fasting Glucose) లేదా లిపిడ్ ప్రొఫైల్ పరీక్షలకు 8 నుండి 10 గంటల ఉపవాసం అవసరం. నీరు తాగడం పూర్తిగా సురక్షితం.'
        : lang === 'hi'
        ? 'फास्टिंग ग्लूकोज या लिपिड प्रोफाइल के लिए 8-10 घंटे का उपवास आवश्यक है। पानी पीना सुरक्षित है।'
        : 'Tests like Fasting Blood Glucose and Lipid Profile require 8–10 hours of overnight fasting. Plain water is permitted and encouraged.',
    },
    {
      icon: '💧',
      title: lang === 'te' ? 'తగినంత నీరు తాగడం' : lang === 'hi' ? 'भरपूर पानी पिएं' : 'Stay Hydrated Before Blood Draw',
      detail: lang === 'te'
        ? 'రక్త సేకరణకు ముందు బాగా నీరు తాగడం వల్ల నరాలు స్పష్టంగా కనిపిస్తాయి మరియు రక్త సేకరణ నొప్పి లేకుండా సులభంగా జరుగుతుంది.'
        : lang === 'hi'
        ? 'रक्त का नमूना देने से पहले पर्याप्त पानी पीने से नसें आसानी से मिल जाती हैं और प्रक्रिया सुगम होती है।'
        : 'Drinking water prior to venipuncture increases blood volume, making veins plump and easy to locate for a gentle, painless draw.',
    },
    {
      icon: '📊',
      title: lang === 'te' ? 'రిఫరెన్స్ పరిధిని అర్థం చేసుకోవడం' : lang === 'hi' ? 'सामान्य सीमा को समझें' : 'Understanding Reference Intervals',
      detail: lang === 'te'
        ? 'రిఫరెన్స్ పరిధి 95% ఆరోగ్యవంతమైన వ్యక్తుల సగటును సూచిస్తుంది. కొద్దిపాటి తేడాలు సాధారణమే, మీ డాక్టర్ సలహా తీసుకోండి.'
        : lang === 'hi'
        ? 'संदर्भ सीमा 95% स्वस्थ आबादी का औसत दर्शाती है। मामूली भिन्नता सामान्य हो सकती है।'
        : 'Reference intervals cover 95% of a healthy benchmark population. Mild variations outside this range do not necessarily signify illness—always interpret them in clinical context with your physician.',
    },
    {
      icon: '🩺',
      title: lang === 'te' ? 'వైద్యుల సంప్రదింపు సూచన' : lang === 'hi' ? 'चिकित्सक परामर्श' : 'Discussing Results With Your Physician',
      detail: lang === 'te'
        ? 'ఏదైనా అసాధారణ ఫలితం ఉంటే ల్యాబీ AI సలహాను తీసుకుని, మీ పూర్తి రిపోర్ట్‌ను డాక్టర్‌కు చూపించండి.'
        : lang === 'hi'
        ? 'असामान्य परिणामों के लिए लैब AI से समझें और पूरी रिपोर्ट अपने डॉक्टर को दिखाएं।'
        : 'Bring this digital report or downloaded PDF to your consultation. Use Labby AI’s checklist for specific questions tailored to your results.',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50/70 transition cursor-pointer text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-lg text-[#0F5E57]">
            💡
          </span>
          <div>
            <h4 className="font-bold text-gray-900 text-sm">
              {lang === 'te' ? 'రోగుల అవగాహన & పరీక్షల మార్గదర్శకాలు' : lang === 'hi' ? 'मरीजों के लिए स्वास्थ्य दिशानिर्देश' : 'Patient Health & Test Preparation Guide'}
            </h4>
            <p className="text-[11px] text-gray-500">
              {lang === 'te' ? 'ఉపవాసం, రిఫరెన్స్ పరిధి & వైద్యుల సలహాలు' : lang === 'hi' ? 'उपवास, संदर्भ सीमा और परीक्षण युक्तियाँ' : 'Fasting duration, reference ranges & consultation tips'}
            </p>
          </div>
        </div>

        <span className="text-gray-400 font-bold text-sm transform transition-transform duration-200">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            {GUIDELINES.map((g, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-gray-50/80 border border-gray-200/70 space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs text-gray-900">
                  <span>{g.icon}</span>
                  <span>{g.title}</span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  {g.detail}
                </p>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-100 flex items-center justify-between text-xs text-[#0F5E57]">
            <span>📞 24x7 Diagnostics Helpline: <strong>1800-425-LABS</strong> (Toll Free)</span>
            <span className="font-semibold text-[11px]">Vijayawada Central Lab</span>
          </div>
        </div>
      )}
    </div>
  );
}
