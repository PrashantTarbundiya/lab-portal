import Button from './Button';

export default function ErrorState({
  title = 'Something went wrong',
  description = 'We encountered an error loading this information. Please try again.',
  retryLabel = 'Try again',
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-[#0c1a24]/90 backdrop-blur-xl border border-rose-500/30 rounded-3xl max-w-lg mx-auto shadow-2xl">
      <div className="w-14 h-14 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-center justify-center text-rose-400 mb-4 shadow-sm">
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-white font-display mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-300 max-w-sm mb-6">{description}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

