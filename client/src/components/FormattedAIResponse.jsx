import React from 'react';

/**
 * Parses inline formatting like **bold**, *italic*, and `code`
 */
function renderInlineText(text) {
  if (!text) return null;

  // Split by **bold** first
  const parts = [];
  const boldRegex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(
      <strong key={match.index} className="font-bold text-gray-950">
        {match[1]}
      </strong>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // Clean any stray asterisks or hash symbols that might remain
  return parts.map((part, i) => {
    if (typeof part === 'string') {
      const cleaned = part
        .replace(/^[#\s]+/, '') // strip leading hashes
        .replace(/[*_~`]/g, ''); // strip stray formatting characters
      return <React.Fragment key={i}>{cleaned}</React.Fragment>;
    }
    return part;
  });
}

/**
 * Formats Markdown tables, headers, lists, and bold text cleanly into Tailwind HTML
 */
export default function FormattedAIResponse({ content = '', className = '' }) {
  if (!content) return null;

  const rawLines = content.split('\n');
  const elements = [];
  let index = 0;

  while (index < rawLines.length) {
    const line = rawLines[index];
    const trimmed = line.trim();

    // 1. Skip completely empty lines
    if (!trimmed) {
      index++;
      continue;
    }

    // 2. Markdown Table Detection (starts and contains '|')
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.split('|').length > 2) {
      const tableLines = [];
      while (
        index < rawLines.length &&
        rawLines[index].trim().startsWith('|') &&
        rawLines[index].trim().endsWith('|')
      ) {
        tableLines.push(rawLines[index].trim());
        index++;
      }

      // Filter out divider lines like |---|---|
      const nonDividerLines = tableLines.filter(
        (l) => !/^\|[\s\-:|]+\|$/.test(l)
      );

      if (nonDividerLines.length > 0) {
        const headerRow = nonDividerLines[0]
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());
        const bodyRows = nonDividerLines.slice(1).map((r) =>
          r
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim())
        );

        elements.push(
          <div key={`table-${index}`} className="my-3 overflow-x-auto rounded-xl border border-teal-200/80 shadow-2xs">
            <table className="w-full text-left text-xs bg-white">
              <thead className="bg-[#0F5E57]/10 text-[#0F5E57] font-bold uppercase tracking-wider text-[10px] border-b border-teal-200">
                <tr>
                  {headerRow.map((h, hi) => (
                    <th key={hi} className="py-2 px-3">
                      {renderInlineText(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bodyRows.map((row, ri) => (
                  <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="py-2 px-3 text-gray-800">
                        {renderInlineText(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // 3. Headers (### Header, ## Header, # Header)
    if (/^#{1,6}\s+/.test(trimmed)) {
      const textWithoutHash = trimmed.replace(/^#{1,6}\s+/, '').trim();
      elements.push(
        <h4
          key={`header-${index}`}
          className="font-bold text-sm text-[#0F5E57] mt-3 mb-1.5 flex items-center gap-1.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
          <span>{renderInlineText(textWithoutHash)}</span>
        </h4>
      );
      index++;
      continue;
    }

    // 4. Bullet list items (* item, - item, • item)
    if (/^[-*•]\s+/.test(trimmed)) {
      const bulletLines = [];
      while (
        index < rawLines.length &&
        /^[-*•]\s+/.test(rawLines[index].trim())
      ) {
        bulletLines.push(rawLines[index].trim().replace(/^[-*•]\s+/, '').trim());
        index++;
      }

      elements.push(
        <ul key={`ul-${index}`} className="my-2 space-y-1.5 pl-1">
          {bulletLines.map((item, bi) => (
            <li key={bi} className="flex items-start gap-2 text-xs md:text-sm text-gray-800 leading-relaxed">
              <span className="text-[#0F5E57] font-bold text-sm leading-tight mt-0.5">•</span>
              <div className="flex-1">{renderInlineText(item)}</div>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 5. Numbered list items (1. item, 2. item)
    if (/^\d+\.\s+/.test(trimmed)) {
      const numLines = [];
      while (
        index < rawLines.length &&
        /^\d+\.\s+/.test(rawLines[index].trim())
      ) {
        const itemText = rawLines[index].trim().replace(/^\d+\.\s+/, '').trim();
        numLines.push(itemText);
        index++;
      }

      elements.push(
        <ol key={`ol-${index}`} className="my-2 space-y-1.5 pl-1">
          {numLines.map((item, ni) => (
            <li key={ni} className="flex items-start gap-2 text-xs md:text-sm text-gray-800 leading-relaxed">
              <span className="text-[#0F5E57] font-black text-xs bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-md min-w-[20px] text-center">
                {ni + 1}
              </span>
              <div className="flex-1">{renderInlineText(item)}</div>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // 6. Regular Paragraph
    elements.push(
      <p key={`p-${index}`} className="my-1.5 text-xs md:text-sm text-gray-800 leading-relaxed">
        {renderInlineText(trimmed)}
      </p>
    );
    index++;
  }

  return <div className={`formatted-ai-response space-y-1 ${className}`}>{elements}</div>;
}

