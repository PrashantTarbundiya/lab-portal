import Button from './Button';

export default function ErrorState({
  title = 'Something went wrong',
  description = 'We encountered an error loading this information. Please try again.',
  retryLabel = 'Try again',
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-white border border-red-200 rounded-2xl max-w-lg mx-auto">
      <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center text-red-600 mb-4">
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

