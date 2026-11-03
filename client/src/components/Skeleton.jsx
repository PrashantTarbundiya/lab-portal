export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm animate-pulse space-y-4">
      <div className="h-5 bg-gray-200 rounded w-1/3"></div>
      <div className="h-4 bg-gray-100 rounded w-2/3"></div>
      <div className="h-4 bg-gray-100 rounded w-1/2"></div>
      <div className="h-10 bg-gray-200 rounded-lg w-full mt-4"></div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden animate-pulse">
      <div className="bg-gray-100 h-10 border-b border-gray-200"></div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-4 flex gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="h-4 bg-gray-100 rounded flex-1"></div>
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
          className={`h-4 bg-gray-200 rounded ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
        ></div>
      ))}
    </div>
  );
}

export default function Skeleton({ className = 'h-4 w-full' }) {
  return <div className={`bg-gray-200 rounded animate-pulse ${className}`} />;
}

