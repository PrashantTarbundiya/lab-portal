import { useState, useEffect } from 'react';

export default function VoiceReadButton({ text, lang = 'en', className = '' }) {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true);
    }
  }, []);

  const handleToggleSpeak = () => {
    if (!supported || !text) return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92; // Slightly slower for clinical clarity
    utterance.pitch = 1.0;

    // Language code mapping
    if (lang === 'te') {
      utterance.lang = 'te-IN';
    } else if (lang === 'hi') {
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'en-IN';
    }

    // Try finding a matching installed voice
    const voices = window.speechSynthesis.getVoices?.() || [];
    const matchedVoice = voices.find((v) => v.lang.startsWith(utterance.lang));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={handleToggleSpeak}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
        speaking
          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
          : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
      } ${className}`}
      title={speaking ? 'Click to stop reading' : 'Listen to this explanation'}
    >
      {speaking ? (
        <>
          <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
          <span>Stop Listening</span>
          <span className="text-[10px] font-mono tracking-widest text-amber-400">ılı.lılllı</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
          <span>{lang === 'te' ? 'వినండి (Listen)' : lang === 'hi' ? 'सुनिए (Listen)' : 'Listen Aloud'}</span>
        </>
      )}
    </button>
  );
}

