export default function Table({
  columns = [],
  data = [],
  keyField = 'id',
  onRowClick,
  emptyMessage = 'No data available',
}) {
  return (
    <div className="w-full overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-sm">
      <table className="w-full text-left text-sm text-gray-700">
        <thead className="bg-[#F7F8FA] text-xs uppercase font-semibold text-gray-500 border-b border-gray-200">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                scope="col"
                className={`px-4 py-3.5 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-10 text-center text-gray-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={row[keyField] || rowIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : 'hover:bg-gray-50/50'}`}
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    className={`px-4 py-3.5 tabular-nums ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.className || ''}`}
                  >
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

