export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) {
  const variants = {
    default: 'bg-white/10 text-slate-200 border-white/15',
    success: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs',
    warning: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs',
    danger: 'bg-rose-500/25 text-rose-300 border-rose-500/45 shadow-xs',
    info: 'bg-teal-500/20 text-teal-300 border-teal-500/40 shadow-xs',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-bold font-mono rounded-full border ${variants[variant] || variants.default} ${sizes[size] || sizes.md} ${className}`}
    >
      {children}
    </span>
  );
}

