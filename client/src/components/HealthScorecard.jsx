import React from 'react';

export default function HealthScorecard({ results = [], onOpenChecklist, onOpenAI, orderNo, patientName }) {
  const total = results.length;
  const criticalCount = results.filter((r) => (r.flag || '').includes('CRITICAL')).length;
  const abnormalCount = results.filter((r) => r.flag === 'LOW' || r.flag === 'HIGH').length;
  const normalCount = Math.max(0, total - criticalCount - abnormalCount);
  const normalPercent = total > 0 ? Math.round((normalCount / total) * 100) : 100;

  const isCritical = criticalCount > 0;
  const isAbnormal = abnormalCount > 0;

  // Segment stroke calculations for circular gauge
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalPercent / 100) * circumference;

  const strokeColor = isCritical
    ? '#DC2626'
    : isAbnormal
    ? '#D97706'
    : '#059669';

  const handleShareWhatsApp = () => {
    const summaryText = `*Company A Diagnostics - Health Summary*
Order: #${orderNo}
Patient: ${patientName || 'Patient'}
Total Parameters: ${total}
• Normal: ${normalCount} (${normalPercent}%)
${criticalCount > 0 ? `• Critical / High Priority: ${criticalCount}\n` : ''}${abnormalCount > 0 ? `• Out-of-Range: ${abnormalCount}\n` : ''}
View Full Report & Digital Verification:
${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(summaryText)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="relative overflow-hidden glass-card rounded-3xl border border-white/10 p-5 shadow-xl space-y-4">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10"></div>

      {/* Header Row: Title & Badge */}
      <div className="flex items-center justify-between flex-wrap gap-2 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 border border-emerald-400/30">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-white text-sm tracking-tight font-display">
                Diagnostic Health Scorecard
              </h3>
              <span className="text-[10px] font-mono uppercase bg-white/10 text-teal-300 px-2 py-0.5 rounded-full font-bold border border-white/15">
                AI Triaged
              </span>
            </div>
            <span className="text-xs text-slate-400">
              Clinical biological spectrum analysis across {total} parameters
            </span>
          </div>
        </div>

        <div>
          {isCritical ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-black bg-rose-500/25 text-rose-300 border border-rose-500/40 animate-pulse shadow-sm">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              Critical Review Required
            </span>
          ) : isAbnormal ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Follow-up Recommended
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              All Biomarkers Optimal
            </span>
          )}
        </div>
      </div>

      {/* Main Metric Section: Circular Health Meter + 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center relative">
        {/* Circular Gauge Card */}
        <div className="sm:col-span-1 flex flex-col items-center justify-center p-3.5 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r={radius}
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="7"
                fill="none"
              />
              <circle
                cx="40"
                cy="40"
                r={radius}
                stroke={strokeColor}
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-base font-black text-white tracking-tight leading-none font-mono">
                {normalPercent}%
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-0.5 font-mono">
                Optimal
              </span>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-slate-300 mt-1 font-mono">
            Health Index
          </span>
        </div>

        {/* 3 Metric Cards */}
        <div className="sm:col-span-3 grid grid-cols-3 gap-2">
          {/* Card 1: Total Tests */}
          <div className="bg-white/5 p-3 rounded-2xl border border-white/10 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Tested
            </span>
            <div className="my-1">
              <strong className="text-xl sm:text-2xl font-black text-white tabular-nums font-mono">
                {total}
              </strong>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Parameters
            </span>
          </div>

          {/* Card 2: In Healthy Range */}
          <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/30 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
              Normal
            </span>
            <div className="my-1">
              <strong className="text-xl sm:text-2xl font-black text-emerald-300 tabular-nums font-mono">
                {normalCount}
              </strong>
            </div>
            <span className="text-[11px] text-emerald-400 font-bold font-mono inline-flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
              <span>In Range</span>
            </span>
          </div>

          {/* Card 3: Out-of-Range */}
          <div className={`p-3 rounded-2xl border shadow-sm flex flex-col justify-between ${
            isCritical
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
              : isAbnormal
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              : 'bg-white/5 border-white/10 text-slate-300'
          }`}>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-80">
              Flags
            </span>
            <div className="my-1">
              <strong className="text-xl sm:text-2xl font-black tabular-nums font-mono">
                {criticalCount + abnormalCount}
              </strong>
            </div>
            <span className="text-[11px] font-bold font-mono inline-flex items-center gap-1">
              {criticalCount > 0 ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping"></span>
                  <span>{criticalCount} Critical</span>
                </>
              ) : isAbnormal ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>{abnormalCount} Out of range</span>
                </>
              ) : (
                <>
                  <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                  <span>0 Flags</span>
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Tools Bar */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 text-xs relative">
        <div className="flex flex-wrap items-center gap-2">
          {onOpenChecklist && (
            <button
              type="button"
              onClick={onOpenChecklist}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition border border-white/15 cursor-pointer shadow-sm"
            >
              <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
              <span>Doctor Discussion Checklist</span>
            </button>
          )}

          {onOpenAI && (
            <button
              type="button"
              onClick={onOpenAI}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black transition cursor-pointer shadow-sm"
            >
              <svg className="w-3.5 h-3.5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              <span>Ask Labby AI</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleShareWhatsApp}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold transition border border-emerald-500/40 cursor-pointer shadow-sm font-mono text-[11px]"
          title="Share summary via WhatsApp"
        >
          <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          <span>WhatsApp Summary</span>
        </button>
      </div>
    </div>
  );
}
