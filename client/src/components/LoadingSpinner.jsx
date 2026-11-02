export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 p-4 ${className}`}>
      <div
        className={`${sizes[size] || sizes.md} border-[#0F5E57] border-t-transparent rounded-full animate-spin`}
      />
      <span className="text-xs font-medium text-gray-500">Loading...</span>
    </div>
  );
}
