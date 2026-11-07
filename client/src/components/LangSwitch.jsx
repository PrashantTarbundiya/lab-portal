import { useLanguage } from '../context/LanguageContext';

export default function LangSwitch({ className = '' }) {
  const { lang, setLang, languages } = useLanguage();

  return (
    <div
      className={`inline-flex items-center rounded-xl border border-white/15 bg-[#0a1824]/90 backdrop-blur-xl p-0.5 shadow-sm select-none ${className}`}
      role="group"
      aria-label="Language Selector"
    >
      {Object.entries(languages).map(([code, label]) => {
        const isActive = lang === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            className={`px-2.5 py-1 text-[11px] sm:text-xs rounded-lg transition-all cursor-pointer font-sans ${
              isActive
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/10 font-semibold'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

