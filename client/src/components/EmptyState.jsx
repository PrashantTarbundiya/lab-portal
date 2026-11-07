import Button from './Button';

export default function EmptyState({
  title = 'No reports yet',
  description = 'When your diagnostic reports are ready, they will appear here.',
  actionLabel,
  onAction,
  icon,
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-[#0c1a24]/90 backdrop-blur-xl border border-dashed border-white/15 rounded-3xl max-w-lg mx-auto shadow-2xl">
      <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-emerald-400 mb-4 shadow-sm">
        {icon || (
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
      </div>
      <h3 className="text-lg font-bold text-white font-display mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-300 max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

