export default function Card({
  children,
  className = '',
  onClick,
  hoverable = false,
  padding = 'p-6',
}) {
  const clickable = hoverable || onClick
    ? 'cursor-pointer hover:border-gray-300 hover:shadow-md transition-all'
    : '';

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-200 shadow-sm ${padding} ${clickable} ${className}`}
    >
      {children}
    </div>
  );
}
