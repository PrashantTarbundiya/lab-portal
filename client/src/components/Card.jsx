export default function Card({
  children,
  className = '',
  onClick,
  hoverable = false,
  padding = 'p-6',
}) {
  const clickable = hoverable || onClick
    ? 'cursor-pointer hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 transition-all'
    : '';

  return (
    <div
      onClick={onClick}
      className={`glass-card rounded-2xl border border-white/10 text-slate-200 shadow-xl ${padding} ${clickable} ${className}`}
    >
      {children}
    </div>
  );
}

