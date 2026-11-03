import { useEffect } from 'react';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative w-full ${maxWidth} bg-white rounded-2xl shadow-xl border border-gray-100 p-6 overflow-hidden z-10 transition-all`}
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1 text-xl leading-none"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

