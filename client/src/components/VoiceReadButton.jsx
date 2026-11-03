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
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer ${
        speaking
          ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
      } ${className}`}
      title={speaking ? 'Click to stop reading' : 'Listen to this explanation'}
    >
      {speaking ? (
        <>
          <span className="text-amber-600">■</span>
          <span>Stop Listening</span>
          <span className="text-[10px] font-mono tracking-widest text-amber-700">ılı.lılllı</span>
        </>
      ) : (
        <>
          <span>🔊</span>
          <span>{lang === 'te' ? 'వినండి (Listen)' : lang === 'hi' ? 'सुनिए (Listen)' : 'Listen Aloud'}</span>
        </>
      )}
    </button>
  );
}
