export default function StatusChip({ status, isHeld = false }) {
  if (isHeld) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
        Held: lab will call
      </span>
    );
  }

  const s = String(status || '').toUpperCase();

  switch (s) {
    case 'SIGNED':
    case 'READY':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Ready
        </span>
      );
    case 'PROCESSING':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
          Processing
        </span>
      );
    case 'EXPIRED':
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/25 text-rose-300 border border-rose-500/45">
          <span className="w-2 h-2 rounded-full bg-rose-400"></span>
          Expired
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-bold bg-white/10 text-slate-300 border border-white/15">
          {status}
        </span>
      );
  }
}

