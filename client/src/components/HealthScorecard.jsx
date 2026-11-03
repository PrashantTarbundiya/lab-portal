import React from 'react';

export default function HealthScorecard({ results = [], onOpenChecklist, onOpenAI, orderNo, patientName }) {
  const total = results.length;
  const criticalCount = results.filter((r) => (r.flag || '').includes('CRITICAL')).length;
  const abnormalCount = results.filter((r) => r.flag === 'LOW' || r.flag === 'HIGH').length;
  const normalCount = total - criticalCount - abnormalCount;
  const normalPercent = total > 0 ? Math.round((normalCount / total) * 100) : 100;

  const isCritical = criticalCount > 0;
  const isAbnormal = abnormalCount > 0;

  const handleShareWhatsApp = () => {
    const summaryText = `Hello, here is my diagnostic lab summary for Order #${orderNo} (${patientName}):\n` +
      `• Total tests: ${total}\n` +
      `• In normal range: ${normalCount}\n` +
      (criticalCount > 0 ? `• 🚨 Urgent flags: ${criticalCount}\n` : '') +
      (abnormalCount > 0 ? `• ⚠️ Out-of-range flags: ${abnormalCount}\n` : '') +
      `\nSecure Digital Portal: ${window.location.href}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(summaryText)}`, '_blank');
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50/80 rounded-2xl border border-gray-200/90 p-4 md:p-5 shadow-xs space-y-4">
      {/* Top Title & Vital Badge */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">🩺</span>
          <div>
            <h3 className="font-bold text-gray-900 text-sm tracking-tight">Diagnostic Health Scorecard</h3>
            <span className="text-[11px] text-gray-500">Automated biological spectrum evaluation</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isCritical ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-900 border border-red-300 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-600"></span>
              Urgent Review Required
            </span>
          ) : isAbnormal ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-600"></span>
              Follow-up Recommended
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              All Parameters Normal
            </span>
          )}
        </div>
      </div>

      {/* 3 Metric Mini Cards */}
      <div className="grid grid-cols-3 gap-2.5 text-center">
        {/* Card 1: Tests Analyzed */}
        <div className="bg-white p-3 rounded-xl border border-gray-200/80 shadow-2xs">
          <span className="text-[11px] text-gray-500 font-medium block">Total Tests</span>
          <strong className="text-lg md:text-xl font-black text-gray-900 tabular-nums">{total}</strong>
          <span className="text-[10px] text-gray-400 block mt-0.5">Parameters</span>
        </div>

        {/* Card 2: Healthy Range */}
        <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-200/60 shadow-2xs">
          <span className="text-[11px] text-emerald-800 font-medium block">In Healthy Range</span>
          <strong className="text-lg md:text-xl font-black text-emerald-950 tabular-nums">
            {normalCount}
            <span className="text-xs font-normal text-emerald-700">/{total}</span>
          </strong>
          <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">{normalPercent}% Normal</span>
        </div>

        {/* Card 3: Flags / Review */}
        <div className={`p-3 rounded-xl border shadow-2xs ${
          isCritical
            ? 'bg-red-50/60 border-red-200 text-red-900'
            : isAbnormal
            ? 'bg-amber-50/60 border-amber-200 text-amber-900'
            : 'bg-gray-50 border-gray-200 text-gray-700'
        }`}>
          <span className="text-[11px] font-medium block">Review Needed</span>
          <strong className="text-lg md:text-xl font-black tabular-nums">
            {criticalCount + abnormalCount}
          </strong>
          <span className="text-[10px] block mt-0.5">
            {criticalCount > 0 ? `${criticalCount} Critical` : isAbnormal ? 'Mild variation' : 'None'}
          </span>
        </div>
      </div>

      {/* Quick Action Tools Row */}
      <div className="pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 text-xs">
        <div className="flex flex-wrap gap-2">
          {onOpenChecklist && (
            <button
              type="button"
              onClick={onOpenChecklist}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 font-bold transition border border-teal-200 cursor-pointer shadow-2xs"
            >
              <span>📋</span> Doctor Checklist
            </button>
          )}

          {onOpenAI && (
            <button
              type="button"
              onClick={onOpenAI}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F5E57] hover:bg-[#0c4b45] text-white font-bold transition cursor-pointer shadow-2xs"
            >
              <span>🤖</span> Ask AI Copilot
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleShareWhatsApp}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] font-bold transition border border-[#25D366]/30 cursor-pointer shadow-2xs"
          title="Share summary via WhatsApp"
        >
          <span>📲</span> Share Summary
        </button>
      </div>
    </div>
  );
}
