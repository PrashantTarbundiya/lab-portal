import { useLanguage } from '../context/LanguageContext';

export default function LangSwitch({ className = '' }) {
  const { lang, setLang, languages } = useLanguage();

  return (
    <div className={`inline-flex rounded-lg border border-gray-200 bg-white p-0.5 shadow-sm ${className}`}>
      {Object.entries(languages).map(([code, label]) => {
        const isActive = lang === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all select-none ${
              isActive
                ? 'bg-[#0F5E57] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

