export default function StatusChip({ status, isHeld = false }) {
  if (isHeld) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
        Held: lab will call
      </span>
    );
  }

  const s = String(status || '').toUpperCase();

  switch (s) {
    case 'SIGNED':
    case 'READY':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Ready
        </span>
      );
    case 'PROCESSING':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-300">
          <span className="w-2 h-2 rounded-full bg-gray-400"></span>
          Processing
        </span>
      );
    case 'EXPIRED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          Expired
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
          {status}
        </span>
      );
  }
}

