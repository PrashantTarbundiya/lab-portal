import React from 'react';

export default function VisualRangeGauge({ parameter, value, unit, refRangeRaw, flag }) {
  // Parse numeric values
  const valNum = parseFloat(value);
  let lowNum = null;
  let highNum = null;

  if (refRangeRaw) {
    const rangeMatch = refRangeRaw.match(/([\d.]+)\s*[-–—to]+\s*([\d.]+)/i);
    const ltMatch = refRangeRaw.match(/[<≤]\s*([\d.]+)/);
    const gtMatch = refRangeRaw.match(/[>≥]\s*([\d.]+)/);

    if (rangeMatch) {
      lowNum = parseFloat(rangeMatch[1]);
      highNum = parseFloat(rangeMatch[2]);
    } else if (ltMatch) {
      lowNum = 0;
      highNum = parseFloat(ltMatch[1]);
    } else if (gtMatch) {
      lowNum = parseFloat(gtMatch[1]);
      highNum = lowNum * 2;
    }
  }

  const isCritical = (flag || '').includes('CRITICAL');
  const isLow = (flag || '').includes('LOW');
  const isHigh = (flag || '').includes('HIGH');
  const isNormal = flag === 'NORMAL' || (!isLow && !isHigh && !isCritical);

  // Compute position percentage (10% to 90% clamp)
  let percentage = 50;
  if (!isNaN(valNum) && lowNum !== null && highNum !== null && highNum > lowNum) {
    const span = highNum - lowNum;
    const padding = span * 0.4;
    const minScale = Math.max(0, lowNum - padding);
    const maxScale = highNum + padding;
    const totalSpan = maxScale - minScale;
    
    const rawPct = ((valNum - minScale) / totalSpan) * 100;
    percentage = Math.max(8, Math.min(92, rawPct));
  } else {
    if (isLow) percentage = 15;
    else if (isHigh) percentage = 85;
    else if (isCritical) percentage = isLow ? 8 : 92;
    else percentage = 50;
  }

  // Pin & Badge Colors
  const pinColor = isCritical
    ? 'bg-red-600 text-white ring-red-200'
    : isLow
    ? 'bg-amber-500 text-white ring-amber-200'
    : isHigh
    ? 'bg-orange-500 text-white ring-orange-200'
    : 'bg-[#0F5E57] text-white ring-emerald-200';

  const badgeStyle = isCritical
    ? 'bg-red-100 text-red-800 border-red-300 animate-pulse'
    : isLow
    ? 'bg-amber-100 text-amber-900 border-amber-300'
    : isHigh
    ? 'bg-orange-100 text-orange-900 border-orange-300'
    : 'bg-emerald-100 text-emerald-900 border-emerald-300';

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs hover:shadow-sm transition-all space-y-3">
      {/* Parameter Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-gray-900 text-sm tracking-tight">{parameter}</h4>
          <span className="text-[11px] text-gray-400">Standard range: {refRangeRaw || 'Reference unavailable'}</span>
        </div>
        <div className="text-right flex items-center gap-2">
          <span className="text-base font-black text-gray-900 tabular-nums">
            {value} <span className="text-xs font-normal text-gray-500">{unit}</span>
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
            {isCritical ? 'CRITICAL' : isLow ? 'LOW' : isHigh ? 'HIGH' : 'NORMAL'}
          </span>
        </div>
      </div>

      {/* Visual Range Spectrum Gauge */}
      <div className="pt-5 pb-2 px-2 relative">
        {/* Animated Value Pointer Pin */}
        <div
          className="absolute -top-1 transition-all duration-700 ease-out transform -translate-x-1/2 flex flex-col items-center z-10"
          style={{ left: `${percentage}%` }}
        >
          <div className={`px-2 py-0.5 rounded-md text-[10px] font-black shadow-sm ring-2 ${pinColor} whitespace-nowrap`}>
            {value} {unit}
          </div>
          <div className={`w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] ${
            isCritical ? 'border-t-red-600' : isLow ? 'border-t-amber-500' : isHigh ? 'border-t-orange-500' : 'border-t-[#0F5E57]'
          }`}></div>
        </div>

        {/* Multi-Zone Colored Spectrum Track */}
        <div className="h-3 w-full rounded-full bg-gray-100 p-0.5 flex overflow-hidden shadow-inner">
          {/* Low Zone */}
          <div className="w-[25%] bg-gradient-to-r from-blue-300 to-amber-200 rounded-l-full relative" title="Low Range">
            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-gray-600/70 opacity-60">LOW</span>
          </div>
          {/* Healthy Normal Zone */}
          <div className="w-[50%] bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-300 relative border-x border-white/60" title="Normal Healthy Range">
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-emerald-950 tracking-wider">NORMAL RANGE</span>
          </div>
          {/* High Zone */}
          <div className="w-[25%] bg-gradient-to-r from-orange-200 to-red-400 rounded-r-full relative" title="High / Critical Range">
            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-gray-700/70 opacity-60">HIGH</span>
          </div>
        </div>

        {/* Numeric Scale Anchors */}
        <div className="flex justify-between text-[10px] text-gray-400 pt-1.5 font-mono">
          <span>{lowNum !== null ? `${lowNum} (Min)` : 'Low'}</span>
          <span className="text-emerald-700 font-semibold">{refRangeRaw || 'Normal Range'}</span>
          <span>{highNum !== null ? `${highNum} (Max)` : 'High'}</span>
        </div>
      </div>
    </div>
  );
}
