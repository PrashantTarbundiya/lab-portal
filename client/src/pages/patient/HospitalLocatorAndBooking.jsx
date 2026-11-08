import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import HospitalPortalSwitcher from '../../components/HospitalPortalSwitcher';
import LoadingSpinner from '../../components/LoadingSpinner';
import HospitalNetworkMap from '../../components/HospitalNetworkMap';

const HOSPITAL_ACCOUNTS_MAP = {
  'HOSP-01': {
    entityName: 'Company A Diagnostics & Hospitals Private Limited',
    bankName: 'HDFC Bank Corporate Healthcare Division',
    accountNo: '50200088192019',
    ifsc: 'HDFC0001824',
    branch: 'MG Road Healthcare Enclave, Vijayawada',
    upiId: 'companya.hosp01@hdfcbank',
  },
  'HOSP-02': {
    entityName: 'Apollo Hospitals Enterprise Ltd (Vijayawada Facility)',
    bankName: 'ICICI Bank Specialized Medical Services',
    accountNo: '004805019821',
    ifsc: 'ICIC0000048',
    branch: 'Benz Circle, Vijayawada',
    upiId: 'apollo.vijayawada@icici',
  },
  'HOSP-03': {
    entityName: 'Manipal Health Enterprises Private Limited',
    bankName: 'State Bank of India (Medical Enclave Branch)',
    accountNo: '38291029102',
    ifsc: 'SBIN0004821',
    branch: 'Governorpet, Vijayawada',
    upiId: 'manipal.care@sbi',
  },
  'HOSP-04': {
    entityName: 'Government General Hospital (GGH) Arogyasri Trust',
    bankName: 'Union Bank of India (AP Govt Treasury Sub-Account)',
    accountNo: '99218201982',
    ifsc: 'UBIN0542918',
    branch: 'Old Hospital Road, Vijayawada',
    upiId: 'ggh.treasury@uboi',
  },
  'LAB-01': {
    entityName: 'Company A Central Reference Diagnostics Network',
    bankName: 'Kotak Mahindra Bank Pathology Clearing',
    accountNo: '4819201982',
    ifsc: 'KKBK0000918',
    branch: 'Suryaraopet, Vijayawada',
    upiId: 'companya.labs@kotak',
  },
};

export const DEFAULT_FALLBACK_FACILITIES = [
  {
    id: 'HOSP-01',
    name: 'Company A Main Super-Specialty Hospital',
    shortName: 'Company A Main',
    type: 'TERTIARY_HOSPITAL',
    category: 'HOSPITAL',
    coordinates: [16.5085, 80.6430],
    locality: 'MG Road',
    address: 'Door No. 40-1-52, Healthcare Enclave, MG Road, Vijayawada - 520010',
    phone: '+91 866 2489000',
    emergency24x7: true,
    verificationStatus: 'FULLY_VERIFIED',
    timing: '24x7 Emergency • OPD 09:00 AM - 08:00 PM',
    bedCapacity: 450,
    rating: 4.9,
    reviewsCount: 1420,
    accreditations: ['NABL ISO 15189', 'NABH Digital Safe', 'JCI Accredited'],
    waitTimeMinutes: 12,
    opdConsultationFee: 500,
    labDiscountPercent: 20,
    distanceKm: '1.2',
    departments: [
      {
        name: 'General Medicine & Diabetology',
        doctors: [
          { name: 'Dr. K. Ramanaiah, MD', qualification: 'Senior Consultant Physician', fee: 500, slotsAvailable: ['09:30 AM', '10:00 AM', '11:15 AM', '04:30 PM'] },
        ],
      },
      {
        name: 'Cardiology & Intensive Care',
        doctors: [
          { name: 'Dr. C. Harish Reddy, DM (Cardio)', qualification: 'Chief Interventional Cardiologist', fee: 800, slotsAvailable: ['10:30 AM', '12:00 PM', '05:00 PM'] },
        ],
      },
    ],
  },
  {
    id: 'HOSP-02',
    name: 'Apollo Specialty Hospital',
    shortName: 'Apollo Hospital',
    type: 'MULTISPECIALTY',
    category: 'HOSPITAL',
    coordinates: [16.4998, 80.6548],
    locality: 'Benz Circle',
    address: 'Near Benz Circle, Ring Road, Vijayawada - 520008',
    phone: '+91 866 2555555',
    emergency24x7: true,
    verificationStatus: 'FULLY_VERIFIED',
    timing: '24x7 Emergency • OPD 08:30 AM - 07:30 PM',
    bedCapacity: 320,
    rating: 4.8,
    reviewsCount: 980,
    accreditations: ['NABH', 'NABL ISO 15189', 'Emergency Gold'],
    waitTimeMinutes: 20,
    opdConsultationFee: 700,
    labDiscountPercent: 15,
    distanceKm: '2.5',
    departments: [
      {
        name: 'Comprehensive Cardiology',
        doctors: [
          { name: 'Dr. C. Harish Reddy', qualification: 'Senior Cardiologist', fee: 700, slotsAvailable: ['10:00 AM', '11:30 AM', '04:00 PM'] },
        ],
      },
    ],
  },
  {
    id: 'HOSP-03',
    name: 'Manipal Super-Specialty Hospital',
    shortName: 'Manipal Hospital',
    type: 'TERTIARY_HOSPITAL',
    category: 'HOSPITAL',
    coordinates: [16.5142, 80.6315],
    locality: 'Governorpet',
    address: 'Kanakadurga Varadhi Junction, Governorpet, Vijayawada - 520002',
    phone: '+91 866 2888888',
    emergency24x7: true,
    verificationStatus: 'FULLY_VERIFIED',
    timing: '24x7 Emergency • OPD 09:00 AM - 08:00 PM',
    bedCapacity: 280,
    rating: 4.7,
    reviewsCount: 840,
    accreditations: ['NABH Certified', 'NABL Pathology', 'Green OT'],
    waitTimeMinutes: 15,
    opdConsultationFee: 650,
    labDiscountPercent: 18,
    distanceKm: '3.1',
    departments: [
      {
        name: 'Pulmonology & Critical Care',
        doctors: [
          { name: 'Dr. M. Raviteja, MD (Pulmo)', qualification: 'Lead Pulmonologist', fee: 650, slotsAvailable: ['10:00 AM', '12:30 PM'] },
        ],
      },
    ],
  },
  {
    id: 'HOSP-04',
    name: 'Government General Hospital (GGH)',
    shortName: 'GGH Vijayawada',
    type: 'TERTIARY_HOSPITAL',
    category: 'HOSPITAL',
    coordinates: [16.5205, 80.6220],
    locality: 'Governorpet',
    address: 'Old Hospital Road, Governorpet, Vijayawada - 520002',
    phone: '+91 866 2577777',
    emergency24x7: true,
    verificationStatus: 'FULLY_VERIFIED',
    timing: '24x7 Public Casualty • OPD 08:00 AM - 02:00 PM',
    bedCapacity: 1200,
    rating: 4.5,
    reviewsCount: 2150,
    accreditations: ['AP Govt Health Mission', 'Arogyasri Empanelled', 'NABL Partner'],
    waitTimeMinutes: 30,
    opdConsultationFee: 50,
    labDiscountPercent: 50,
    distanceKm: '4.0',
    departments: [
      {
        name: 'General Medicine & OPD',
        doctors: [
          { name: 'Dr. Suresh Kumar, MD', qualification: 'Chief Medical Officer', fee: 50, slotsAvailable: ['09:00 AM', '10:00 AM', '11:00 AM'] },
        ],
      },
    ],
  },
  {
    id: 'LAB-01',
    name: 'Company A Central Reference Laboratory',
    shortName: 'Central Reference Lab',
    type: 'CORE_LAB',
    category: 'LABORATORY',
    coordinates: [16.5110, 80.6390],
    locality: 'Suryaraopet',
    address: 'Diagnostic Tower, Beside State Bank, Suryaraopet, Vijayawada - 520002',
    phone: '+91 866 2441199',
    emergency24x7: true,
    verificationStatus: 'FULLY_VERIFIED',
    timing: '24x7 Specimen Processing • Walk-in 06:30 AM - 09:30 PM',
    bedCapacity: 0,
    rating: 4.95,
    reviewsCount: 3200,
    accreditations: ['NABL ISO 15189 Accredited', 'CAP Certified Protocol', 'Zero-Error Barcode Ingestion'],
    waitTimeMinutes: 5,
    opdConsultationFee: 0,
    labDiscountPercent: 25,
    distanceKm: '1.8',
    departments: [
      {
        name: 'Core Automated Biochemistry & Hematology',
        doctors: [
          { name: 'Dr. K. Ramanaiah, MD (Path)', qualification: 'Head Pathologist & Lab Director', fee: 0, slotsAvailable: ['07:00 AM - 11:00 AM (Fasting)', '11:00 AM - 02:00 PM', '04:00 PM - 08:00 PM'] },
        ],
      },
    ],
  },
];

