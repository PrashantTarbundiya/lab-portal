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
          className="text-sm font-medium text-gray-700 flex items-center justify-between"
        >
          <span>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
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
        className={`w-full rounded-lg border px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed ${
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
            : 'border-gray-300 focus:border-[#0F5E57] focus:ring-[#0F5E57]/20'
        }`}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600 font-medium" role="alert" aria-live="polite">
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs text-gray-500">{hint}</p>
      )}
    </div>
  );
}

