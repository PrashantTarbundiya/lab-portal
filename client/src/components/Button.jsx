export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  fullWidth = false,
  ...props
}) {
  const base = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const variants = {
    primary: 'bg-[#0F5E57] hover:bg-[#0c4b45] text-white focus:ring-[#0F5E57]',
    secondary: 'bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 focus:ring-gray-400',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    outlineDanger: 'bg-white hover:bg-red-50 text-red-600 border border-red-300 focus:ring-red-400',
  };

  // 48px minimum tap target height on mobile for patient accessibility
  const sizes = {
    sm: 'text-sm px-3 py-1.5 min-h-[36px]',
    md: 'text-base px-5 py-3 min-h-[48px]',
    lg: 'text-lg px-6 py-3.5 min-h-[52px]',
  };

  const width = fullWidth ? 'w-full' : '';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${width} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span>Loading…</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

