export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  fullWidth = false,
  ...props
}) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black shadow-md shadow-emerald-500/25 focus:ring-emerald-400',
    secondary: 'bg-white/10 hover:bg-white/20 text-white border border-white/15 focus:ring-white/20',
    ghost: 'bg-transparent hover:bg-white/10 text-slate-200 focus:ring-white/20',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white focus:ring-rose-500',
    outlineDanger: 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 focus:ring-rose-500',
  };

  // 48px minimum tap target height on mobile for patient accessibility
  const sizes = {
    sm: 'text-sm px-3 py-1.5 min-h-[36px]',
    md: 'text-base px-5 py-3 min-h-[48px]',
    lg: 'text-lg px-6 py-3.5 min-h-[52px]',
  };

  const width = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${width} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span>Loading…</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

