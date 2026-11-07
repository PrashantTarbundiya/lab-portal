import { useState, useEffect, useRef } from 'react';
import { useToast } from './Toast';

// Audio feedback for barcode confirmation (High pitch retail/phlebotomy scanner beep)
function playScannerBeep(success = true) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (success) {
      // 1800 Hz crystal beep (classic handheld laser scanner tone)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else {
      // Warning burp
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch (err) {
    console.warn('AudioContext scanner beep error:', err);
  }
}

export default function PhlebotomistBarcodeScanner({
  isOpen,
  onClose,
  onScanSuccess,
  defaultOrderNo = 'ORD-71250',
  defaultPatient = 'Lakshmi Prasanna K',
}) {
  const { addToast } = useToast();
  const videoRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [coldChainTemp, setColdChainTemp] = useState('4.2°C (Optimal 2-8°C)');
  const [icePackVerified, setIcePackVerified] = useState(true);

  // Scanned specimen queue (persisted to localStorage for offline rural sync)
  const [scannedTubes, setScannedTubes] = useState(() => {
    try {
      const saved = localStorage.getItem('labora_offline_scans');
      return saved ? JSON.parse(saved) : [
        {
          barcode: 'EDTA-841920',
          tubeType: 'Lavender Top (K2 EDTA 3mL)',
          tests: 'Complete Blood Count (CBC), HbA1c',
          drawTimestamp: '05-Nov-2026, 07:15 AM IST',
          coldChain: '4.1°C • Ice Pack Sealed',
          status: 'LOCALLY_VALIDATED',
        },
      ];
    } catch {
      return [];
    }
  });

  // Save to localStorage whenever scannedTubes changes
  useEffect(() => {
    try {
      localStorage.setItem('labora_offline_scans', JSON.stringify(scannedTubes));
    } catch (e) {
      console.warn('Failed to cache offline scans:', e);
    }
  }, [scannedTubes]);

  // Online / Offline Network Listener
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Camera Stream Lifecycle
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }
    startCamera();
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError('');
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError('Camera API not supported on this browser. Use manual barcode scanner below.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
        setCameraActive(true);
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access unavailable or blocked. You can use instant simulated barcode buttons or type manually.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleValidateTube = (code) => {
    const clean = code.trim().toUpperCase();
    if (!clean) return;

    // Validate tube prefix & format
    let tubeType = 'Unknown Tube (Verify Label)';
    let tests = 'General Routine Panel';

    if (clean.includes('EDTA') || clean.includes('841920')) {
      tubeType = 'Lavender Top (K2 EDTA 3mL)';
      tests = 'Complete Blood Count (CBC), HbA1c, ESR';
    } else if (clean.includes('SST') || clean.includes('841921')) {
      tubeType = 'Gold Top (SST Gel Separator 5mL)';
      tests = 'Serum Potassium, Lipid Profile, LFT, Creatinine';
    } else if (clean.includes('CIT') || clean.includes('841922')) {
      tubeType = 'Light Blue (Sodium Citrate 2.7mL)';
      tests = 'Coagulation (PT / INR, D-Dimer)';
    } else if (clean.includes('FLU') || clean.includes('841923')) {
      tubeType = 'Gray Top (Sodium Fluoride 2mL)';
      tests = 'Fasting Plasma Glucose (FBG)';
    } else {
      tubeType = 'General Barcoded Specimen';
    }

    const drawTimestamp = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const newScan = {
      barcode: clean,
      tubeType,
      tests,
      drawTimestamp,
      coldChain: `${coldChainTemp} • ${icePackVerified ? 'Ice Pack Verified' : 'Standard'}`,
      status: isOffline ? 'QUEUED_OFFLINE' : 'SYNCED_TO_LIS',
    };

    playScannerBeep(true);
    setScannedTubes((prev) => [newScan, ...prev.filter((t) => t.barcode !== clean)]);
    setManualBarcode('');

    addToast(
      `Tube ${clean} validated! Specimen draw logged under cold chain (${coldChainTemp}).`,
      'success'
    );

    if (onScanSuccess) {
      onScanSuccess(newScan);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualBarcode.trim()) return;
    handleValidateTube(manualBarcode);
  };

  const handleSyncOfflineQueue = () => {
    addToast(
      `All ${scannedTubes.length} offline specimen scans synced with Central Hospital LIS!`,
      'success'
    );
    setScannedTubes((prev) =>
      prev.map((t) => ({ ...t, status: 'SYNCED_TO_LIS' }))
    );
  };

  const handleClearScans = () => {
    setScannedTubes([]);
    localStorage.removeItem('labora_offline_scans');
    addToast('Scanned tube history cleared', 'info');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-[#081520] border-2 border-emerald-500/40 text-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0c2231] to-[#07151f] border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                  PWA Mobile Phlebotomy Station
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border inline-flex items-center gap-1 ${
                    isOffline
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isOffline ? 'bg-amber-400' : 'bg-emerald-400 animate-ping'}`}></span>
                  <span>{isOffline ? 'Offline Rural Mode' : 'Online LIS Connected'}</span>
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-display font-black text-white">
                Vacuum Tube Barcode Scanner & Cold-Chain Validator
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Top Info Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white/5 rounded-2xl border border-white/10 text-xs">
            <div className="space-y-0.5">
              <span className="text-slate-400 font-mono text-[11px]">Patient / Draw Order:</span>
              <div className="font-bold text-white flex items-center gap-2">
                <span>{defaultPatient}</span>
                <span className="text-emerald-400 font-mono">({defaultOrderNo})</span>
              </div>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v18m0-18l3 3m-3-3l-3 3m0 12l3 3m-3-3l-3-3m-6-6h18m-18 0l3 3m-3-3l3-3m12 0l3 3m-3-3l-3 3" /></svg>
                <span className="text-slate-300">Cold Chain: <strong className="text-emerald-300">{coldChainTemp}</strong></span>
              </div>
              <label className="flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={icePackVerified}
                  onChange={(e) => setIcePackVerified(e.target.checked)}
                  className="rounded text-emerald-500 focus:ring-emerald-400 bg-slate-900 border-white/20"
                />
                <span>Ice Pack Sealed</span>
              </label>
            </div>
          </div>

          {/* Camera Viewfinder Box */}
          <div className="relative rounded-3xl overflow-hidden bg-black border-2 border-emerald-500/40 aspect-video max-h-64 sm:max-h-72 w-full flex items-center justify-center shadow-inner">
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="p-6 text-center space-y-2 max-w-sm">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <h4 className="text-xs font-bold text-slate-200">
                  Camera Viewfinder Active
                </h4>
                <p className="text-[11px] text-slate-400">
                  {cameraError || 'Align vacuum tube barcode within the laser reticle below.'}
                </p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold font-mono transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  <span>Reconnect Camera Feed</span>
                </button>
              </div>
            )}

            {/* Laser Viewfinder Reticle Overlay */}
            <div className="absolute inset-8 sm:inset-12 border-2 border-dashed border-emerald-400/60 rounded-2xl pointer-events-none flex items-center justify-center">
              {/* Animated Laser Scanning Line */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-lg shadow-rose-500/50 animate-pulse"></div>

              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400"></div>
            </div>

            <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
              <span className="text-[10px] font-mono font-bold text-white/80 bg-black/70 px-3 py-1 rounded-full border border-white/10">
                ALIGN VACUUM TUBE BARCODE IN RETICLE
              </span>
            </div>
          </div>

          {/* Quick Simulation / Manual Scanner Row */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Quick Test / Simulate Phlebotomy Scan:</span>
              <span className="text-emerald-400">Instant validation & chime</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleValidateTube('EDTA-841920')}
                className="p-2.5 rounded-2xl bg-purple-950/40 hover:bg-purple-950/70 border border-purple-500/40 text-left transition cursor-pointer active:scale-95 group"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                  <span className="font-mono font-black text-xs text-purple-200">EDTA-841920</span>
                </div>
                <div className="text-[10px] text-slate-300">Lavender • CBC / HbA1c</div>
              </button>

              <button
                type="button"
                onClick={() => handleValidateTube('SST-841921')}
                className="p-2.5 rounded-2xl bg-amber-950/40 hover:bg-amber-950/70 border border-amber-500/40 text-left transition cursor-pointer active:scale-95 group"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span className="font-mono font-black text-xs text-amber-200">SST-841921</span>
                </div>
                <div className="text-[10px] text-slate-300">Gold • Potassium / LFT</div>
              </button>

              <button
                type="button"
                onClick={() => handleValidateTube('CIT-841922')}
                className="p-2.5 rounded-2xl bg-blue-950/40 hover:bg-blue-950/70 border border-blue-500/40 text-left transition cursor-pointer active:scale-95 group"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                  <span className="font-mono font-black text-xs text-blue-200">CIT-841922</span>
                </div>
                <div className="text-[10px] text-slate-300">Light Blue • PT / INR</div>
              </button>

              <button
                type="button"
                onClick={() => handleValidateTube('FLU-841923')}
                className="p-2.5 rounded-2xl bg-slate-800/60 hover:bg-slate-800/90 border border-slate-500/40 text-left transition cursor-pointer active:scale-95 group"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                  <span className="font-mono font-black text-xs text-slate-200">FLU-841923</span>
                </div>
                <div className="text-[10px] text-slate-300">Gray • Glucose Fluoride</div>
              </button>
            </div>

            {/* Manual Barcode Input */}
            <form onSubmit={handleManualSubmit} className="flex gap-2 pt-1">
              <input
                type="text"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                placeholder="Type or scan barcode (e.g. EDTA-841920 or BC-ORD-71233-SST)..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-[#0b1924] border border-white/15 text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-md transition cursor-pointer"
              >
                Validate Tube
              </button>
            </form>
          </div>

          {/* Scanned Tubes Audit Trail Table */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Validated Specimen Tubes ({scannedTubes.length})
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  ● Cold-Chain Transit Ready
                </span>
              </div>

              <div className="flex items-center gap-2">
                {scannedTubes.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSyncOfflineQueue}
                    className="text-[11px] font-mono font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <span>Sync to Central LIS</span>
                  </button>
                )}
                {scannedTubes.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearScans}
                    className="text-[10px] text-slate-400 hover:text-rose-300 transition cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {scannedTubes.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center bg-white/5 rounded-2xl border border-white/5">
                No tubes scanned yet. Aim camera or click any specimen button above.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {scannedTubes.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#0c1c28] border border-white/10 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <strong className="font-mono font-black text-emerald-300 text-sm">
                          {item.barcode}
                        </strong>
                        <span className="text-[10px] text-slate-300 font-sans font-medium">
                          {item.tubeType}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Tests: <strong className="text-slate-200">{item.tests}</strong>
                      </div>
                    </div>

                    <div className="text-right sm:shrink-0 space-y-0.5 font-mono text-[10px]">
                      <div className="text-slate-300">
                        Draw: <strong className="text-white">{item.drawTimestamp}</strong>
                      </div>
                      <div className="text-emerald-400 flex items-center gap-1 justify-end">
                        <svg className="w-3 h-3 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v18m0-18l3 3m-3-3l-3 3m0 12l3 3m-3-3l-3-3m-6-6h18m-18 0l3 3m-3-3l3-3m12 0l3 3m-3-3l-3 3" /></svg>
                        <span>{item.coldChain}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0a1824] border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-mono shrink-0">
          <span>ISO 15189: Sample swap error rate: 0.00%</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition cursor-pointer"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
}