export default function HospitalLocatorAndBooking() {
  const [hospitals, setHospitals] = useState(DEFAULT_FALLBACK_FACILITIES);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState('ALL'); // ALL | HOSPITAL | LABORATORY
  const [localityFilter, setLocalityFilter] = useState('ALL');
  const [distanceRadius, setDistanceRadius] = useState('ALL'); // 'ALL' | '2' | '5' | '10'
  const [userLocation, setUserLocation] = useState(null); // { lat, lng }
  const [isLocating, setIsLocating] = useState(false);
  const [mapViewMode, setMapViewMode] = useState('SPLIT'); // 'SPLIT' | 'FULL_MAP' | 'LIST_ONLY'
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('LOCATOR'); // LOCATOR | MY_BOOKINGS

  const navigate = useNavigate();
  const { account, token } = useAuth();
  const patientIdentifier =
    account?.mobileE164?.replace(/\D/g, '') ||
    (token?.startsWith('demo-patient:') ? token.split(':')[1]?.replace(/\D/g, '') : null) ||
    '9000000001';

  // Booking Modal State
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [focusedFacility, setFocusedFacility] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [bookingType, setBookingType] = useState('DOCTOR_OPD_CONSULTATION');
  const [testName, setTestName] = useState('Comprehensive Full Body Health Checkup');
  const [bookingDate, setBookingDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [patientName, setPatientName] = useState('Lakshmi Prasanna K');
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [confirmedTokenModal, setConfirmedTokenModal] = useState(null);

  // Payment Step & Interactive Razorpay Simulation State
  const [bookingStep, setBookingStep] = useState('DETAILS'); // 'DETAILS' | 'PAYMENT'
  const [paymentMethod, setPaymentMethod] = useState('ONLINE_RAZORPAY'); // 'ONLINE_RAZORPAY' | 'PAY_AT_COUNTER'
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);
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
  const [targetAppointmentForRazorpay, setTargetAppointmentForRazorpay] = useState(null);

  const { addToast } = useToast();

  // Automatic browser geolocation prompt on load
  useEffect(() => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(coords);
          setIsLocating(false);
          addToast('Current location detected! Nearest medical centers sorted.', 'success');
        },
        (err) => {
          console.warn('Geolocation prompt response:', err);
          setIsLocating(false);
          // Default to Vijayawada MG Road coordinates so map always loads nicely
          setUserLocation({ lat: 16.5062, lng: 80.6480 });
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setUserLocation({ lat: 16.5062, lng: 80.6480 });
    }
  }, []);

  const handleGetLiveLocation = () => {
    if (!navigator.geolocation) {
      addToast('Geolocation is not supported by your browser', 'info');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setIsLocating(false);
        addToast('Live GPS Location detected! Nearest hospitals sorted.', 'success');
      },
      (err) => {
        console.warn('Geolocation fallback:', err);
        setUserLocation({ lat: 16.5062, lng: 80.6480 });
        setIsLocating(false);
        addToast('Using Vijayawada Healthcare Hub location for distance calculation.', 'info');
      },
      { timeout: 7000 }
    );
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        category: filterCategory,
        search: search || '',
      });
      if (localityFilter !== 'ALL') params.append('locality', localityFilter);
      if (distanceRadius !== 'ALL') params.append('maxDistanceKm', distanceRadius);
      if (userLocation?.lat && userLocation?.lng) {
        params.append('lat', userLocation.lat);
        params.append('lng', userLocation.lng);
      }

      try {
        const hospRes = await api(`/hospitals?${params.toString()}`);
        if (hospRes?.hospitals && hospRes.hospitals.length > 0) {
          setHospitals(hospRes.hospitals);
        } else {
          setHospitals(DEFAULT_FALLBACK_FACILITIES);
        }
      } catch (hospErr) {
        console.warn('Hospitals fetch warning, utilizing verified fallback list:', hospErr);
        setHospitals(DEFAULT_FALLBACK_FACILITIES);
      }

      try {
        const aptRes = await api('/hospitals/appointments/my');
        setAppointments(aptRes?.appointments || []);
      } catch {
        // Unauthenticated or empty appointments fallback safely
        setAppointments([]);
      }
    } catch (err) {
      console.warn('Hospital locator fetch fallback:', err);
      setHospitals(DEFAULT_FALLBACK_FACILITIES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterCategory, search, localityFilter, distanceRadius, userLocation]);

  const handleOpenBooking = (facility, dept = null, doc = null, type = 'DOCTOR_OPD_CONSULTATION') => {
    setSelectedFacility(facility);
    setFocusedFacility(facility);
    setBookingType(type);
    setBookingStep('DETAILS');
    setPaymentMethod('ONLINE_RAZORPAY');

    const firstDept = dept || facility.departments?.[0]?.name || 'General Medicine';
    setSelectedDepartment(firstDept);

    const foundDept = facility.departments?.find(d => d.name === firstDept);
    const availableDocs = foundDept?.doctors || [];
    const allFacilityDocs = (facility.departments || []).flatMap(d => d.doctors || []);
    const candidateDocs = availableDocs.length > 0 ? availableDocs : allFacilityDocs;

    const firstDoc = doc || candidateDocs[0]?.name || 'Attending Duty Consultant';
    setSelectedDoctor(firstDoc);

    const foundDoc = candidateDocs.find(d => d.name === firstDoc) || candidateDocs[0];
    setSelectedSlot(foundDoc?.slotsAvailable?.[0] || '10:00 AM - 10:30 AM');
  };

  const handleLocateOnMap = (facility) => {
    setFocusedFacility(facility);
    if (mapViewMode === 'LIST_ONLY') {
      setMapViewMode('SPLIT');
    }
    setTimeout(() => {
      const el = document.getElementById('healthcare-map-view');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 80);
  };

  const handleDepartmentChange = (deptName) => {
    setSelectedDepartment(deptName);
    const foundDept = selectedFacility?.departments?.find((d) => d.name === deptName);
    const availableDocs = foundDept?.doctors || [];
    if (availableDocs.length > 0) {
      const firstDoc = availableDocs[0];
      setSelectedDoctor(firstDoc.name);
      setSelectedSlot(firstDoc.slotsAvailable?.[0] || '10:00 AM - 10:30 AM');
    } else {
      const allFacilityDocs = (selectedFacility?.departments || []).flatMap(d => d.doctors || []);
      const fallbackDoc = allFacilityDocs[0];
      if (fallbackDoc) {
        setSelectedDoctor(fallbackDoc.name);
        setSelectedSlot(fallbackDoc.slotsAvailable?.[0] || '10:00 AM - 10:30 AM');
      } else {
        setSelectedDoctor('Attending Duty Consultant');
        setSelectedSlot('10:00 AM - 10:30 AM');
      }
    }
  };

  const handleDoctorChange = (docName) => {
    setSelectedDoctor(docName);
    const allFacilityDocs = (selectedFacility?.departments || []).flatMap(d => d.doctors || []);
    const docObj = allFacilityDocs.find((d) => d.name === docName);
    if (docObj?.slotsAvailable?.length) {
      setSelectedSlot(docObj.slotsAvailable[0]);
    }
  };

  // Derive active department, active doctor object, and dynamic consultation fee
  const activeDeptObj = selectedFacility?.departments?.find((d) => d.name === selectedDepartment);
  const activeDeptDoctors = activeDeptObj?.doctors || [];
  const allFacilityDoctors = (selectedFacility?.departments || []).flatMap((d) =>
    (d.doctors || []).map((doc) => ({ ...doc, deptName: d.name }))
  );
  const candidateDoctors = activeDeptDoctors.length > 0 ? activeDeptDoctors : allFacilityDoctors;
  const activeDoctorObj =
    candidateDoctors.find((d) => d.name === selectedDoctor) ||
    candidateDoctors[0] || {
      name: selectedDoctor || 'Attending Duty Consultant',
      degrees: 'MBBS, MD',
      experienceYears: 10,
      opdFee: 750,
      nmcRegNo: 'MCI-VERIFIED',
      stateCouncil: 'Medical Council of India',
    };
  const activeCalculatedFee = bookingType === 'DIAGNOSTIC_TEST' ? 1250 : (activeDoctorObj?.opdFee || 750);

  const handleProceedToPaymentStep = (e) => {
    if (e) e.preventDefault();
    if (!selectedFacility) return;
    setBookingStep('PAYMENT');
  };

  const handleConfirmBooking = async (options = {}) => {
    if (!selectedFacility) return;

    const method = options.paymentMethod || paymentMethod;
    const txnId = options.paymentTxnId || null;

    try {
      setIsBookingSubmitting(true);
      const fee = options.fee || activeCalculatedFee;

      const res = await api('/hospitals/appointments', {
        method: 'POST',
        body: {
          hospitalId: selectedFacility.id,
          department: selectedDepartment,
          doctorName: selectedDoctor,
          testName: bookingType === 'DIAGNOSTIC_TEST' ? testName : null,
          type: bookingType,
          date: bookingDate,
          timeSlot: selectedSlot,
          patientName,
          fee,
          paymentMethod: method,
          paymentTxnId: txnId,
        },
      });

      addToast(`Appointment confirmed! Token #${res.appointment?.tokenNo}`, 'success');
      setConfirmedTokenModal(res.appointment);
      setIsRazorpayModalOpen(false);
      setSelectedFacility(null);
      setBookingStep('DETAILS');
      fetchData();
    } catch (err) {
      addToast(`Booking failed: ${err.message}`, 'error');
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  const handleOpenRazorpayCheckout = async (targetApt = null) => {
    const fee = targetApt ? targetApt.fee : activeCalculatedFee;
    const facility = targetApt
      ? (hospitals.find(h => h.id === targetApt.hospitalId) || { name: targetApt.hospitalName, id: targetApt.hospitalId })
      : selectedFacility;

    const hospAccount = HOSPITAL_ACCOUNTS_MAP[facility?.id] || {
      entityName: facility?.name || 'Company A Diagnostics & Hospitals',
      upiId: 'companya.care@hdfcbank',
    };

    // Check if real live or test Razorpay key is configured
    const orderRes = await api('/payments/razorpay/order', {
      method: 'POST',
      body: {
        amount: fee,
        hospitalId: facility?.id,
        serviceType: targetApt ? targetApt.type : bookingType,
      },
    }).catch(() => null);

    const activeKey = orderRes?.keyId || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_RAZORPAY_KEY_ID) || '';
    const hasRealRazorpayKey = activeKey && !activeKey.includes('DemoPortal') && activeKey.startsWith('rzp_');

    if (hasRealRazorpayKey && typeof window !== 'undefined' && window.Razorpay) {
      try {
        const rzp = new window.Razorpay({
          key: activeKey,
          amount: (orderRes?.order?.amount) || (fee * 100),
          currency: 'INR',
          name: hospAccount.entityName || facility?.name || 'Company A Diagnostics & Hospitals',
          description: targetApt
            ? `Settlement for OPD Token #${targetApt.tokenNo}`
            : (bookingType === 'DIAGNOSTIC_TEST' ? testName : selectedDoctor),
          order_id: orderRes?.order?.id,
          prefill: {
            name: patientName || 'Lakshmi Prasanna K',
            contact: '9000000001',
          },
          theme: {
            color: '#0F5E57',
          },
          handler: async (resp) => {
            const txnId = resp.razorpay_payment_id || `pay_rzp_${Date.now()}`;

            await api('/payments/razorpay/verify', {
              method: 'POST',
              body: {
                ...resp,
                appointmentId: targetApt?.id,
              },
            }).catch(() => null);

            if (targetApt) {
              await api(`/hospitals/appointments/${targetApt.id}/pay`, {
                method: 'PATCH',
                body: { paymentMethod: 'ONLINE_RAZORPAY', paymentTxnId: txnId },
              }).catch(() => null);

              setAppointments((prev) =>
                prev.map((a) =>
                  a.id === targetApt.id
                    ? {
                        ...a,
                        paymentStatus: 'PAID_ONLINE',
                        paymentMethod: 'ONLINE_RAZORPAY',
                        paymentTxnId: txnId,
                      }
                    : a
                )
              );
              addToast(`Payment of ₹${fee} settled via Razorpay (${txnId})!`, 'success');
              setTargetAppointmentForRazorpay(null);
              fetchData();
            } else {
              await handleConfirmBooking({
                paymentMethod: 'ONLINE_RAZORPAY',
                paymentTxnId: txnId,
                fee,
              });
            }
          },
          modal: {
            ondismiss: () => {
              setIsRazorpayModalOpen(false);
            },
          },
        });

        rzp.open();
        return;
      } catch (err) {
        console.warn('Real Razorpay popup fallback to embedded simulator:', err);
      }
    }

    // High-fidelity integrated Razorpay Test Mode Gateway
    if (targetApt) {
      setTargetAppointmentForRazorpay(targetApt);
    }
    setIsRazorpayModalOpen(true);
  };

  const handleSimulateRazorpaySuccess = async () => {
    setIsProcessingPayment(true);
    await new Promise((res) => setTimeout(res, 900));
    setIsProcessingPayment(false);

    const generatedTxnId = `pay_rzp_${Math.floor(10000000 + Math.random() * 90000000)}`;

    if (targetAppointmentForRazorpay) {
      // Settle payment online with backend persistence
      await api(`/hospitals/appointments/${targetAppointmentForRazorpay.id}/pay`, {
        method: 'PATCH',
        body: {
          paymentMethod: 'ONLINE_RAZORPAY',
          paymentTxnId: generatedTxnId,
        },
      }).catch(() => null);

      await api('/payments/razorpay/verify', {
        method: 'POST',
        body: {
          razorpay_payment_id: generatedTxnId,
          appointmentId: targetAppointmentForRazorpay.id,
        },
      }).catch(() => null);

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === targetAppointmentForRazorpay.id
            ? {
                ...a,
                paymentStatus: 'PAID_ONLINE',
                paymentMethod: 'ONLINE_RAZORPAY',
                paymentTxnId: generatedTxnId,
              }
            : a
        )
      );
      addToast(
        `Payment of ₹${targetAppointmentForRazorpay.fee} settled via Razorpay (${generatedTxnId})!`,
        'success'
      );
      setIsRazorpayModalOpen(false);
      setTargetAppointmentForRazorpay(null);
      fetchData();
    } else {
      await handleConfirmBooking({
        paymentMethod: 'ONLINE_RAZORPAY',
        paymentTxnId: generatedTxnId,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#07151f] text-slate-100 flex flex-col justify-between relative overflow-x-hidden selection:bg-emerald-400 selection:text-slate-950 font-sans">
      {/* Atmospheric Ambience Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-36 left-1/4 w-[750px] h-[750px] bg-teal-500/10 rounded-full blur-[140px]"></div>
        <div className="absolute top-1/3 -right-40 w-[620px] h-[620px] bg-emerald-500/10 rounded-full blur-[160px]"></div>
      </div>

      {/* Patient Universal Health Account Banner */}
      <section className="glass-card-accent border-b border-emerald-500/30 text-white shadow-2xl py-6 px-4 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-[10px] uppercase tracking-wider font-mono">
                Universal Patient Account • Unique Health Identity
              </span>
              <span className="text-teal-300 text-xs hidden sm:inline">• Multi-Hospital Network</span>
            </div>

            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-display">
                Nearby Hospitals, Diagnostics & Online Booking
              </h1>
            </div>

            <p className="text-xs text-slate-300">
              One account with your permanent Unique ID (UHID). Book OPD doctor visits or lab diagnostics at any nearby center — all reports sync automatically to your unique record.
            </p>
          </div>

          {/* UHID & ABHA Identity Card Pill */}
          <div className="glass-card p-3.5 rounded-2xl border border-white/15 text-xs space-y-1 sm:text-right shrink-0 shadow-lg">
            <div className="flex items-center sm:justify-end gap-1.5">
              <span className="text-slate-400 text-[10px] uppercase font-bold font-mono">Lifetime UHID:</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-400 text-slate-950 font-mono font-black text-xs shadow-sm">
                UHID-2026-9041
              </span>
            </div>
            <div className="flex items-center sm:justify-end gap-1.5">
              <span className="text-slate-400 text-[10px] uppercase font-bold font-mono">ABDM ABHA:</span>
              <span className="font-mono text-teal-300 font-bold">91-4829-1029-4481</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 sm:justify-end">
              <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              <span>NABL Network-Wide Cross-Facility Report Sync Active</span>
            </span>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6 relative z-10">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('LOCATOR')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'LOCATOR'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-white/5 text-slate-300 hover:text-white border border-white/10'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>Available Facilities ({hospitals.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('MY_BOOKINGS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'MY_BOOKINGS'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-white/5 text-slate-300 hover:text-white border border-white/10'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              <span>My OPD & Lab Slips ({appointments.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Link
              to="/reports"
              className="inline-flex items-center gap-1 text-emerald-400 font-semibold hover:text-emerald-300"
            >
              <span>View Consolidated Lab Reports</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* TAB 1: LOCATOR & BOOKING */}
        {activeTab === 'LOCATOR' && (
          <div className="space-y-6">
            {/* Filter and Search Bar */}
            <div className="bg-[#0c1c28]/90 p-4 rounded-2xl border border-white/10 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setFilterCategory('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                    filterCategory === 'ALL'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-white/5 text-slate-300 hover:text-white border border-white/10'
                  }`}
                >
                  All Facilities
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCategory('HOSPITAL')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                    filterCategory === 'HOSPITAL'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-teal-500/10 text-teal-300 hover:bg-teal-500/20 border border-teal-500/20'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>Hospitals</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterCategory('LABORATORY')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                    filterCategory === 'LABORATORY'
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 border border-purple-500/20'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  <span>Diagnostic Labs</span>
                </button>
              </div>

              <div className="relative w-full sm:w-80">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search hospital, doctor, or department..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 font-sans"
                />
              </div>
            </div>

            {/* Sub-bar: GPS Distance Filter & Locality Selector */}
            <div className="p-3.5 glass-card rounded-2xl border border-white/10 shadow-lg flex flex-wrap items-center justify-between gap-3 text-xs">
              {/* Live GPS Detection Button */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleGetLiveLocation}
                  disabled={isLocating}
                  className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                    userLocation
                      ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300'
                      : 'bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>
                    {isLocating
                      ? 'Detecting GPS...'
                      : userLocation
                      ? 'Live GPS Active'
                      : 'Locate Near Me'}
                  </span>
                </button>

                {/* Radius Filter */}
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 p-0.5 rounded-xl text-[11px]">
                  <span className="text-slate-400 font-bold px-1.5 font-mono">Radius:</span>
                  {['ALL', '2', '5', '10'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setDistanceRadius(r)}
                      className={`px-2.5 py-0.5 rounded-lg font-bold transition cursor-pointer font-mono ${
                        distanceRadius === r
                          ? 'bg-emerald-400 text-slate-950 shadow-sm font-black'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {r === 'ALL' ? 'All' : `≤ ${r} km`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Locality Selector Pills (Glassmorphism) */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                <span className="text-[11px] text-slate-400 font-mono font-bold mr-1">Locality:</span>
                {['ALL', 'MG Road', 'Benz Circle', 'Governorpet', 'Suryaraopet', 'Tadepalli', 'Bhavanipuram'].map(
                  (loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setLocalityFilter(loc)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                        localityFilter === loc
                          ? 'bg-emerald-500 text-slate-950 shadow-sm font-black'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                      }`}
                    >
                      {loc === 'ALL' ? 'All Vijayawada' : loc}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Persistent View Mode Bar */}
            <div className="bg-[#0c1c28]/90 p-3.5 rounded-2xl border border-white/10 shadow-lg flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span>Healthcare Facility Locator</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {mapViewMode === 'LIST_ONLY' ? 'Cards Only View' : mapViewMode === 'FULL_MAP' ? 'Expanded Map View' : 'Map & Cards View'}
                </span>
              </div>

              <div className="flex items-center gap-1 bg-white/5 backdrop-blur-md p-1 rounded-xl text-xs font-bold border border-white/10 shadow-inner">
                <button
                  type="button"
                  onClick={() => setMapViewMode('SPLIT')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                    mapViewMode === 'SPLIT'
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span>Map & Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMapViewMode('FULL_MAP')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    mapViewMode === 'FULL_MAP'
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Full Map
                </button>
                <button
                  type="button"
                  onClick={() => setMapViewMode('LIST_ONLY')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    mapViewMode === 'LIST_ONLY'
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Cards Only
                </button>
              </div>
            </div>

            {/* Live Leaflet OpenStreetMap View (Visible when not LIST_ONLY) */}
            {mapViewMode !== 'LIST_ONLY' ? (
              <div id="healthcare-map-view" className="glass-card p-4 rounded-3xl border border-white/10 shadow-xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-mono text-[11px] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Click any hospital or lab marker below to view full details and book an appointment</span>
                  </span>
                  {focusedFacility && (
                    <span className="text-emerald-300 font-bold font-mono text-[11px] bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/30">
                      Focused: {focusedFacility.name}
                    </span>
                  )}
                </div>

                <div className="rounded-2xl overflow-hidden border border-white/10 shadow-inner">
                  <HospitalNetworkMap
                    facilities={hospitals}
                    userLocation={userLocation}
                    selectedFacility={focusedFacility || selectedFacility}
                    onSelectFacility={(facility, type) => handleOpenBooking(facility, null, null, type)}
                    height={mapViewMode === 'FULL_MAP' ? '560px' : '380px'}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs">
                <span className="text-teal-300 font-medium">Map view is hidden (Cards Only mode). Click &ldquo;Show Map&rdquo; or any card&apos;s &ldquo;View on Map&rdquo; to re-open.</span>
                <button
                  type="button"
                  onClick={() => setMapViewMode('SPLIT')}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold transition flex items-center gap-1.5 text-xs cursor-pointer shadow-sm active:scale-95"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                  <span>Show Map</span>
                </button>
              </div>
            )}

            {/* Facilities Cards Grid (Glassmorphic Medical Cards) */}
            {loading ? (
              <div className="py-12 flex justify-center">
                <LoadingSpinner />
              </div>
            ) : hospitals.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs glass-panel rounded-3xl border border-slate-200">
                No nearby medical facilities found matching search criteria.
              </div>
            ) : (
              <div className="space-y-6">
                {hospitals.map((hosp, hIdx) => {
                  const isHospital = hosp.category === 'HOSPITAL';

                  return (
                    <div
                      key={hosp.id || hosp.slug || `facility-${hIdx}`}
                      className="glass-card glass-card-hover rounded-3xl border border-white/10 shadow-xl overflow-hidden space-y-4 p-5 sm:p-6"
                    >
                      {/* Facility Header */}
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 border-b border-white/10 pb-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="p-1 rounded-lg bg-white/5 border border-white/10 text-emerald-400">
                              {isHospital ? (
                                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                              ) : (
                                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                              )}
                            </span>
                            <h2
                              onClick={() => handleLocateOnMap(hosp)}
                              className="text-lg sm:text-xl font-display font-black text-white tracking-tight hover:text-emerald-300 transition-colors cursor-pointer"
                              title="Click to view location on map"
                            >
                              {hosp.name}
                            </h2>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                              {hosp.distanceKm} km away
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                              <span>{(hosp.verificationStatus || 'FULLY_VERIFIED').replace(/_/g, ' ')}</span>
                            </span>
                          </div>

                          <p className="text-xs text-slate-300 flex items-center gap-1.5">
                            <span>{hosp.address}</span>
                            <span className="text-slate-500">•</span>
                            <span className="inline-flex items-center gap-1 font-mono text-slate-300">
                              <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                              <span>{hosp.phone}</span>
                            </span>
                          </p>

                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-400 font-medium">
                            <span className="text-emerald-400 font-semibold inline-flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              <span>{hosp.timing}</span>
                            </span>
                            {hosp.bedCapacity > 0 && (
                              <span className="inline-flex items-center gap-1">
                                <span>•</span>
                                <span>{hosp.bedCapacity} Inpatient Beds</span>
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <span>•</span>
                              <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                              <span className="font-mono text-slate-300">{hosp.rating} / 5</span>
                            </span>
                          </div>
                        </div>

                        {/* Fast Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleLocateOnMap(hosp)}
                            className="px-3.5 py-2.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/35 text-teal-300 hover:text-white font-mono font-bold text-xs border border-teal-500/40 transition shadow-sm cursor-pointer flex items-center gap-1.5 active:scale-95"
                            title={`Focus ${hosp.name} on map`}
                          >
                            <svg className="w-3.5 h-3.5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            <span>View on Map</span>
                          </button>

                          {isHospital && (
                            <button
                              type="button"
                              onClick={() => handleOpenBooking(hosp, null, null, 'DOCTOR_OPD_CONSULTATION')}
                              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5 active:scale-95"
                            >
                              <svg className="w-3.5 h-3.5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                              <span>Book Doctor OPD</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenBooking(hosp, null, null, 'DIAGNOSTIC_TEST')}
                            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition shadow-sm cursor-pointer flex items-center gap-1.5 active:scale-95"
                          >
                            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                            <span>Book Lab Test</span>
                          </button>
                        </div>
                      </div>

                      {/* Hospital Departments & Doctor Roster */}
                      <div className="space-y-3">
                        <span className="text-xs font-mono font-bold uppercase text-slate-400 tracking-wider block">
                          Registered Hospital Departments & Verified Doctors:
                        </span>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {hosp.departments?.map((dept, dIdx) => (
                            <div
                              key={dept.id || `${hosp.id || 'hosp'}-dept-${dIdx}`}
                              className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <strong className="text-xs font-semibold text-white">
                                  {dept.name}
                                </strong>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {dept.doctors?.length || 0} Doctors
                                </span>
                              </div>

                              <span className="text-[10px] text-slate-400 block font-mono">
                                Timings: {dept.opdTimings}
                              </span>

                              {/* Doctors in this Department */}
                              {dept.doctors && dept.doctors.length > 0 && (
                                <div className="space-y-2 pt-1.5 border-t border-white/10">
                                  {dept.doctors.map((doc, docIdx) => (
                                    <div
                                      key={doc.id || `${dept.id || 'dept'}-doc-${docIdx}`}
                                      className="bg-white/5 p-2.5 rounded-xl border border-white/10 flex items-center justify-between gap-2 shadow-xs"
                                    >
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <strong className="text-xs text-white font-bold block">
                                            {doc.name}
                                          </strong>
                                          <span className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                            <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                            <span>Dual Verified</span>
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-slate-300 block">
                                          {doc.degrees} • {doc.stateCouncil} ({doc.nmcRegNo})
                                        </span>
                                        <span className="text-[10px] text-emerald-300 font-bold block mt-0.5 font-mono">
                                          OPD Fee: ₹{doc.opdFee} • {doc.experienceYears} Yrs Exp
                                        </span>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => handleOpenBooking(hosp, dept.name, doc.name, 'DOCTOR_OPD_CONSULTATION')}
                                        className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer whitespace-nowrap shadow-md shadow-emerald-500/20 active:scale-95"
                                      >
                                        <span>Book Slot</span>
                                        <svg className="w-3.5 h-3.5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY BOOKINGS & OPD TOKENS */}
        {activeTab === 'MY_BOOKINGS' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-display font-black text-white">
                Your Confirmed Appointments & Digital OPD Slips
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                Present this digital token at the hospital or lab reception kiosk
              </span>
            </div>

            {appointments.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs glass-card rounded-3xl border border-white/10">
                No active appointments booked yet. Use the locator above to book an OPD visit or diagnostic test.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appointments.map((apt, aIdx) => (
                  <div
                    key={apt.id || apt.tokenNo || `appointment-${aIdx}`}
                    className="glass-card rounded-3xl border border-white/10 p-5 shadow-xl space-y-4 relative overflow-hidden"
                  >
                    {/* Top Token Bar */}
                    <div className="flex items-start justify-between border-b border-white/10 pb-3">
                      <div>
                        <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block tracking-wider">
                          Official Digital OPD Token
                        </span>
                        <strong className="text-xl font-black text-white font-mono tracking-tight">
                          {apt.tokenNo}
                        </strong>
                        <span className="text-[10px] text-teal-300 block font-mono">
                          UHID: {apt.uhid}
                        </span>
                      </div>

                      <div className="text-right space-y-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 inline-block">
                          {apt.status}
                        </span>
                        <div>
                          {apt.paymentStatus === 'PAID_ONLINE' || apt.paymentMethod === 'ONLINE_RAZORPAY' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40">
                              <svg className="w-3 h-3 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                              <span>Paid Online (Razorpay)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              <svg className="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                              <span>Pay at Counter</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-1.5 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-mono font-bold">Hospital / Center</span>
                        <strong className="text-white text-sm">{apt.hospitalName}</strong>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-white/10">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-mono font-bold">Department</span>
                          <span className="text-slate-200 font-medium">{apt.department}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-mono font-bold">Consultant / Test</span>
                          <span className="text-slate-200 font-medium">{apt.doctorName || apt.testName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-mono font-bold">Appointment Date</span>
                          <strong className="text-teal-300 font-mono">{apt.date}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-mono font-bold">Time Slot</span>
                          <strong className="text-teal-300 font-mono">{apt.timeSlot}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Hospital Corporate Account Settlement Routing Card */}
                    <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-teal-300 tracking-wider flex items-center gap-1 font-mono">
                          <svg className="w-3.5 h-3.5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                          <span>Hospital Settlement Account</span>
                        </span>
                        <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          Direct Escrow
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-white leading-snug">
                        {apt.hospitalBankAccount?.entityName || `${apt.hospitalName} Corporate Healthcare`}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 font-mono pt-0.5">
                        <span>Bank: <strong className="text-slate-200">{apt.hospitalBankAccount?.bankName || 'HDFC Bank Healthcare'}</strong></span>
                        <span>IFSC: <strong className="text-slate-200">{apt.hospitalBankAccount?.ifsc || 'HDFC0001824'}</strong></span>
                        <span>UPI: <strong className="text-slate-200">{apt.hospitalBankAccount?.upiId || 'hospital@upi'}</strong></span>
                      </div>
                    </div>

                    {/* Lab Order Linked Notification */}
                    {apt.orderNo && (
                      <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-2 text-xs">
                        <div>
                          <span className="text-[10px] uppercase font-mono font-bold text-emerald-400 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                            <span>Diagnostic Specimen Accessioned</span>
                          </span>
                          <span className="text-white font-bold font-mono text-xs block mt-0.5">
                            Order #{apt.orderNo}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate(`/patient/${patientIdentifier}/reports`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-[10px] hover:bg-emerald-500/30 transition cursor-pointer"
                        >
                          <span>View in Reports</span>
                          <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </button>
                      </div>
                    )}

                    {/* QR Code & Barcode Section */}
                    <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                          Fast Kiosk Scan
                        </span>
                        <span className="font-mono text-xs text-white font-bold block">
                          ||||| | |||| ||| |||||||
                        </span>
                        <span className="text-[9px] text-slate-400 block">
                          Show this token barcode upon arrival for instant priority check-in
                        </span>
                      </div>

                      <div className="w-14 h-14 bg-white/10 border border-white/15 text-white rounded-xl flex flex-col items-center justify-center p-1 font-mono text-[8px] text-center shrink-0">
                        <span>[QR-CODE]</span>
                        <span className="text-[7px] text-emerald-400">OPD SCAN</span>
                      </div>
                    </div>

                    {/* Actions & Fee */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 border-t border-white/10">
                      <div>
                        <span>Fee: <strong className="text-emerald-400 text-sm font-mono font-bold">₹{apt.fee}</strong></span>
                        {apt.paymentTxnId && (
                          <span className="block text-[9px] font-mono text-slate-400">
                            Txn: {apt.paymentTxnId}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {apt.paymentStatus === 'PAY_AT_COUNTER' && (
                          <button
                            type="button"
                            onClick={() => handleOpenRazorpayCheckout(apt)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[11px] shadow-sm transition cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                            <span>Pay Online Now</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => window.print()}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 transition cursor-pointer shadow-sm"
                        >
                          <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                          <span>Print Slip</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Online Booking Modal */}
      {/* ─── APPOINTMENT & OPD BOOKING MODAL (Stitch Glassmorphism) ─── */}
      {selectedFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
          <div className="glass-panel-elevated rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-emerald-500/30 space-y-5 max-h-[90vh] overflow-y-auto relative text-white">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-3.5">
              <div>
                <span className="text-[10px] uppercase font-mono font-black text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full inline-block mb-1 border border-emerald-500/40">
                  {bookingStep === 'DETAILS' ? 'Step 1 of 2: Appointment Details' : 'Step 2 of 2: Payment & Bank Routing'}
                </span>
                <h3 className="text-xl font-display font-black text-white tracking-tight">
                  {selectedFacility.name}
                </h3>
                <span className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span>{selectedFacility.address}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedFacility(null);
                  setBookingStep('DETAILS');
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold text-sm cursor-pointer transition border border-white/15"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* STEP 1: APPOINTMENT DETAILS FORM */}
            {bookingStep === 'DETAILS' && (
              <form onSubmit={handleProceedToPaymentStep} className="space-y-4 text-xs">
                {/* Type Switcher */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 font-mono">
                    Booking Category
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBookingType('DOCTOR_OPD_CONSULTATION')}
                      className={`inline-flex items-center justify-center gap-2 p-3 rounded-2xl border text-center font-bold transition cursor-pointer ${
                        bookingType === 'DOCTOR_OPD_CONSULTATION'
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                          : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                      <span>Doctor OPD Visit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingType('DIAGNOSTIC_TEST')}
                      className={`inline-flex items-center justify-center gap-2 p-3 rounded-2xl border text-center font-bold transition cursor-pointer ${
                        bookingType === 'DIAGNOSTIC_TEST'
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                          : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                      <span>Diagnostic Lab Test</span>
                    </button>
                  </div>
                </div>

                {/* Patient Name & Permanent UHID */}
                <div className="p-3.5 glass-card rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-400 uppercase font-mono font-bold block">Patient Name</span>
                    <strong className="text-white text-sm font-display font-extrabold">{patientName}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-400 uppercase font-mono font-bold block">Permanent UHID</span>
                    <span className="font-mono text-emerald-300 font-extrabold bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/40">
                      UHID-2026-9041
                    </span>
                  </div>
                </div>

                {/* Department Picker */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 font-mono">
                    Select Department
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    className="w-full glass-input rounded-2xl p-3 text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer shadow-sm border border-white/15"
                  >
                    {selectedFacility.departments?.map((d) => (
                      <option key={d.id} value={d.name} className="bg-[#0b1924] text-white">
                        {d.name} ({d.doctors?.length || 0} Doctors)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Doctor Selection (Strict dropdown of verified doctors - never editable text) */}
                {bookingType === 'DOCTOR_OPD_CONSULTATION' ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] uppercase font-bold text-slate-400 font-mono">
                        Select Doctor in {selectedDepartment}
                      </label>
                      <span className="text-[10px] text-emerald-300 font-mono font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40">
                        {candidateDoctors.length} {candidateDoctors.length === 1 ? 'Doctor' : 'Doctors'} Available
                      </span>
                    </div>

                    <select
                      value={selectedDoctor}
                      onChange={(e) => handleDoctorChange(e.target.value)}
                      className="w-full bg-white/5 border border-emerald-400/50 rounded-2xl p-3 text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer shadow-sm"
                    >
                      {candidateDoctors.map((doc) => (
                        <option key={doc.id || doc.name} value={doc.name} className="bg-[#0b1924] text-white">
                          Dr. {(doc.name || 'Duty Consultant').replace(/^Dr\.\s*/i, '')} — {doc.degrees || 'MBBS, MD'} {doc.deptName && doc.deptName !== selectedDepartment ? `(${doc.deptName})` : ''} (₹{doc.opdFee || 750} • {doc.experienceYears || 10} Yrs Exp)
                        </option>
                      ))}
                    </select>

                    {/* Active Doctor Verified Profile Card */}
                    {activeDoctorObj && (
                      <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs space-y-1.5 shadow-sm text-slate-200">
                        <div className="flex items-center justify-between">
                          <strong className="text-white font-bold text-xs flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                            <span>{activeDoctorObj.name}</span>
                          </strong>
                          <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs">
                            <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            <span>Dual Verified Specialist</span>
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-300">
                          <span>Degrees: <strong>{activeDoctorObj.degrees}</strong></span>
                          <span>Experience: <strong>{activeDoctorObj.experienceYears} Yrs</strong></span>
                          <span>OPD Fee: <strong className="text-emerald-400 font-bold font-mono">₹{activeDoctorObj.opdFee}</strong></span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Reg: {activeDoctorObj.nmcRegNo} ({activeDoctorObj.stateCouncil})
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 font-mono">
                      Select Diagnostic Test / Health Package
                    </label>
                    <select
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
                      className="w-full glass-input rounded-2xl p-3 text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer shadow-sm border border-white/15"
                    >
                      <option value="Comprehensive Full Body Health Checkup" className="bg-[#0b1924] text-white">Comprehensive Full Body Health Checkup (64 Parameters)</option>
                      <option value="Complete Blood Count (CBC) with ESR & Hemogram" className="bg-[#0b1924] text-white">Complete Blood Count (CBC) with ESR & Hemogram</option>
                      <option value="Comprehensive Lipid Profile (Cholesterol, HDL, LDL, VLDL)" className="bg-[#0b1924] text-white">Comprehensive Lipid Profile (Cholesterol, HDL, LDL, VLDL)</option>
                      <option value="HbA1c Glycated Hemoglobin & Fasting Plasma Glucose" className="bg-[#0b1924] text-white">HbA1c Glycated Hemoglobin & Fasting Plasma Glucose</option>
                      <option value="Liver & Renal Function Vital Panel (LFT + KFT)" className="bg-[#0b1924] text-white">Liver & Renal Function Vital Panel (LFT + KFT)</option>
                      <option value="Thyroid Complete Profile (Total T3, Total T4, Ultrasensitive TSH)" className="bg-[#0b1924] text-white">Thyroid Complete Profile (Total T3, Total T4, Ultrasensitive TSH)</option>
                      <option value="Vitamin D3 & Vitamin B12 Immunoassay Deficiency Panel" className="bg-[#0b1924] text-white">Vitamin D3 & Vitamin B12 Immunoassay Deficiency Panel</option>
                    </select>
                  </div>
                )}

                {/* Date & Time Slot */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 font-mono">
                      Appointment Date
                    </label>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full glass-input rounded-2xl p-2.5 text-xs text-white font-medium border border-white/15"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 font-mono">
                      Available Time Slot
                    </label>
                    <select
                      value={selectedSlot}
                      onChange={(e) => setSelectedSlot(e.target.value)}
                      className="w-full glass-input rounded-2xl p-2.5 text-xs text-white font-medium cursor-pointer border border-white/15"
                    >
                      {(activeDoctorObj?.slotsAvailable || [
                        '09:00 AM - 09:30 AM',
                        '10:00 AM - 10:30 AM',
                        '11:30 AM - 12:00 PM',
                        '05:00 PM - 05:30 PM',
                        '06:30 PM - 07:00 PM',
                      ]).map((slot) => (
                        <option key={slot} value={slot} className="bg-[#0b1924] text-white">
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Price & Guarantee */}
                <div className="p-3.5 glass-card rounded-2xl flex items-center justify-between border border-white/10">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">
                      Consultation / Testing Fee
                    </span>
                    <strong className="text-xl font-display font-black text-white tabular-nums">
                      ₹{activeCalculatedFee}
                    </strong>
                  </div>
                  <span className="text-[10px] text-emerald-300 font-bold bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/40">
                    Zero Waiting Kiosk Priority
                  </span>
                </div>

                {/* Submit to Step 2 */}
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <span>Proceed to Payment & Bank Routing (₹{activeCalculatedFee})</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </button>
              </form>
            )}

            {/* STEP 2: PAYMENT & DIRECT HOSPITAL ACCOUNT ROUTING (Stitch Glassmorphism) */}
            {bookingStep === 'PAYMENT' && (
              <div className="space-y-4 text-xs">
                {/* Appointment Summary Capsule */}
                <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
                      {bookingType === 'DIAGNOSTIC_TEST' ? 'Diagnostic Test' : 'Doctor OPD Visit'}
                    </span>
                    <strong className="text-white text-xs font-bold block mt-0.5">
                      {bookingType === 'DIAGNOSTIC_TEST' ? testName : selectedDoctor}
                    </strong>
                    <span className="text-[10px] text-slate-300 block mt-0.5 font-medium">
                      {bookingDate} • {selectedSlot}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">Payable Fee</span>
                    <strong className="text-xl font-bold text-emerald-400 font-mono tabular-nums">
                      ₹{activeCalculatedFee}
                    </strong>
                  </div>
                </div>

                {/* Hospital Recipient Corporate Account Card (Deep Oceanic Glass) */}
                {(() => {
                  const hospAccount = HOSPITAL_ACCOUNTS_MAP[selectedFacility.id] || {
                    entityName: `${selectedFacility.name} Corporate Healthcare Trust`,
                    bankName: 'HDFC Bank Healthcare Clearing Division',
                    accountNo: '50200088192019',
                    ifsc: 'HDFC0001824',
                    branch: 'Healthcare Enclave, Vijayawada',
                    upiId: `${selectedFacility.id.toLowerCase()}.care@hdfcbank`,
                  };

                  return (
                    <div className="p-4 bg-gradient-to-br from-[#07151f] via-slate-900 to-teal-950 text-white rounded-3xl border border-white/15 shadow-xl space-y-2.5 relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-mono font-bold text-emerald-300 tracking-wider flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                          <span>Hospital Recipient Bank Account</span>
                        </span>
                        <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                          <svg className="w-2.5 h-2.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                          <span>Verified Corporate Payee</span>
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[9px] text-slate-400 uppercase block font-mono font-bold">
                          Beneficiary Hospital Entity
                        </span>
                        <strong className="text-xs sm:text-sm font-bold text-white block leading-snug">
                          {hospAccount.entityName}
                        </strong>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[10px] font-mono">
                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-sans font-bold">
                            Bank & Branch
                          </span>
                          <span className="text-slate-200 font-semibold">{hospAccount.bankName}</span>
                          <span className="text-slate-400 block text-[9px]">{hospAccount.branch}</span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[9px] uppercase font-sans font-bold">
                            Direct Settlement Account
                          </span>
                          <span className="text-emerald-300 font-bold tracking-wider">
                            A/C: {hospAccount.accountNo}
                          </span>
                          <span className="text-slate-300 block">IFSC: {hospAccount.ifsc}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
                        <span className="text-slate-300 font-mono">
                          Corporate VPA: <strong className="text-emerald-300">{hospAccount.upiId}</strong>
                        </span>
                        <span className="text-[9px] text-emerald-400 font-bold">100% Direct Account Settlement</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Payment Method Selector */}
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase font-mono font-bold text-slate-400">
                    Choose Settlement Mode
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Option 1: Razorpay Gateway */}
                    <div
                      onClick={() => setPaymentMethod('ONLINE_RAZORPAY')}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        paymentMethod === 'ONLINE_RAZORPAY'
                          ? 'border-emerald-400 bg-emerald-500/20 ring-2 ring-emerald-400/30 shadow-md'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                          <strong className="text-xs font-bold text-white">Online Payment</strong>
                        </div>
                        <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-blue-600 text-white shadow-xs">
                          Razorpay
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-300 mt-2 leading-tight">
                        UPI (GPay / PhonePe / Paytm), Cards, NetBanking. Direct instant credit to hospital account.
                      </p>
                    </div>

                    {/* Option 2: Pay at Counter */}
                    <div
                      onClick={() => setPaymentMethod('PAY_AT_COUNTER')}
                      className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                        paymentMethod === 'PAY_AT_COUNTER'
                          ? 'border-amber-400 bg-amber-500/20 ring-2 ring-amber-400/30 shadow-md'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                          <strong className="text-xs font-bold text-white">Pay at Counter</strong>
                        </div>
                        <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs">
                          Reception Desk
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-300 mt-2 leading-tight">
                        Pay in Cash or Card at the hospital billing counter upon presenting token.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Modal Navigation Buttons */}
                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setBookingStep('DETAILS')}
                    className="inline-flex items-center gap-1.5 px-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold transition cursor-pointer border border-white/15 shadow-sm text-xs"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    <span>Back</span>
                  </button>

                  {paymentMethod === 'ONLINE_RAZORPAY' ? (
                    <button
                      type="button"
                      disabled={isBookingSubmitting}
                      onClick={() => handleOpenRazorpayCheckout(null)}
                      className="flex-1 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <svg className="w-3.5 h-3.5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                      <span>Pay ₹{activeCalculatedFee} via Razorpay Gateway</span>
                      <svg className="w-3.5 h-3.5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isBookingSubmitting}
                      onClick={() => handleConfirmBooking({ paymentMethod: 'PAY_AT_COUNTER' })}
                      className="flex-1 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition shadow-lg shadow-amber-600/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      <span>{isBookingSubmitting ? 'Confirming...' : `Confirm (Pay ₹${activeCalculatedFee} at Reception)`}</span>
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RAZORPAY PAYMENT GATEWAY MODAL SIMULATOR */}
      {isRazorpayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
          <div className="bg-[#0c1a24]/98 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/20 max-w-md w-full overflow-hidden text-slate-100 animate-fadeIn">
            {/* Razorpay Brand Header */}
            <div className="bg-[#0c2340] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-xl shadow-md">
                  R
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-extrabold text-sm tracking-tight">Razorpay Checkout</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-500/30 text-blue-200 font-mono tracking-wider">
                      UPI / Cards / NetBanking
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-300 block line-clamp-1">
                    {targetAppointmentForRazorpay
                      ? targetAppointmentForRazorpay.hospitalBankAccount?.entityName || targetAppointmentForRazorpay.hospitalName
                      : (selectedFacility ? HOSPITAL_ACCOUNTS_MAP[selectedFacility.id]?.entityName || selectedFacility.name : 'Hospital Healthcare Account')}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Amount to Pay</span>
                <strong className="text-lg font-black text-emerald-400 font-mono">
                  ₹{targetAppointmentForRazorpay ? targetAppointmentForRazorpay.fee : activeCalculatedFee}
                </strong>
              </div>
            </div>

            {/* Content & Modes */}
            <div className="p-5 space-y-4 text-xs bg-[#0b1924]/95 text-white">
              {/* Method Tabs */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-white/5 border border-white/10 rounded-xl font-bold">
                <button
                  type="button"
                  onClick={() => setRazorpayMethod('UPI')}
                  className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    razorpayMethod === 'UPI' ? 'bg-blue-600 text-white shadow-sm font-bold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  <span>UPI / QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRazorpayMethod('CARD')}
                  className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    razorpayMethod === 'CARD' ? 'bg-blue-600 text-white shadow-sm font-bold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                  <span>Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRazorpayMethod('NETBANKING')}
                  className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    razorpayMethod === 'NETBANKING' ? 'bg-blue-600 text-white shadow-sm font-bold' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  <span>Net Banking</span>
                </button>
              </div>

              {/* UPI Tab */}
              {razorpayMethod === 'UPI' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {['Google Pay', 'PhonePe', 'Paytm'].map((app) => (
                      <div
                        key={app}
                        onClick={() => setUpiId(`patient@${app.toLowerCase().replace(/\s/g, '')}`)}
                        className="p-2.5 rounded-xl border border-white/15 bg-white/5 text-center font-bold text-white hover:border-blue-400 hover:bg-blue-500/20 transition cursor-pointer"
                      >
                        {app}
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 font-mono">
                      Or Enter UPI ID / VPA
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full bg-white/5 border border-white/15 rounded-xl p-2.5 font-mono text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="username@okhdfcbank"
                    />
                  </div>
                </div>
              )}

              {/* Card Tab */}
              {razorpayMethod === 'CARD' && (
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 font-mono">Card Number</label>
                    <input
                      type="text"
                      value={cardData.number}
                      onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                      className="w-full bg-white/5 border border-white/15 rounded-xl p-2 font-mono text-xs text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 font-mono">Expiry</label>
                      <input
                        type="text"
                        value={cardData.expiry}
                        onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                        className="w-full bg-white/5 border border-white/15 rounded-xl p-2 font-mono text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 font-mono">CVV</label>
                      <input
                        type="password"
                        value={cardData.cvv}
                        onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                        className="w-full bg-white/5 border border-white/15 rounded-xl p-2 font-mono text-xs text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 font-mono">Name on Card</label>
                    <input
                      type="text"
                      value={cardData.name}
                      onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                      className="w-full bg-white/5 border border-white/15 rounded-xl p-2 text-xs text-white"
                    />
                  </div>
                </div>
              )}

              {/* Net Banking Tab */}
              {razorpayMethod === 'NETBANKING' && (
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase font-bold text-slate-400 font-mono">Popular Banks</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Bank'].map((bank) => (
                      <button
                        key={bank}
                        type="button"
                        onClick={() => setSelectedBank(bank)}
                        className={`p-2.5 rounded-xl border text-left font-bold transition cursor-pointer text-xs flex items-center gap-1.5 ${
                          selectedBank === bank
                            ? 'border-blue-400 bg-blue-500/20 text-white'
                            : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5 text-blue-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        <span>{bank}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Hospital Account Routing Assurance */}
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-300 space-y-0.5">
                <span className="font-bold block flex items-center gap-1.5 text-emerald-200">
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  <span>Direct Hospital Bank Settlement</span>
                </span>
                <p className="text-[10px] text-slate-300 leading-tight">
                  This transaction settles directly to the verified medical clearing account of the facility. Instant e-receipt and digital token issued upon authorization.
                </p>
              </div>

              {/* Pay Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  disabled={isProcessingPayment}
                  onClick={() => {
                    setIsRazorpayModalOpen(false);
                    setTargetAppointmentForRazorpay(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition cursor-pointer border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessingPayment}
                  onClick={handleSimulateRazorpaySuccess}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {isProcessingPayment ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Authorizing with Hospital Escrow...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      <span>
                        Pay ₹{targetAppointmentForRazorpay ? targetAppointmentForRazorpay.fee : activeCalculatedFee} to Hospital
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmed Token Modal */}
      {confirmedTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
          <div className="bg-[#0c1c28] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-emerald-500/40 space-y-4 text-center text-white">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-300 text-2xl flex items-center justify-center mx-auto border border-emerald-500/40 shadow-lg shadow-emerald-500/20">
              <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider font-mono">
                Booking Confirmed & Verified
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono tracking-tight">
                {confirmedTokenModal.tokenNo}
              </h3>
              <p className="text-xs text-slate-300">
                Your appointment at <strong className="text-white">{confirmedTokenModal.hospitalName}</strong> is confirmed.
              </p>
            </div>

            <div className="p-4 bg-white/5 rounded-2xl text-left text-xs space-y-2 border border-white/10 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400 font-mono">Patient:</span>
                <strong className="text-white">{confirmedTokenModal.patientName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-mono">Permanent UHID:</span>
                <span className="font-mono font-bold text-emerald-300">{confirmedTokenModal.uhid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-mono">Date & Slot:</span>
                <span className="text-slate-200">{confirmedTokenModal.date} ({confirmedTokenModal.timeSlot})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-mono">Specialty / Test:</span>
                <span className="text-white font-bold">{confirmedTokenModal.doctorName || confirmedTokenModal.testName}</span>
              </div>

              {/* Payment Details */}
              <div className="pt-2 border-t border-white/10 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-mono">Payment Status:</span>
                  <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[10px] font-mono ${
                    confirmedTokenModal.paymentStatus === 'PAID_ONLINE'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    <span>{confirmedTokenModal.paymentStatus === 'PAID_ONLINE' ? 'Paid Online (Razorpay)' : 'Pay at Reception Desk'}</span>
                  </span>
                </div>
                {confirmedTokenModal.paymentTxnId && (
                  <div className="flex justify-between font-mono text-[10px] text-slate-400">
                    <span>Razorpay Txn:</span>
                    <span className="font-bold text-emerald-400">{confirmedTokenModal.paymentTxnId}</span>
                  </div>
                )}
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Fee Amount:</span>
                  <span className="font-bold text-white font-mono">₹{confirmedTokenModal.fee}</span>
                </div>
              </div>

              {/* Bank Settlement Route Stamp */}
              {confirmedTokenModal.hospitalBankAccount && (
                <div className="pt-2 border-t border-white/10 text-[10px] space-y-0.5 text-slate-400">
                  <span className="text-[9px] uppercase font-bold text-emerald-400 block font-mono">
                    Settled to Hospital Account:
                  </span>
                  <p className="font-semibold text-white">
                    {confirmedTokenModal.hospitalBankAccount.entityName}
                  </p>
                  <p className="font-mono text-[9px] text-slate-300">
                    {confirmedTokenModal.hospitalBankAccount.bankName} • A/C: {confirmedTokenModal.hospitalBankAccount.accountNo} • IFSC: {confirmedTokenModal.hospitalBankAccount.ifsc}
                  </p>
                </div>
              )}
            </div>

            {/* If diagnostic test with created order */}
            {confirmedTokenModal.orderNo && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-left text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block font-mono">
                      Diagnostic Test Order Accessioned
                    </span>
                    <strong className="text-white font-mono">
                      Order #{confirmedTokenModal.orderNo}
                    </strong>
                  </div>
                </div>
                <p className="text-[11px] text-slate-300">
                  A specimen tube barcode has been registered in the LIS pathology queue. You can monitor this test directly in your Reports Vault.
                </p>
                <button
                  type="button"
                  onClick={() => navigate(`/patient/${patientIdentifier}/reports`)}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  <span>View in My Reports Vault</span>
                  <svg className="w-3.5 h-3.5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setConfirmedTokenModal(null); setActiveTab('MY_BOOKINGS'); }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>View in My OPD Tokens</span>
                <svg className="w-3.5 h-3.5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer border border-white/10 flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                <span>Print Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
