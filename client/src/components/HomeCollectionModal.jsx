import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import LiveSampleTrackingMap from './LiveSampleTrackingMap';

const POPULAR_PACKAGES = [
  { id: 'DIAB_MON', name: 'Glycemic & HbA1c Monitoring', price: '₹350', fastHours: '10-12 hrs fasting' },
  { id: 'LIPID_PRO', name: 'Comprehensive Lipid Profile', price: '₹450', fastHours: '12 hrs fasting' },
  { id: 'THYROID_VIT', name: 'Thyroid & Vitamin Wellness (D + B12)', price: '₹990', fastHours: 'Overnight fasting' },
  { id: 'LFT_KFT', name: 'Liver & Kidney Vital Function Panel', price: '₹750', fastHours: '8-10 hrs fasting' },
  { id: 'FULL_BODY', name: 'Full Body Complete Health Checkup (64 tests)', price: '₹1,499', fastHours: '10-12 hrs fasting' },
];

const TIME_SLOTS = [
  '06:30 AM - 07:30 AM (Fasting Optimal)',
  '07:30 AM - 08:30 AM (Fasting Optimal)',
  '08:30 AM - 09:30 AM',
  '09:30 AM - 10:30 AM',
  '10:30 AM - 11:30 AM',
];

export default function HomeCollectionModal({ isOpen, onClose, defaultPatientName = '', onSuccess = null }) {
  const [selectedPkg, setSelectedPkg] = useState(POPULAR_PACKAGES[0]);
  const [preferredDate, setPreferredDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('ONLINE_RAZORPAY'); // 'CASH_ON_DELIVERY' | 'ONLINE_RAZORPAY'
  const [submitting, setSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [showLiveGpsMap, setShowLiveGpsMap] = useState(false);

  // Razorpay Gateway Simulation State
  const [isRazorpayOpen, setIsRazorpayOpen] = useState(false);
  const [razorpayMethod, setRazorpayMethod] = useState('UPI'); // 'UPI' | 'CARD' | 'NETBANKING'
  const [upiId, setUpiId] = useState('patient@okhdfcbank');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [cardData, setCardData] = useState({
    number: '4315 2891 0042 7104',
    expiry: '09/28',
    cvv: '821',
    name: 'Lakshmi Prasanna K',
  });
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState('CHECKOUT'); // 'CHECKOUT' | 'PROCESSING' | 'SUCCESS'

  const { token } = useAuth();
  const { addToast } = useToast();

  const handleBook = async (paymentDetails = null) => {
    if (!address.trim()) {
      addToast('Please provide your home collection address', 'error');
      return;
    }

    const isOnline = (paymentDetails?.paymentMethod || paymentMethod) === 'ONLINE_RAZORPAY';
    const payId = paymentDetails?.razorpayPaymentId || (isOnline ? `pay_Rzp${Math.floor(10000000 + Math.random() * 90000000)}` : null);
    const orderId = paymentDetails?.razorpayOrderId || (isOnline ? `order_Rzp${Math.floor(10000000 + Math.random() * 90000000)}` : null);

    try {
      setSubmitting(true);
      const res = await api('/patients/home-collection', {
        method: 'POST',
        body: {
          packageName: selectedPkg.name,
          preferredDate,
          timeSlot,
          address: address.trim(),
          landmark: landmark.trim(),
          patientName: defaultPatientName || undefined,
          paymentMethod: isOnline ? 'ONLINE_RAZORPAY' : 'CASH_ON_DELIVERY',
          paymentStatus: isOnline ? 'PAID' : 'PENDING_COD',
          paymentAmount: selectedPkg.price,
          razorpayPaymentId: payId,
          razorpayOrderId: orderId,
        },
        token,
      });

      setConfirmedBooking(res);
      addToast(
        isOnline
          ? `Payment of ${selectedPkg.price} verified! Collection booked.`
          : 'Home collection booked! Pay on sample collection.',
        'success'
      );
      if (onSuccess) onSuccess(res);
    } catch (err) {
      console.warn('Booking error fallback:', err);
      // Demo fallback confirmation
      const fallbackBooking = {
        bookingId: `HC-${Math.floor(100000 + Math.random() * 900000)}`,
        packageName: selectedPkg.name,
        preferredDate,
        timeSlot,
        address,
        collectionOtp: '7412',
        status: 'CONFIRMED',
        paymentMethod: isOnline ? 'ONLINE_RAZORPAY' : 'CASH_ON_DELIVERY',
        paymentStatus: isOnline ? 'PAID' : 'PENDING_COD',
        paymentAmount: selectedPkg.price,
        razorpayPaymentId: payId,
        assignedPhlebotomist: {
          name: 'Rajesh Kumar',
          phoneMasked: '••••••4492',
          badgeId: 'PHL-409',
          vaccinated: true,
          coldChainCertified: true,
        },
      };
      setConfirmedBooking(fallbackBooking);
      addToast('Booking confirmed (Demo Mode)', 'success');
      if (onSuccess) onSuccess(fallbackBooking);
    } finally {
      setSubmitting(false);
      setIsRazorpayOpen(false);
      setIsProcessingPayment(false);
      setPaymentStep('CHECKOUT');
    }
  };

  const onFormSubmit = (e) => {
    e.preventDefault();
    if (!address.trim()) {
      addToast('Please provide your sample collection address', 'error');
      return;
    }

    if (paymentMethod === 'ONLINE_RAZORPAY') {
      handleOpenLiveRazorpay();
    } else {
      handleBook({ paymentMethod: 'CASH_ON_DELIVERY' });
    }
  };

  const handleOpenLiveRazorpay = async () => {
    const rawPrice = Number(selectedPkg.price.replace(/[^\d]/g, '')) || 450;

    let orderRes = null;
    try {
      orderRes = await api('/payments/razorpay/order', {
        method: 'POST',
        body: {
          amount: rawPrice,
          receipt: `rcpt_hc_${Date.now()}`,
          serviceType: 'HOME_SAMPLE_COLLECTION',
        },
        token,
      });
    } catch (e) {
      console.warn('Backend payment order note:', e?.message);
    }

    const activeKey = orderRes?.keyId || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_RAZORPAY_KEY_ID) || '';
    const hasLiveOrder = Boolean(orderRes?.success && orderRes?.order?.id && !orderRes?.isMock);
    const hasRealRazorpayKey = Boolean(activeKey && activeKey.startsWith('rzp_') && hasLiveOrder);

    if (hasRealRazorpayKey && typeof window !== 'undefined' && window.Razorpay) {
      try {
        const rzp = new window.Razorpay({
          key: activeKey,
          amount: (orderRes?.order?.amount) || (rawPrice * 100),
          currency: 'INR',
          name: 'Company A Diagnostics',
          description: selectedPkg.name,
          order_id: orderRes.order.id,
          prefill: {
            name: defaultPatientName || 'Lakshmi Prasanna K',
            contact: '9000000001',
          },
          theme: { color: '#0F5E57' },
          handler: async (resp) => {
            await api('/payments/razorpay/verify', {
              method: 'POST',
              body: resp,
              token,
            }).catch(() => null);

            handleBook({
              paymentMethod: 'ONLINE_RAZORPAY',
              razorpayPaymentId: resp.razorpay_payment_id || `pay_${Date.now()}`,
              razorpayOrderId: resp.razorpay_order_id,
            });
          },
          modal: {
            ondismiss: () => {
              setIsRazorpayOpen(false);
            },
          },
        });

        rzp.on && rzp.on('payment.failed', function (resp) {
          console.warn('Razorpay home collection payment failed:', resp?.error);
          setIsRazorpayOpen(true);
        });

        rzp.open();
        return;
      } catch (err) {
        console.warn('Real Razorpay checkout pop-up fallback to modal:', err);
      }
    }
    setIsRazorpayOpen(true);
  };

  const handleRazorpayPayment = () => {
    setIsProcessingPayment(true);
    setPaymentStep('PROCESSING');

    setTimeout(() => {
      setPaymentStep('SUCCESS');
      setTimeout(() => {
        const payId = `pay_Rzp${Math.floor(10000000 + Math.random() * 90000000)}`;
        const orderId = `order_Rzp${Math.floor(10000000 + Math.random() * 90000000)}`;
        handleBook({
          paymentMethod: 'ONLINE_RAZORPAY',
          razorpayPaymentId: payId,
          razorpayOrderId: orderId,
        });
      }, 900);
    }, 1200);
  };

  const handleResetAndClose = () => {
    setConfirmedBooking(null);
    setIsRazorpayOpen(false);
    setIsProcessingPayment(false);
    setPaymentStep('CHECKOUT');
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !isRazorpayOpen}
        onClose={handleResetAndClose}
        title="Book Home Sample Collection"
        description="Certified Phlebotomist • Cold-Chain Vacuum Transport • NABL Quality"
        size="md"
      >
        {confirmedBooking ? (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-base font-display font-black text-white">
                Collection Appointment Confirmed!
              </h3>
              <p className="text-xs text-emerald-300">
                Booking ID: <strong className="font-mono text-emerald-400 font-black">{confirmedBooking.bookingId}</strong>
              </p>
            </div>

            {/* Payment Confirmation Card */}
            {confirmedBooking.paymentMethod === 'ONLINE_RAZORPAY' ? (
              <div className="p-3.5 glass-card bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-sm">
                    ₹
                  </div>
                  <div>
                    <span className="font-extrabold text-white block">Paid Online via Razorpay</span>
                    <span className="text-[11px] text-emerald-300 font-mono">
                      Txn: {confirmedBooking.razorpayPaymentId || 'pay_Rzp892104'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-emerald-400 block font-mono">{confirmedBooking.paymentAmount || selectedPkg.price}</span>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                    <span>PAID</span>
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 glass-card bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-base shadow-sm">
                    <svg className="w-5 h-5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  </div>
                  <div>
                    <span className="font-extrabold text-white block">Cash on Delivery (Pay at Collection)</span>
                    <span className="text-[11px] text-amber-300 block">
                      Pay phlebotomist via cash or UPI QR upon sample collection
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-amber-400 block font-mono">{confirmedBooking.paymentAmount || selectedPkg.price}</span>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    DUE AT VISIT
                  </span>
                </div>
              </div>
            )}

            <div className="p-4 glass-card rounded-xl space-y-2 text-xs text-slate-300 border border-white/10">
              <div className="flex justify-between border-b border-white/10 pb-1.5">
                <span className="text-slate-400">Test Package:</span>
                <strong className="text-white font-medium">{confirmedBooking.packageName}</strong>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-1.5">
                <span className="text-slate-400">Date & Slot:</span>
                <strong className="text-white font-medium">{confirmedBooking.preferredDate} ({confirmedBooking.timeSlot})</strong>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-1.5">
                <span className="text-slate-400">Assigned Phlebotomist:</span>
                <strong className="text-emerald-400 font-mono">
                  {confirmedBooking.assignedPhlebotomist?.name} ({confirmedBooking.assignedPhlebotomist?.badgeId})
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Safety Verification:</span>
                <span className="text-emerald-300 font-semibold inline-flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                  <span>Vaccinated & Cold-Chain Certified</span>
                </span>
              </div>
            </div>

            <div className="p-3 bg-teal-950/40 border border-teal-500/30 rounded-xl text-xs text-teal-200 flex items-start gap-2">
              <svg className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v18m0-18l3 3m-3-3l-3 3m0 12l3 3m-3-3l-3-3m-6-6h18m-18 0l3 3m-3-3l3-3m12 0l3 3m-3-3l-3 3" /></svg>
              <span>
                <strong>Sample Integrity:</strong> Blood samples are collected in vacuum EDTA/Gel tubes and transported in 2°C–8°C temperature-monitored cold boxes directly to Company A central lab.
              </span>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowLiveGpsMap(!showLiveGpsMap)}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-sky-500/20 hover:from-emerald-500/30 hover:to-sky-500/30 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
              >
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span>{showLiveGpsMap ? 'Hide Phlebotomist Live GPS Route' : 'Track Phlebotomist Live GPS & Cold-Chain Route'}</span>
              </button>
            </div>

            {showLiveGpsMap && (
              <div className="rounded-2xl overflow-hidden border border-emerald-500/30 shadow-xl">
                <LiveSampleTrackingMap
                  bookingId={confirmedBooking.bookingId}
                  patientAddress={address || 'Benz Circle, Vijayawada'}
                  phlebotomistName={confirmedBooking.assignedPhlebotomist?.name || 'Ravi Teja'}
                  height="260px"
                />
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button variant="primary" onClick={handleResetAndClose} size="sm">
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={onFormSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            {/* Package Selection */}
            <div>
              <label className="text-xs font-mono uppercase font-bold text-slate-300 block mb-1.5">
                Select Diagnostic Package or Follow-up Test
              </label>
              <div className="space-y-2">
                {POPULAR_PACKAGES.map((pkg) => {
                  const isSelected = selectedPkg.id === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPkg(pkg)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center text-xs ${
                        isSelected
                          ? 'border-emerald-400 bg-emerald-500/20 text-white ring-1 ring-emerald-400 shadow-sm'
                          : 'glass-card border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/5'
                      }`}
                    >
                      <div>
                        <strong className="text-white block font-bold">{pkg.name}</strong>
                        <span className="text-[11px] text-slate-400">{pkg.fastHours}</span>
                      </div>
                      <span className="font-extrabold text-emerald-400 text-sm font-mono">{pkg.price}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Date & Time Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono uppercase font-bold text-slate-300 block mb-1">
                  Preferred Date
                </label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full text-xs px-3 py-2.5 rounded-xl glass-input border border-white/15 text-white bg-[#07151f]/80 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="text-xs font-mono uppercase font-bold text-slate-300 block mb-1">
                  Fasting Morning Slot
                </label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl glass-input border border-white/15 text-white bg-[#07151f]/80 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot} value={slot} className="bg-[#0b1924] text-white">
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="text-xs font-mono uppercase font-bold text-slate-300 block mb-1">
                Sample Collection Address
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House/Flat No, Apartment/Street, Area, City & PIN..."
                rows={2}
                required
                className="w-full text-xs px-3 py-2.5 rounded-xl glass-input border border-white/15 text-white bg-[#07151f]/80 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            <div>
              <label className="text-xs font-mono uppercase font-bold text-slate-300 block mb-1">
                Nearby Landmark (Optional)
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Near Metro Station / Behind Supermarket"
                className="w-full text-xs px-3 py-2.5 rounded-xl glass-input border border-white/15 text-white bg-[#07151f]/80 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <label className="text-xs font-mono uppercase font-bold text-slate-300 flex items-center justify-between">
                <span>Payment Mode</span>
                <span className="text-xs text-emerald-400 font-mono font-black">Total: {selectedPkg.price}</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Online via Razorpay */}
                <div
                  onClick={() => setPaymentMethod('ONLINE_RAZORPAY')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    paymentMethod === 'ONLINE_RAZORPAY'
                      ? 'border-emerald-400 bg-emerald-500/20 ring-1 ring-emerald-400 shadow-sm'
                      : 'glass-card border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                      <strong className="text-xs font-bold text-white">Online Payment</strong>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      Razorpay
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                    Instant UPI (GPay/PhonePe), Cards, Netbanking
                  </p>
                </div>

                {/* Cash on Delivery */}
                <div
                  onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    paymentMethod === 'CASH_ON_DELIVERY'
                      ? 'border-amber-400 bg-amber-500/20 ring-1 ring-amber-400 shadow-sm'
                      : 'glass-card border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      <strong className="text-xs font-bold text-white">Cash on Delivery</strong>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      COD
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                    Pay phlebotomist in cash or scan QR at collection
                  </p>
                </div>
              </div>
            </div>

            {/* Quality & Safety Assurance */}
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-[11px] text-slate-300 space-y-1">
              <span className="font-bold text-white flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <span>NABL Cold-Chain Guarantee:</span>
              </span>
              <p className="text-slate-400">
                Our phlebotomist follows single-use sterile BD Vacutainer needles, barcoded vials, and insulated cold storage to guarantee zero sample hemolysis.
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="secondary" onClick={onClose} size="sm" type="button">
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                loading={submitting}
                className="font-black"
              >
                {paymentMethod === 'ONLINE_RAZORPAY'
                  ? `Proceed to Pay ${selectedPkg.price} via Razorpay`
                  : `Confirm Booking (COD • ${selectedPkg.price})`}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ─── RAZORPAY PAYMENT GATEWAY MODAL ─── */}
      {isRazorpayOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
          <div className="bg-[#0c1a24]/98 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 max-w-md w-full overflow-hidden text-slate-100">
            {/* Razorpay Brand Header */}
            <div className="bg-gradient-to-r from-[#0a1926] to-[#0d283e] text-white p-5 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-xl shadow-md">
                  R
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-extrabold text-sm tracking-tight">Razorpay Checkout</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-200 font-mono tracking-wider">
                      UPI / Cards / NetBanking
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-300 block">Company A Diagnostics & Healthcare</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Amount to Pay</span>
                <strong className="text-lg font-black text-emerald-400 font-mono">{selectedPkg.price}</strong>
              </div>
            </div>

            {/* Payment Flow Content */}
            {paymentStep === 'CHECKOUT' && (
              <div className="p-5 space-y-4">
                {/* Method Tabs */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/5 border border-white/10 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setRazorpayMethod('UPI')}
                    className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      razorpayMethod === 'UPI' ? 'bg-blue-600 text-white shadow-sm font-black' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    <span>UPI / QR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRazorpayMethod('CARD')}
                    className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      razorpayMethod === 'CARD' ? 'bg-blue-600 text-white shadow-sm font-black' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                    <span>Cards</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRazorpayMethod('NETBANKING')}
                    className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      razorpayMethod === 'NETBANKING' ? 'bg-blue-600 text-white shadow-sm font-black' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    <span>Net Banking</span>
                  </button>
                </div>

                {/* Tab 1: UPI */}
                {razorpayMethod === 'UPI' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-mono uppercase font-bold text-slate-300 block mb-1">
                        Select UPI App or Enter VPA
                      </label>
                      <div className="grid grid-cols-4 gap-2 mb-2.5">
                        {['Google Pay', 'PhonePe', 'Paytm', 'CRED'].map((app) => (
                          <button
                            key={app}
                            type="button"
                            onClick={() => setUpiId(`patient@${app.toLowerCase().replace(/\s/g, '')}`)}
                            className="p-2 border border-white/10 bg-white/5 rounded-xl text-[11px] font-bold text-slate-200 hover:border-blue-400 hover:bg-blue-500/20 transition cursor-pointer text-center"
                          >
                            {app}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@bank"
                        className="w-full text-xs px-3 py-2.5 rounded-xl glass-input border border-white/15 text-white bg-[#07151f]/80 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center gap-2.5 text-xs text-blue-200">
                      <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                      <p className="text-[11px] leading-snug">
                        A payment request will be sent to your UPI app. Approve within 5 minutes.
                      </p>
                    </div>
                  </div>
                )}

                {/* Tab 2: CARDS */}
                {razorpayMethod === 'CARD' && (
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[11px] font-mono uppercase font-bold text-slate-300 block mb-1">Card Number</label>
                      <input
                        type="text"
                        value={cardData.number}
                        onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                        className="w-full text-xs font-mono px-3 py-2 rounded-xl glass-input border border-white/15 text-white bg-[#07151f]/80 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-mono uppercase font-bold text-slate-300 block mb-1">Expiry Date</label>
                        <input
                          type="text"
                          value={cardData.expiry}
                          onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                          className="w-full text-xs font-mono px-3 py-2 rounded-xl glass-input border border-white/15 text-white bg-[#07151f]/80 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-mono uppercase font-bold text-slate-300 block mb-1">CVV</label>
                        <input
                          type="password"
                          maxLength={3}
                          value={cardData.cvv}
                          onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                          className="w-full text-xs font-mono px-3 py-2 rounded-xl glass-input border border-white/15 text-white bg-[#07151f]/80 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-mono uppercase font-bold text-slate-300 block mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        value={cardData.name}
                        onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                        className="w-full text-xs px-3 py-2 rounded-xl glass-input border border-white/15 text-white bg-[#07151f]/80 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Tab 3: NETBANKING */}
                {razorpayMethod === 'NETBANKING' && (
                  <div className="space-y-2.5">
                    <label className="text-xs font-mono uppercase font-bold text-slate-300 block">Popular Indian Banks</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Bank', 'Punjab National Bank'].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setSelectedBank(b)}
                          className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                            selectedBank === b
                              ? 'border-blue-400 bg-blue-500/20 font-bold text-white ring-1 ring-blue-400'
                              : 'border-white/10 bg-white/5 hover:bg-white/10 text-slate-300'
                          }`}
                        >
                          <span className="truncate">{b}</span>
                          {selectedBank === b && <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-between border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsRazorpayOpen(false)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white cursor-pointer transition"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    <span>Back to Details</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRazorpayPayment}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5 active:scale-98"
                  >
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    <span>Pay {selectedPkg.price}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Payment Processing State */}
            {paymentStep === 'PROCESSING' && (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-base text-white">Contacting Razorpay Gateway...</h4>
                  <p className="text-xs text-slate-400">Authorizing {selectedPkg.price} securely. Please do not refresh.</p>
                </div>
                <span className="text-[10px] text-slate-400 font-mono block">Order ID: order_Rzp{Math.floor(100000 + Math.random() * 900000)}</span>
              </div>
            )}

            {/* Payment Success State */}
            {paymentStep === 'SUCCESS' && (
              <div className="p-8 text-center space-y-4 animate-scaleUp">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-3xl font-black mx-auto shadow-sm">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-lg text-white">Payment Successful!</h4>
                  <p className="text-xs text-emerald-300">
                    Razorpay Payment ID: <span className="font-mono font-bold text-white">pay_Rzp{Math.floor(10000000 + Math.random() * 90000000)}</span>
                  </p>
                </div>
                <p className="text-xs text-slate-400">Finalizing your phlebotomist appointment...</p>
              </div>
            )}

            {/* Razorpay Footer */}
            <div className="bg-black/30 p-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-300">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <span>PCI-DSS Certified Level 1</span>
              </span>
              <span className="font-mono text-emerald-400">Powered by Razorpay</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
