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

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await api('/reports/operations', { token });
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
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
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
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col">
      <DemoRibbon />

      {/* Staff Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0F5E57] flex items-center justify-center text-white font-bold text-sm">
                  A
                </div>
                <span className="font-bold text-gray-900 text-base">Lab Console</span>
              </div>

              <nav className="hidden md:flex space-x-1">
                <Link to="/staff" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                  Orders
                </Link>
                <Link to="/staff/import" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                  LIS Import
                </Link>
                <Link to="/staff/tasks" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                  Tasks & Flags
                </Link>
                <Link to="/staff/access-log" className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100">
                  Access Log
                </Link>
                <Link to="/staff/operations" className="px-3 py-2 rounded-lg text-sm font-semibold bg-[#0F5E57]/10 text-[#0F5E57]">
                  Operations Report
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 hidden sm:inline">{user?.email}</span>
              <button onClick={() => { logout(); }} className="text-xs font-semibold text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5">
                Log out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 flex-1">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Digital Delivery & Operations Metrics
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Key operational metrics for Vijayawada chain delivery turnaround (Goal: &gt;80% digital delivery, calls down 60%).
          </p>
        </div>

        {/* 4 Numbers Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Card className="p-6 border-gray-200/90 shadow-sm">
            <span className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
              1. Reports Signed (14d)
            </span>
            <div className="text-3xl font-extrabold text-gray-900 mt-2 tabular-nums">
              {kpis?.totalSigned || 0}
            </div>
            <p className="text-xs text-emerald-700 font-medium mt-1">
              ✓ Ready across 6 labs & 38 centres
            </p>
          </Card>

          <Card className="p-6 border-gray-200/90 shadow-sm">
            <span className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
              2. Delivered Digitally
            </span>
            <div className="text-3xl font-extrabold text-[#0F5E57] mt-2 tabular-nums">
              {kpis?.deliveredPercent || 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Target: 80% (Printing halved)
            </p>
          </Card>

          <Card className="p-6 border-gray-200/90 shadow-sm">
            <span className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
              3. Opened by Patient
            </span>
            <div className="text-3xl font-extrabold text-blue-700 mt-2 tabular-nums">
              {kpis?.openedPercent || 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Verified via OTP security gate
            </p>
          </Card>

          <Card className="p-6 border-gray-200/90 shadow-sm">
            <span className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
              4. Avg Time to Open
            </span>
            <div className="text-3xl font-extrabold text-purple-700 mt-2 tabular-nums">
              {kpis?.avgOpenHours || 0} <span className="text-sm font-normal text-gray-500">hrs</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Sign-off → Patient verified read
            </p>
          </Card>
        </div>

        {/* 14-Day Delivery Volume Line Chart */}
        <Card className="p-6 border-gray-200/90 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                14-Day Delivery & Engagement Trend
              </h3>
              <p className="text-xs text-gray-500">
                Tracking digital delivery adoption vs. patient access
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-gray-800"></span> Signed
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#0F5E57]"></span> Delivered
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-600"></span> Opened
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
              <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="#E5E7EB" strokeDasharray="3 3" />
              <line x1={paddingX} y1={chartHeight / 2} x2={chartWidth - paddingX} y2={chartHeight / 2} stroke="#E5E7EB" strokeDasharray="3 3" />
              <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="#9CA3AF" />

              {/* Data Lines */}
              {pointsSigned && (
                <polyline fill="none" stroke="#1F2937" strokeWidth="2.5" points={pointsSigned} />
              )}
              {pointsDelivered && (
                <polyline fill="none" stroke="#0F5E57" strokeWidth="2.5" points={pointsDelivered} />
              )}
              {pointsOpened && (
                <polyline fill="none" stroke="#2563EB" strokeWidth="2.5" points={pointsOpened} />
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
                    fill="#6B7280"
                  >
                    {d.date.slice(5)}
                  </text>
                );
              })}
            </svg>
          </div>
        </Card>
      </main>
    </div>
  );
}
