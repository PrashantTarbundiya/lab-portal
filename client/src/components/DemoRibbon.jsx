export default function DemoRibbon() {
  const isDemo = import.meta.env.VITE_OTP_DEMO_MODE !== 'false';

  if (!isDemo) return null;

  return (
    <div className="bg-amber-400 text-amber-950 px-4 py-1.5 text-xs font-semibold text-center select-none shadow-sm flex items-center justify-center gap-2">
      <span className="w-2 h-2 rounded-full bg-amber-950 animate-ping"></span>
      <span>Demo mode active — test OTP is <strong>123456</strong> | All data is simulated</span>
    </div>
  );
}

