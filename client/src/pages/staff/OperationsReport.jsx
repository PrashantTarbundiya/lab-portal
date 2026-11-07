import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/Card';
import DemoRibbon from '../../components/DemoRibbon';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function OperationsReport() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token, logout, user } = useAuth();
  const staffAuthToken = token && !token.startsWith('demo-patient') ? token : 'demo-staff';

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await api('/reports/operations', { token: staffAuthToken });
        setData(res);
      } catch (err) {
        console.warn('Ops report error, demo fallback:', err);
        // Demo fallback
        setData({
          kpis: {
            totalSigned: 68,
            deliveredPercent: 88,
            openedPercent: 74,
            avgOpenHours: 2.8,
          },
          chartData: [
            { date: '10-20', signed: 4, delivered: 4, opened: 3 },
            { date: '10-21', signed: 5, delivered: 5, opened: 4 },
            { date: '10-22', signed: 6, delivered: 5, opened: 4 },
            { date: '10-23', signed: 4, delivered: 4, opened: 3 },
            { date: '10-24', signed: 5, delivered: 5, opened: 5 },
            { date: '10-25', signed: 7, delivered: 6, opened: 5 },
            { date: '10-26', signed: 6, delivered: 6, opened: 4 },
            { date: '10-27', signed: 5, delivered: 4, opened: 4 },
            { date: '10-28', signed: 6, delivered: 5, opened: 5 },
            { date: '10-29', signed: 5, delivered: 5, opened: 4 },
            { date: '10-30', signed: 6, delivered: 6, opened: 5 },
            { date: '10-31', signed: 4, delivered: 4, opened: 3 },
            { date: '11-01', signed: 8, delivered: 7, opened: 6 },
            { date: '11-02', signed: 5, delivered: 4, opened: 4 },
          ],
        });
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07151f] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const { kpis, chartData } = data || {};

  // Simple SVG Line Chart calculations
  const maxVal = Math.max(...(chartData?.map((d) => Math.max(d.signed, d.delivered, d.opened)) || [10]), 10);
  const chartHeight = 220;
  const chartWidth = 700;
  const paddingX = 40;
  const paddingY = 30;

  const pointsSigned = chartData?.map((d, i) => {
    const x = paddingX + (i / (chartData.length - 1)) * (chartWidth - 2 * paddingX);
    const y = chartHeight - paddingY - (d.signed / maxVal) * (chartHeight - 2 * paddingY);
    return `${x},${y}`;
  }).join(' ');

  const pointsDelivered = chartData?.map((d, i) => {
    const x = paddingX + (i / (chartData.length - 1)) * (chartWidth - 2 * paddingX);
    const y = chartHeight - paddingY - (d.delivered / maxVal) * (chartHeight - 2 * paddingY);
    return `${x},${y}`;
  }).join(' ');

  const pointsOpened = chartData?.map((d, i) => {
    const x = paddingX + (i / (chartData.length - 1)) * (chartWidth - 2 * paddingX);
    const y = chartHeight - paddingY - (d.opened / maxVal) * (chartHeight - 2 * paddingY);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="min-h-screen bg-[#07151f] text-slate-100 flex flex-col relative overflow-x-hidden selection:bg-emerald-400 selection:text-slate-950 font-sans">
      <DemoRibbon />

      {/* Atmospheric Ambience Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-36 left-1/4 w-[750px] h-[750px] bg-teal-500/10 rounded-full blur-[140px]"></div>
        <div className="absolute top-1/3 -right-40 w-[620px] h-[620px] bg-emerald-500/10 rounded-full blur-[160px]"></div>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 flex-1 relative z-10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-white tracking-tight">
            Digital Delivery & Operations Metrics
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Key operational metrics for Vijayawada chain delivery turnaround (Goal: &gt;80% digital delivery, physical desk queries down 60%).
          </p>
        </div>

        {/* 4 Numbers Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="glass-card p-6 rounded-3xl border border-white/10 shadow-xl space-y-2 text-white">
            <span className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
              1. Reports Signed (14d)
            </span>
            <div className="text-3xl font-display font-black text-white tabular-nums">
              {kpis?.totalSigned || 0}
            </div>
            <p className="text-xs text-emerald-400 font-medium inline-flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
              <span>Ready across 6 labs & 38 centres</span>
            </p>
          </div>

          <div className="glass-card p-6 rounded-3xl border border-emerald-500/30 shadow-xl space-y-2 text-white">
            <span className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
              2. Delivered Digitally
            </span>
            <div className="text-3xl font-display font-black text-emerald-300 tabular-nums">
              {kpis?.deliveredPercent || 0}%
            </div>
            <p className="text-xs text-slate-300">
              Target: 80% (Printing halved)
            </p>
          </div>

          <div className="glass-card p-6 rounded-3xl border border-sky-500/30 shadow-xl space-y-2 text-white">
            <span className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
              3. Opened by Patient
            </span>
            <div className="text-3xl font-display font-black text-sky-300 tabular-nums">
              {kpis?.openedPercent || 0}%
            </div>
            <p className="text-xs text-slate-300">
              Verified via OTP security gate
            </p>
          </div>

          <div className="glass-card p-6 rounded-3xl border border-purple-500/30 shadow-xl space-y-2 text-white">
            <span className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider">
              4. Avg Time to Open
            </span>
            <div className="text-3xl font-display font-black text-purple-300 tabular-nums">
              {kpis?.avgOpenHours || 0} <span className="text-sm font-normal text-slate-400 font-mono">hrs</span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <span>Sign-off</span>
              <svg className="w-3 h-3 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              <span>Patient verified read</span>
            </p>
          </div>
        </div>

        {/* 14-Day Delivery Volume Line Chart */}
        <div className="glass-panel-elevated p-6 rounded-3xl border border-white/15 shadow-2xl space-y-4 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <h3 className="text-base font-display font-black text-white">
                14-Day Delivery & Engagement Trend
              </h3>
              <p className="text-xs text-slate-300">
                Tracking digital delivery adoption vs. patient access
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs font-mono font-bold">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-400"></span> Signed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-400"></span> Delivered
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-sky-400"></span> Opened
              </span>
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="w-full overflow-x-auto py-2">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full max-w-full h-auto min-w-[500px]"
            >
              {/* Grid Lines */}
              <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
              <line x1={paddingX} y1={chartHeight / 2} x2={chartWidth - paddingX} y2={chartHeight / 2} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
              <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="rgba(255,255,255,0.18)" />

              {/* Data Lines */}
              {pointsSigned && (
                <polyline fill="none" stroke="#F59E0B" strokeWidth="2.5" points={pointsSigned} />
              )}
              {pointsDelivered && (
                <polyline fill="none" stroke="#10B981" strokeWidth="2.5" points={pointsDelivered} />
              )}
              {pointsOpened && (
                <polyline fill="none" stroke="#38BDF8" strokeWidth="2.5" points={pointsOpened} />
              )}

              {/* Date Labels below X axis */}
              {chartData?.map((d, i) => {
                const x = paddingX + (i / (chartData.length - 1)) * (chartWidth - 2 * paddingX);
                return (
                  <text
                    key={i}
                    x={x}
                    y={chartHeight - 10}
                    fontSize="9"
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontFamily="monospace"
                  >
                    {d.date.slice(5)}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>
      </main>
    </div>
  );
}

