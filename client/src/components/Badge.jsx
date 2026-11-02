export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
}) {
  const variants = {
    default: 'bg-gray-100 text-gray-800 border-gray-200',
    success: 'bg-[#DCFCE7] text-[#166534] border-green-200', // ok #166534 on #DCFCE7
    warning: 'bg-[#FEF3C7] text-[#B45309] border-amber-200', // low/high #B45309 on #FEF3C7
    danger: 'bg-[#FEE2E2] text-[#B91C1C] border-red-200',    // critical #B91C1C on #FEE2E2
    info: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variants[variant] || variants.default} ${sizes[size] || sizes.md} ${className}`}
    >
      {children}
    </span>
  );
}
