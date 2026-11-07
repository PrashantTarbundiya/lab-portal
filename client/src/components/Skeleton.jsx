export function SkeletonCard() {
  return (
    <div className="bg-[#0c1a24]/80 rounded-2xl border border-white/10 p-6 shadow-xl animate-pulse space-y-4">
      <div className="h-5 bg-white/10 rounded-lg w-1/3"></div>
      <div className="h-4 bg-white/5 rounded-lg w-2/3"></div>
      <div className="h-4 bg-white/5 rounded-lg w-1/2"></div>
      <div className="h-10 bg-white/10 rounded-xl w-full mt-4"></div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="border border-white/10 rounded-2xl bg-[#0c1a24]/80 shadow-xl overflow-hidden animate-pulse">
      <div className="bg-white/5 h-11 border-b border-white/10"></div>
      <div className="divide-y divide-white/5">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-4 flex gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="h-4 bg-white/5 rounded-lg flex-1"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonText({ lines = 3 }) {
  return (
    <div className="space-y-2.5 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 bg-white/10 rounded-lg ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
        ></div>
      ))}
    </div>
  );
}

export default function Skeleton({ className = 'h-4 w-full' }) {
  return <div className={`bg-white/10 rounded-lg animate-pulse ${className}`} />;
}

