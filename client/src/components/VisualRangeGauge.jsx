import React from 'react';

export default function VisualRangeGauge({ parameter, value, unit, refRangeRaw, flag, onAskLabby = null }) {
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
    const padding = span * 0.35;
    const minScale = Math.max(0, lowNum - padding);
    const maxScale = highNum + padding;
    const totalSpan = maxScale - minScale;
    
    const rawPct = ((valNum - minScale) / totalSpan) * 100;
    percentage = Math.max(8, Math.min(92, rawPct));
  } else {
    if (isLow) percentage = 16;
    else if (isHigh) percentage = 84;
    else if (isCritical) percentage = isLow ? 8 : 92;
    else percentage = 50;
  }

  // Card theme classes
  const cardBorder = isCritical
    ? 'border-l-4 border-l-rose-500 border-white/10 glass-card bg-rose-950/25 shadow-lg shadow-rose-950/30'
    : isLow
    ? 'border-l-4 border-l-amber-500 border-white/10 glass-card bg-amber-950/25 shadow-lg'
    : isHigh
    ? 'border-l-4 border-l-amber-500 border-white/10 glass-card bg-amber-950/25 shadow-lg'
    : 'border-l-4 border-l-emerald-400 border-white/10 glass-card hover:border-emerald-400/40 shadow-md';

  const badgeStyle = isCritical
    ? 'bg-rose-500/25 text-rose-300 border-rose-500/40 animate-pulse font-mono font-black'
    : isLow
    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-mono font-bold'
    : isHigh
    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-mono font-bold'
    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-mono font-bold';

  const pinColor = isCritical
    ? 'bg-rose-600 text-white ring-rose-400/50 shadow-rose-900/50'
    : isLow
    ? 'bg-amber-500 text-slate-950 ring-amber-300/50 shadow-amber-900/50'
    : isHigh
    ? 'bg-amber-500 text-slate-950 ring-amber-300/50 shadow-amber-900/50'
    : 'bg-emerald-400 text-slate-950 ring-emerald-300/50 shadow-emerald-900/50';

  return (
    <div className={`rounded-2xl border p-4 shadow-xl transition-all space-y-3.5 ${cardBorder}`}>
      {/* Parameter Header & Numerical Result */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-extrabold text-white text-sm tracking-tight font-display">
              {parameter}
            </h4>
            <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeStyle}`}>
              {isCritical ? 'CRITICAL' : isLow ? 'LOW' : isHigh ? 'HIGH' : 'NORMAL'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            Standard biological reference: <strong className="text-slate-200 font-medium font-mono">{refRangeRaw || '—'}</strong>
          </span>
        </div>

        {/* Big Crisp Numeric Result */}
        <div className="text-right flex items-center gap-2">
          <div className="flex flex-col items-end">
            <div className="flex items-baseline gap-1">
              <span className={`text-lg sm:text-xl font-black tabular-nums tracking-tight font-mono ${
                isCritical ? 'text-rose-400' : isHigh || isLow ? 'text-amber-300' : 'text-white'
              }`}>
                {value}
              </span>
              <span className="text-xs font-semibold text-slate-400 font-mono">
                {unit}
              </span>
            </div>
          </div>

          {onAskLabby && (
            <button
              type="button"
              onClick={() => onAskLabby(parameter, value, unit, flag)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 px-2.5 py-1 rounded-xl transition cursor-pointer shadow-sm group"
              title={`Ask Labby about ${parameter}`}
            >
              <svg className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              <span className="hidden sm:inline">Ask Labby</span>
            </button>
          )}
        </div>
      </div>

      {/* Visual Biological Range Spectrum Gauge */}
      <div className="pt-5 pb-1 px-1 relative">
        {/* Value Pointer Pin Floating Above Gauge */}
        <div
          className="absolute -top-1 transition-all duration-700 ease-out transform -translate-x-1/2 flex flex-col items-center z-10 pointer-events-none"
          style={{ left: `${percentage}%` }}
        >
          <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black font-mono shadow-sm ring-2 ${pinColor} whitespace-nowrap`}>
            {value} {unit}
          </div>
          <div className={`w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] ${
            isCritical ? 'border-t-rose-600' : isLow || isHigh ? 'border-t-amber-500' : 'border-t-emerald-400'
          }`}></div>
        </div>

        {/* Multi-Zone Spectrum Bar */}
        <div className="h-3 w-full rounded-full bg-black/40 border border-white/10 p-0.5 flex overflow-hidden shadow-inner">
          {/* Low Zone */}
          <div className="w-[25%] bg-gradient-to-r from-blue-300 to-amber-200 rounded-l-full relative" title="Low Spectrum">
            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-slate-600/70">
              LOW
            </span>
          </div>

          {/* Normal Healthy Target Zone */}
          <div className="w-[50%] bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-300 relative border-x border-white/80" title="Target Normal Range">
            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-emerald-950 tracking-wider">
              TARGET NORMAL
            </span>
          </div>

          {/* High Spectrum Zone */}
          <div className="w-[25%] bg-gradient-to-r from-orange-200 to-rose-400 rounded-r-full relative" title="High / Critical Spectrum">
            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-slate-700/70">
              HIGH
            </span>
          </div>
        </div>

        {/* Spectrum Min / Target / Max scale labels */}
        <div className="flex justify-between text-[10px] text-slate-400 pt-1.5 font-mono">
          <span>{lowNum !== null ? `${lowNum}` : 'Min'}</span>
          <span className="text-emerald-400 font-bold">{refRangeRaw || 'Normal Range'}</span>
          <span>{highNum !== null ? `${highNum}` : 'Max'}</span>
        </div>
      </div>
    </div>
  );
}
