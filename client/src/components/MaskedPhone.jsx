import { useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function MaskedPhone({
  phoneMasked,
  orderId,
  canReveal = false,
  className = '',
}) {
  const [revealedPhone, setRevealedPhone] = useState(null);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const handleReveal = async () => {
    if (!orderId || revealedPhone || loading) return;
    try {
      setLoading(true);
      const res = await api(`/access-log/reveal-phone/${orderId}`, {
        method: 'POST',
        token,
      });
      if (res.phone) {
        setRevealedPhone(res.phone);
      }
    } catch (err) {
      console.error('Failed to reveal phone:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <span className={`inline-flex items-center gap-2 tabular-nums ${className}`}>
      <span>{revealedPhone || phoneMasked || '••••••••••'}</span>
      {canReveal && !revealedPhone && (
        <button
          type="button"
          onClick={handleReveal}
          disabled={loading}
          className="text-xs text-[#0F5E57] hover:underline font-semibold focus:outline-none"
          title="Audit log will record this phone reveal"
        >
          {loading ? '…' : 'Reveal'}
        </button>
      )}
    </span>
  );
}

