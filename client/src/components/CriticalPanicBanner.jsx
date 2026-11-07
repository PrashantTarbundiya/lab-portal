import { useState, useEffect, useRef } from 'react';
import { useToast } from './Toast';

// Web Audio API Clinical Emergency Telemetry Double-Tone Chime
export function playClinicalPanicChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;

    // Tone 1: High alert chime (880 Hz - A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Tone 2: Emergency escalation harmonic (1760 Hz - A6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1760, now + 0.15);
    gain2.gain.setValueAtTime(0.3, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.55);

    // Tone 3: Urgent hospital telemetry cadence (1318.5 Hz - E6)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1318.5, now + 0.35);
    gain3.gain.setValueAtTime(0.28, now + 0.35);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.35);
    osc3.stop(now + 0.8);
  } catch (err) {
    console.warn('AudioContext alert blocked by autoplay policy:', err);
  }
}

export default function CriticalPanicBanner({
  criticalOrders = [],
  role = 'DOCTOR', // 'DOCTOR' | 'LAB'
  onInspectOrder,
}) {
  const { addToast } = useToast();

  // 15 minutes = 900 seconds NABL/CAP mandated callback SLA
  const [secondsRemaining, setSecondsRemaining] = useState(884);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isCallbackLogged, setIsCallbackLogged] = useState(false);
  const [callbackDetails, setCallbackDetails] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [recipientDoc, setRecipientDoc] = useState('Dr. K. Prasad, MD (ICU Head)');
  const [readbackVerified, setReadbackVerified] = useState(true);
  const [notes, setNotes] = useState('Critical Troponin & Potassium communicated verbally. Repeat draw ordered.');

  const intervalRef = useRef(null);
  const chimeIntervalRef = useRef(null);

  // Active critical finding to display
  const criticalItem = criticalOrders[0] || {
    id: 'ORD-71233',
    patientName: 'Farzana Begum',
    ageSex: '36Y / Female',
    biomarker: 'Troponin-I',
    value: '0.88 ng/mL',
    cutoff: '> 0.04 ng/mL (Panic Level)',
    secondary: 'Serum Potassium: 6.8 mmol/L (Panic High > 6.0)',
    orderNo: 'ORD-71233',
    location: 'Emergency Department / Bed 04',
  };

  // 15-Minute Countdown Timer Loop
  useEffect(() => {
    if (isCallbackLogged) return;

    intervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isCallbackLogged]);

  // Periodic Audio Chime (repeats every 30s until callback logged or muted)
  useEffect(() => {
    if (isCallbackLogged || !isAudioEnabled) {
      if (chimeIntervalRef.current) clearInterval(chimeIntervalRef.current);
      return;
    }

    // Play initial chime after short delay
    const initialTimer = setTimeout(() => {
      playClinicalPanicChime();
    }, 1200);

    chimeIntervalRef.current = setInterval(() => {
      playClinicalPanicChime();
    }, 30000);

    return () => {
      clearTimeout(initialTimer);
      if (chimeIntervalRef.current) clearInterval(chimeIntervalRef.current);
    };
  }, [isAudioEnabled, isCallbackLogged]);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTestChime = () => {
    playClinicalPanicChime();
    addToast('Clinical panic double-tone chime triggered', 'info');
  };

  const handleToggleAudio = () => {
    const nextState = !isAudioEnabled;
    setIsAudioEnabled(nextState);
    if (nextState) {
      playClinicalPanicChime();
      addToast('Audio Alarm Enabled: Chimes will sound for critical panic values', 'info');
    } else {
      addToast('Audio Alarm Muted', 'warning');
    }
  };

  const handleSaveCallback = (e) => {
    e.preventDefault();
    const timestamp = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setCallbackDetails({
      doctor: recipientDoc,
      timestamp,
      readbackVerified,
      loggedBy: role === 'DOCTOR' ? 'Dr. Reviewer (Stat)' : 'Sr. Medical Lab Technologist',
    });
    setIsCallbackLogged(true);
    setShowLogModal(false);
    addToast(
      `15-Minute Critical Callback successfully logged at ${timestamp} to ${recipientDoc}!`,
      'success'
    );
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-3xl border-2 border-rose-500/60 bg-gradient-to-r from-rose-950/80 via-[#180912] to-[#0d1622] text-white shadow-2xl p-4 sm:p-5 transition-all">
        {/* Subtle Ambient Pulse Ring */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left Column: Warning Badge, Patient & Panic Biomarker */}
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-rose-500 text-white font-mono font-black text-[10px] tracking-wider uppercase animate-pulse flex items-center gap-1 shadow-md shadow-rose-500/30">
                <span className="w-2 h-2 rounded-full bg-white"></span>
                STAT CRITICAL PANIC VALUE
              </span>
              <span className="text-[11px] font-mono text-rose-300 font-bold bg-rose-500/20 px-2 py-0.5 rounded-lg border border-rose-500/30">
                {role === 'DOCTOR' ? 'Physician Review Priority 1' : 'Analyzer Critical Flag c501'}
              </span>
              <span className="text-xs text-slate-300 font-mono">
                Order: <strong className="text-white">{criticalItem.orderNo || criticalItem.id}</strong>
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-2 pt-0.5">
              <h3 className="text-base sm:text-lg font-display font-black text-rose-100">
                {criticalItem.patientName}
              </h3>
              <span className="text-xs text-rose-200/80 font-mono">({criticalItem.ageSex || 'Emergency Bed 04'})</span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-300">
                Location: <strong className="text-white">{criticalItem.location || 'Emergency Dept / Ward 3'}</strong>
              </span>
            </div>

            {/* Panic Biomarkers Highlight */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="px-2.5 py-1 rounded-xl bg-rose-500/25 border border-rose-400/40 text-rose-100 font-mono flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>
                  <strong>{criticalItem.biomarker || 'Troponin-I'}</strong>:{' '}
                  <span className="text-rose-300 font-black">{criticalItem.value || '0.88 ng/mL'}</span>{' '}
                  <span className="text-[10px] text-rose-300/80">({criticalItem.cutoff || 'Cutoff > 0.04'})</span>
                </span>
              </div>

              {criticalItem.secondary && (
                <div className="px-2.5 py-1 rounded-xl bg-rose-500/15 border border-rose-400/30 text-rose-200 font-mono text-[11px]">
                  <span>{criticalItem.secondary}</span>
                </div>
              )}
            </div>
          </div>

          {/* Center Column: 15-Minute Countdown Timer & Callback Status */}
          <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-rose-500/30 shrink-0">
            {!isCallbackLogged ? (
              <div className="text-center">
                <span className="text-[10px] uppercase font-mono tracking-wider text-rose-300/90 font-bold block">
                  15-Min Callback SLA
                </span>
                <div className="text-2xl sm:text-3xl font-mono font-black text-rose-400 tracking-tight flex items-center justify-center gap-1.5">
                  <svg className="w-5 h-5 text-rose-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="tabular-nums">{formatTimer(secondsRemaining)}</span>
                </div>
                <span className="text-[9px] text-slate-400 font-mono">
                  {secondsRemaining > 300 ? 'Within Safe Window' : 'URGENT ESCALATION REQUIRED'}
                </span>
              </div>
            ) : (
              <div className="text-left space-y-0.5">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px] border border-emerald-500/40 inline-flex items-center gap-1">
                  <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>CALLBACK VERIFIED</span>
                </span>
                <div className="text-xs font-bold text-white">
                  Handover to {callbackDetails?.doctor}
                </div>
                <div className="text-[10px] text-slate-300 font-mono">
                  Logged at {callbackDetails?.timestamp} (Readback Verified)
                </div>
              </div>
            )}

            {/* Audio Toggle / Test Controls */}
            <div className="flex flex-col gap-1 border-l border-white/10 pl-3">
              <button
                type="button"
                onClick={handleToggleAudio}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  isAudioEnabled
                    ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40 hover:bg-rose-500/50'
                    : 'bg-white/10 text-slate-400 border border-white/10 hover:bg-white/15'
                }`}
                title={isAudioEnabled ? 'Click to Mute Alarm' : 'Click to Enable Alarm'}
              >
                {isAudioEnabled ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-rose-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span>Sound ON</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                    <span>Muted</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleTestChime}
                className="px-2 py-0.5 rounded-lg text-[10px] font-mono text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition cursor-pointer flex items-center gap-1"
                title="Test Clinical Double-Tone Chime"
              >
                <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                <span>Test Chime</span>
              </button>
            </div>
          </div>

          {/* Right Column: Callback & Inspection Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {!isCallbackLogged ? (
              <button
                type="button"
                onClick={() => setShowLogModal(true)}
                className="px-4 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-black text-xs shadow-lg shadow-rose-500/30 transition cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>Log 15-Min Callback</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowLogModal(true)}
                className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span>Edit Callback Log</span>
              </button>
            )}

            {onInspectOrder && (
              <button
                type="button"
                onClick={() => onInspectOrder(criticalItem)}
                className="px-3.5 py-3 rounded-2xl bg-[#0c1a24] hover:bg-[#122432] border border-white/15 text-white font-bold text-xs transition cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="hidden sm:inline">Inspect STAT</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 15-Minute Emergency Callback Logging Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#0c1a24] border border-rose-500/40 text-white p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-rose-400 block">
                  CAP / NABL ISO 15189 Quality Mandate
                </span>
                <h4 className="text-lg font-display font-black text-white">
                  Log 15-Min Critical Value Communication
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                title="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSaveCallback} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-[11px] space-y-1">
                <div>
                  Patient: <strong>{criticalItem.patientName}</strong> ({criticalItem.orderNo || criticalItem.id})
                </div>
                <div>
                  Panic Findings: <strong>{criticalItem.biomarker || 'Troponin-I'} {criticalItem.value || '0.88 ng/mL'}</strong>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-200 block mb-1">
                  Recipient Treating Physician / Department
                </label>
                <input
                  type="text"
                  value={recipientDoc}
                  onChange={(e) => setRecipientDoc(e.target.value)}
                  placeholder="e.g. Dr. K. Prasad (Cardiology ICU)"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-[#07151f] border border-white/15 text-white focus:outline-none focus:ring-2 focus:ring-rose-400 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-200 block mb-1">
                  Communication Notes & Clinical Orders Received
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-[#07151f] border border-white/15 text-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>

              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={readbackVerified}
                  onChange={(e) => setReadbackVerified(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-500 focus:ring-emerald-400 bg-slate-900 border-white/20"
                />
                <div>
                  <strong className="text-white block">Closed-Loop Verbal Read-Back Confirmed</strong>
                  <span className="text-[10px] text-slate-300">
                    Recipient repeated patient name, UHID, biomarker, and numerical panic value to verify accuracy.
                  </span>
                </div>
              </label>

              <div className="pt-2 flex justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Confirm & Archive Callback SLA</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

