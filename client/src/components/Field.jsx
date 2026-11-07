export default function Field({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  hint,
  disabled = false,
  required = false,
  className = '',
  inputMode,
  autoComplete,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-mono font-bold text-slate-300 flex items-center justify-between"
        >
          <span>
            {label}
            {required && <span className="text-rose-400 ml-1">*</span>}
          </span>
        </label>
      )}
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        inputMode={inputMode}
        autoComplete={autoComplete}
        className={`w-full rounded-2xl border px-4 py-3 text-sm text-white bg-[#07151f]/90 placeholder-slate-400 focus:outline-none focus:ring-1 transition-colors shadow-inner disabled:opacity-50 disabled:cursor-not-allowed ${
          error
            ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-400'
            : 'border-white/20 focus:border-emerald-400 focus:ring-emerald-400'
        }`}
        {...props}
      />
      {error && (
        <p className="text-xs text-rose-400 font-medium" role="alert" aria-live="polite">
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs text-slate-400">{hint}</p>
      )}
    </div>
  );
}

