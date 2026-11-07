import { useEffect } from 'react';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = null,
  size = 'md',
}) {
  const sizeMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
    '2xl': 'max-w-4xl',
    '3xl': 'max-w-5xl',
    '4xl': 'max-w-6xl',
    full: 'max-w-[95vw]',
  };

  const resolvedWidth = maxWidth || sizeMap[size] || 'max-w-md';

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto modal-container print:static print:z-auto print:overflow-visible print:p-0 print:m-0">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity modal-backdrop print:hidden"
        onClick={onClose}
      />

      {/* Modal Dialog (Stitch Glassmorphism Container) */}
      <div className="flex min-h-full items-center justify-center p-4 modal-wrapper print:block print:p-0 print:m-0 print:min-h-0">
        <div
          className={`relative w-full ${resolvedWidth} bg-[#0c1a24]/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-7 overflow-hidden z-10 text-slate-100 transition-all animate-fadeIn modal-content print:relative print:w-full print:max-w-none print:bg-transparent print:border-0 print:p-0 print:m-0 print:shadow-none print:overflow-visible print:rounded-none`}
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5 print:hidden">
              <h3 className="text-lg sm:text-xl font-display font-black text-white tracking-tight">{title}</h3>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white hover:bg-white/10 rounded-xl p-1.5 transition-colors cursor-pointer flex items-center justify-center"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

