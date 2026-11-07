import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../components/Toast';
import { api } from '../../utils/api';
import Card from '../../components/Card';
import DemoRibbon from '../../components/DemoRibbon';
import { SkeletonCard } from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import FloatingAICopilot from '../../components/FloatingAICopilot';
import HomeCollectionModal from '../../components/HomeCollectionModal';
import AbhaModal from '../../components/AbhaModal';
import BiomarkerTrendsModal from '../../components/BiomarkerTrendsModal';
import { HOSPITALS } from '../../components/TopMainNavbar';

// Mapping of demo orders to hospital facility
export const DEMO_ORDER_HOSPITAL_MAP = [
  { orderNo: 'ORD-71204', patientId: 'cmw06qpoc000ptl10sl19di9o', hospitalSlug: 'company-a-main-hospital' },
  { orderNo: 'ORD-71250', patientId: 'cmw06qpoc000ptl10sl19di9o', hospitalSlug: 'company-a-main-hospital' },
  { orderNo: 'ORD-69102', patientId: 'cmw06qpoc000ptl10sl19di9o', hospitalSlug: 'company-a-central-lab' },
  { orderNo: 'ORD-71205', patientId: 'cmw06qq0i000rtl10qfeib6oc', hospitalSlug: 'manipal-hospital' },
  { orderNo: 'ORD-68910', patientId: 'cmw06qq0i000rtl10qfeib6oc', hospitalSlug: 'company-a-central-lab' },
  { orderNo: 'ORD-71239', patientId: 'cmw06qq6s000ttl10awv7mrde', hospitalSlug: 'ggh-vijayawada' },
  { orderNo: 'ORD-78486', patientId: 'cmw0fmtsi0001tl7454v6jaqu', hospitalSlug: 'apollo-hospital-vijayawada' },
  { orderNo: 'ORD-92892', patientId: 'cmw0fmtsi0001tl7454v6jaqu', hospitalSlug: 'apollo-hospital-vijayawada' },
];

const DEFAULT_PROFILES = [
  { id: 'cmw06qpoc000ptl10sl19di9o', fullName: 'Lakshmi Prasanna K', relation: 'SELF', sex: 'F', orderCount: 3, totalNetworkOrderCount: 3 },
  { id: 'cmw06qq0i000rtl10qfeib6oc', fullName: 'Srinivas Rao T', relation: 'SPOUSE', sex: 'M', orderCount: 2, totalNetworkOrderCount: 2 },
  { id: 'cmw06qq6s000ttl10awv7mrde', fullName: 'Bhavani K', relation: 'CHILD', sex: 'F', orderCount: 1, totalNetworkOrderCount: 1 },
  { id: 'cmw06qqde000vtl10gfymhuj7', fullName: 'Raghavendra T', relation: 'CHILD', sex: 'M', orderCount: 0, totalNetworkOrderCount: 0 },
  { id: 'cmw0fmtsi0001tl7454v6jaqu', fullName: 'Kavya Murthy', relation: 'SELF', sex: 'F', orderCount: 2, totalNetworkOrderCount: 2 },
];

export default function ProfilePicker() {
  const [activeHospitalSlug, setActiveHospitalSlug] = useState(
    () => localStorage.getItem('labora_active_hospital_slug') || 'apollo-hospital-vijayawada'
  );
  const [filterFacilityOnly, setFilterFacilityOnly] = useState(true);
  const [profiles, setProfiles] = useState(DEFAULT_PROFILES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [homeCollections, setHomeCollections] = useState([]);
  const [isHomeCollectionOpen, setIsHomeCollectionOpen] = useState(false);
  const [isAbhaOpen, setIsAbhaOpen] = useState(false);
  const [isTrendsModalOpen, setIsTrendsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { identifier } = useParams();
  const { token, logout, account } = useAuth();
  const { addToast } = useToast();
  const { t, lang, setLang } = useLanguage();

  const patientIdentifier = identifier || account?.mobileE164?.replace(/\D/g, '') || (token?.startsWith('demo-patient:') ? token.split(':')[1]?.replace(/\D/g, '') : null) || account?.id || '9000000001';

  const activeHospital =
    HOSPITALS.find((h) => h.slug === activeHospitalSlug) || HOSPITALS[0];

  // Ensure unique patient ID is in the URL path: /patient/:identifier/profiles
  useEffect(() => {
    if (!identifier && patientIdentifier) {
      navigate(`/patient/${patientIdentifier}/profiles`, { replace: true });
    }
  }, [identifier, patientIdentifier, navigate]);

  const computeLocalProfiles = (slug, facilityOnly) => {
    return DEFAULT_PROFILES.map((p) => {
      const totalNet = DEMO_ORDER_HOSPITAL_MAP.filter((o) => o.patientId === p.id).length;
      const count = facilityOnly && slug && slug !== 'all'
        ? DEMO_ORDER_HOSPITAL_MAP.filter((o) => o.patientId === p.id && o.hospitalSlug === slug).length
        : totalNet;
      return {
        ...p,
        orderCount: count,
        totalNetworkOrderCount: totalNet,
      };
    });
  };

  const fetchProfiles = async (slug = activeHospitalSlug, facilityOnly = filterFacilityOnly) => {
    try {
      setError('');
      const effectiveToken = token || localStorage.getItem('portal_token') || 'demo-patient:+919000000001';
      const q = facilityOnly && slug && slug !== 'all' ? `?hospitalSlug=${slug}` : '';
      const res = await api(`/patients/profiles${q}`, { token: effectiveToken });
      if (res?.patients && res.patients.length > 0) {
        setProfiles(res.patients);
      } else {
        setProfiles(computeLocalProfiles(slug, facilityOnly));
      }
    } catch (err) {
      console.warn('Profile fetch error, using hospital-aware profiles:', err);
      setProfiles(computeLocalProfiles(slug, facilityOnly));
    }
  };

  const fetchHomeCollections = async () => {
    try {
      const effectiveToken = token || localStorage.getItem('portal_token') || 'demo-patient:+919000000001';
      const res = await api('/patients/home-collections', { token: effectiveToken });
      setHomeCollections(res.collections || []);
    } catch (err) {
      console.warn('Home collections fetch error:', err);
    }
  };

  useEffect(() => {
    fetchProfiles(activeHospitalSlug, filterFacilityOnly);
    fetchHomeCollections();

    // Listen to TopMainNavbar hospital switcher
    const handleHospitalChanged = (e) => {
      const newSlug = e?.detail?.hospitalSlug || localStorage.getItem('labora_active_hospital_slug') || 'company-a-main-hospital';
      setActiveHospitalSlug(newSlug);
      fetchProfiles(newSlug, true);
      setFilterFacilityOnly(true);
    };

    window.addEventListener('hospital-changed', handleHospitalChanged);
    window.addEventListener('storage', handleHospitalChanged);

    // Auto-polling for real-time live sample collection updates
    const interval = setInterval(() => {
      fetchHomeCollections();
    }, 2500);

    const onFocus = () => {
      fetchProfiles(activeHospitalSlug, filterFacilityOnly);
      fetchHomeCollections();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('hospital-changed', handleHospitalChanged);
      window.removeEventListener('storage', handleHospitalChanged);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [activeHospitalSlug, filterFacilityOnly]);

  const handleSelect = (patientId) => {
    const params = new URLSearchParams();
    if (patientId) params.append('patientId', patientId);
    if (filterFacilityOnly && activeHospitalSlug && activeHospitalSlug !== 'all') {
      params.append('hospitalSlug', activeHospitalSlug);
    }
    const q = params.toString() ? `?${params.toString()}` : '';
    navigate(`/patient/${patientIdentifier}/reports${q}`);
  };

  const totalReports = profiles.reduce((sum, p) => sum + (p.orderCount || 0), 0);
  const totalNetworkReports = DEFAULT_PROFILES.reduce((sum, p) => sum + (p.totalNetworkOrderCount || 0), 0);
  const facilityReportsCount = DEMO_ORDER_HOSPITAL_MAP.filter((o) => o.hospitalSlug === activeHospitalSlug).length;

  return (
    <div className="min-h-screen bg-[#07151f] text-slate-100 flex flex-col justify-between relative overflow-x-hidden selection:bg-emerald-400 selection:text-slate-950 font-sans">
      <DemoRibbon />

      {/* Atmospheric Background Grain & Vignette */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[600px] h-[400px] bg-teal-500/5 rounded-full blur-[140px]"></div>
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[160px]"></div>
      </div>

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto space-y-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column (Desktop 5 cols): Family Vault & Quick Services */}
          <div className="lg:col-span-5 space-y-4">
            {/* Precision Family Health Vault Hero Card */}
            <div className="relative overflow-hidden bg-[#0c1c28]/90 backdrop-blur-xl text-white p-6 rounded-2xl shadow-xl space-y-4 border border-emerald-500/30">
              <div className="flex items-center justify-between relative z-10 flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full">
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>{lang === 'te' ? 'కుటుంబ హెల్త్ వాల్ట్' : lang === 'hi' ? 'पारिवारिक स्वास्थ्य वॉल्ट' : 'Family Health Vault'}</span>
                </span>
                
                <span className="text-[11px] text-slate-400 font-mono inline-flex items-center gap-1">
                  <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>DPDP 2023 Encrypted</span>
                </span>
              </div>

              <div className="relative z-10">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-snug">
                  {profiles[0]?.fullName
                    ? (lang === 'te' ? `${profiles[0].fullName.split(' ')[0]} గారి ఆరోగ్య వాల్ట్` : lang === 'hi' ? `${profiles[0].fullName.split(' ')[0]} का स्वास्थ्य वॉल्ट` : `${profiles[0].fullName.split(' ')[0]}'s Health Vault`)
                    : (lang === 'te' ? 'కుటుంబ ఆరోగ్య రికార్డులు' : lang === 'hi' ? 'पारिवारिक स्वास्थ्य रिकॉर्ड' : 'Family Health Records')}
                </h1>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  {lang === 'te'
                    ? 'ఈ ధృవీకరించబడిన మొబైల్ ఖాతా క్రింద నమోదు చేయబడిన కుటుంబ సభ్యుల సమగ్ర డయాగ్నస్టిక్ రికార్డులు.'
                    : lang === 'hi'
                    ? 'इस सत्यापित मोबाइल खाते के अंतर्गत पंजीकृत परिवार के सदस्यों के समेकित नैदानिक रिकॉर्ड।'
                    : 'Consolidated medical diagnostics across registered family dependents under this verified mobile account.'}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-emerald-300 text-[11px] font-mono">
                      UHID: UHID-2026-{patientIdentifier.slice(-4)}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Account: +91 {patientIdentifier}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        localStorage.removeItem('portal_token');
                        await logout();
                      } catch {
                        localStorage.removeItem('portal_token');
                      }
                      addToast('Logged out of Patient Health Vault', 'info');
                      navigate('/');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition cursor-pointer active:scale-95 shadow-sm"
                    title="Log out of Patient Account"
                  >
                    <svg className="w-3.5 h-3.5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>{lang === 'te' ? 'లాగ్ అవుట్' : lang === 'hi' ? 'लॉग आउट' : 'Log Out'}</span>
                  </button>
                </div>
              </div>

              {/* Health Vault Stats Row */}
              <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-2 relative z-10">
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <span className="text-[11px] text-slate-400 block">
                    {lang === 'te' ? 'సభ్యులు' : lang === 'hi' ? 'सदस्य' : 'Registered Members'}
                  </span>
                  <strong className="text-lg font-bold text-white tabular-nums">
                    {profiles.length}
                  </strong>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <span className="text-[11px] text-slate-400 block">
                    {lang === 'te' ? 'మొత్తం రిపోర్టులు' : lang === 'hi' ? 'कुल रिपोर्ट' : 'Available Reports'}
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <strong className="text-lg font-bold text-white tabular-nums">
                      {totalReports}
                    </strong>
                    <span className="text-[10px] text-emerald-300 font-mono">
                      {filterFacilityOnly ? `(${activeHospital.shortName})` : '(Network)'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-1 relative z-10">
                <button
                  type="button"
                  onClick={() => handleSelect(null)}
                  className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 shadow-sm"
                >
                  <span>
                    {lang === 'te'
                      ? `కుటుంబ సమగ్ర కాలక్రమం చూడండి (${totalReports} రిపోర్టులు)`
                      : lang === 'hi'
                      ? `एकीकृत पारिवारिक टाइमलाइन देखें (${totalReports} रिपोर्ट)`
                      : `View Unified Family Timeline (${totalReports} Reports)`}
                  </span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Quick Diagnostic Services (ABDM & Home Collection) */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setIsHomeCollectionOpen(true)}
                className="p-3.5 bg-[#0c1c28]/80 hover:bg-[#0c1c28] border border-white/10 hover:border-emerald-500/30 rounded-xl flex items-center gap-3 text-left transition-all cursor-pointer group active:scale-98"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block leading-tight">
                    Home Collection
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Book Phlebotomist
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsAbhaOpen(true)}
                className="p-3.5 bg-[#0c1c28]/80 hover:bg-[#0c1c28] border border-white/10 hover:border-amber-500/30 rounded-xl flex items-center gap-3 text-left transition-all cursor-pointer group active:scale-98"
              >
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block leading-tight">
                    ABHA Locker
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Govt PHR Sync
                  </span>
                </div>
              </button>
            </div>

            {/* Nearby Hospitals & Booking Card */}
            <Link
              to="/book-appointment"
              className="p-4 bg-[#0c1c28]/80 hover:bg-[#0c1c28] border border-white/10 hover:border-emerald-500/30 rounded-xl flex items-center justify-between transition-all cursor-pointer group shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30 group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-semibold text-white block leading-tight">
                    Nearby Hospitals & Diagnostic Centers
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Permanent UHID • Book OPD or Lab Test with Instant Token
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>Book</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>

            {/* Accreditations Trust Card */}
            <div className="p-3.5 bg-[#0c1c28]/80 rounded-xl border border-white/10 text-xs text-slate-300 space-y-1.5">
              <div className="flex items-center justify-between font-semibold text-white text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-200">
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>NABL ISO 15189 Accredited</span>
                </span>
                <span className="flex items-center gap-1 text-emerald-400 font-mono text-[11px]">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                  <span>Barcode Tracked</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Patient health data is secured under the Digital Personal Data Protection Act (DPDP) 2023 with end-to-end encryption.
              </p>
            </div>
          </div>

          {/* Right Column (Desktop 7 cols): Profile Selector */}
          <div className="lg:col-span-7 space-y-4">
            {/* Section Heading */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1 gap-2.5">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {t('profileTitle')}
                </h2>
                <p className="text-xs text-slate-400">
                  {lang === 'te'
                    ? 'బయోమార్కర్లను పరిశీలించడానికి కుటుంబ సభ్యుడిని ఎంచుకోండి'
                    : lang === 'hi'
                    ? 'बायोमार्कर देखने के लिए परिवार के सदस्य का चयन करें'
                    : 'Select a family member to inspect their diagnostic biomarkers'}
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-mono font-medium text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                  {profiles.length} {lang === 'te' ? 'ప్రొఫైల్స్' : lang === 'hi' ? 'प्रोफ़ाइल' : 'Profiles'}
                </span>
              </div>
            </div>

            {/* Facility Context Filter Bar */}
            <div className="bg-[#0c1c28]/90 backdrop-blur-xl p-3 sm:p-3.5 rounded-xl border border-white/10 shadow-md space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-xs text-slate-300 font-medium">Selected Facility:</span>
                  <span className="text-xs font-semibold text-white bg-white/5 border border-white/10 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    <span>{activeHospital.name}</span>
                    <span className="text-[10px] text-emerald-400 font-mono">({activeHospital.badge})</span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const next = !filterFacilityOnly;
                      setFilterFacilityOnly(next);
                      fetchProfiles(activeHospitalSlug, next);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      filterFacilityOnly
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                    }`}
                  >
                    <span>{filterFacilityOnly ? `Showing ${activeHospital.shortName} (${facilityReportsCount})` : `All Facilities (${totalNetworkReports})`}</span>
                  </button>
                </div>
              </div>

              {/* Quick Facility Switcher Buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setFilterFacilityOnly(false);
                    fetchProfiles('all', false);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                    !filterFacilityOnly
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
                  }`}
                >
                  <span>All Hospitals</span>
                  <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded ${!filterFacilityOnly ? 'bg-black/30 text-white' : 'bg-white/10 text-slate-300'}`}>
                    {totalNetworkReports}
                  </span>
                </button>

                {HOSPITALS.map((h) => {
                  const isSelected = activeHospitalSlug === h.slug && filterFacilityOnly;
                  const count = DEMO_ORDER_HOSPITAL_MAP.filter((o) => o.hospitalSlug === h.slug).length;

                  return (
                    <button
                      key={h.slug}
                      type="button"
                      onClick={() => {
                        setActiveHospitalSlug(h.slug);
                        setFilterFacilityOnly(true);
                        localStorage.setItem('labora_active_hospital_slug', h.slug);
                        try {
                          window.dispatchEvent(
                            new CustomEvent('hospital-changed', {
                              detail: { hospitalSlug: h.slug, hospital: h },
                            })
                          );
                          window.dispatchEvent(new Event('storage'));
                        } catch {
                          // safe
                        }
                        fetchProfiles(h.slug, true);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                          : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
                      }`}
                    >
                      <span>{h.shortName}</span>
                      <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded ${isSelected ? 'bg-black/30 text-white' : 'bg-white/10 text-slate-300'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : error ? (
              <ErrorState description={error} onRetry={fetchProfiles} />
            ) : (
              <div className="space-y-3.5">
                {/* Individual Profile Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {profiles.map((p) => {
                    const relationBadge = p.relation === 'SELF'
                      ? { bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30', avatar: 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' }
                      : p.relation === 'SPOUSE'
                      ? { bg: 'bg-sky-500/10 text-sky-300 border-sky-500/30', avatar: 'bg-sky-950 text-sky-300 border border-sky-500/30' }
                      : p.relation === 'CHILD'
                      ? { bg: 'bg-purple-500/10 text-purple-300 border-purple-500/30', avatar: 'bg-purple-950 text-purple-300 border border-purple-500/30' }
                      : { bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30', avatar: 'bg-amber-950 text-amber-300 border border-amber-500/30' };

                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSelect(p.id)}
                        className="p-4 rounded-xl bg-[#0c1c28]/80 hover:bg-[#0c1c28] border border-white/10 hover:border-emerald-500/40 transition-all cursor-pointer flex items-center justify-between group active:scale-99 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${relationBadge.avatar} font-bold text-sm flex items-center justify-center group-hover:scale-105 transition-transform`}>
                            {p.fullName ? p.fullName.charAt(0).toUpperCase() : 'P'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-semibold text-white text-xs sm:text-sm leading-snug group-hover:text-emerald-300 transition-colors">
                                {p.fullName}
                              </h3>
                              <span className={`text-[9px] font-mono font-medium px-2 py-0.5 rounded border ${relationBadge.bg}`}>
                                {p.relation}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {p.sex === 'F' ? 'Female' : p.sex === 'M' ? 'Male' : 'Other'}
                              <span className="mx-1 text-slate-600">/</span>
                              {filterFacilityOnly ? (
                                p.orderCount > 0 ? (
                                  <>
                                    <strong className="text-emerald-400 font-mono tabular-nums">{p.orderCount}</strong> report{p.orderCount === 1 ? '' : 's'} at {activeHospital.shortName}
                                  </>
                                ) : (
                                  <>
                                    <span className="text-slate-500">0 at {activeHospital.shortName}</span>
                                    {p.totalNetworkOrderCount > 0 && (
                                      <span className="text-[10px] text-slate-400 ml-1">({p.totalNetworkOrderCount} in network)</span>
                                    )}
                                  </>
                                )
                              ) : (
                                <>
                                  <strong className="text-emerald-400 font-mono tabular-nums">{p.totalNetworkOrderCount ?? p.orderCount ?? 0}</strong> report{(p.totalNetworkOrderCount ?? p.orderCount ?? 0) === 1 ? '' : 's'}
                                </>
                              )}
                            </p>
                          </div>
                        </div>

                        <svg className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    );
                  })}
                </div>

                {/* "All Family Reports" Option Full Width */}
                <div
                  onClick={() => handleSelect(null)}
                  className="p-4 rounded-xl border border-white/10 hover:border-emerald-500/40 bg-[#0c1c28]/80 hover:bg-[#0c1c28] transition-all cursor-pointer flex items-center justify-between group shadow-sm"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-all flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-sm leading-snug group-hover:text-emerald-300 transition-colors">
                        {filterFacilityOnly ? `All ${activeHospital.shortName} Reports` : t('profileAll')}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {filterFacilityOnly
                          ? `View diagnostic timeline across ${totalReports} test orders at ${activeHospital.name}`
                          : `View unified diagnostic timeline across all ${totalReports} family test orders across the network`}
                      </p>
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Longitudinal Biomarker Health Overview & AI Trajectory Forecast Card */}
                <div className="p-4 rounded-xl border border-teal-500/30 bg-[#0c1c28]/90 backdrop-blur-xl shadow-lg space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-teal-500/15 text-teal-300 flex items-center justify-center border border-teal-500/30">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-xs sm:text-sm">
                          {lang === 'te' ? 'దీర్ఘకాలిక బయోమార్కర్ అంతర్దృష్టులు' : lang === 'hi' ? 'अनुदैर्ध्य बायोमार्कर अंतर्दृष्टि' : 'Longitudinal Biomarker Insights'}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Verified Laboratory Analyzers • Trend Analysis
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsTrendsModalOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 font-mono text-[11px] font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      <span>AI Trajectory</span>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Vitals Summary Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
                    <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                      <span className="text-[10px] text-slate-400 block truncate">Fasting Glucose</span>
                      <strong className="text-white text-sm font-bold tabular-nums">94</strong>
                      <span className="text-[10px] text-slate-400 ml-1">mg/dL</span>
                      <span className="text-[9px] text-emerald-400 block font-sans font-semibold">Normal (70-99)</span>
                    </div>

                    <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                      <span className="text-[10px] text-slate-400 block truncate">HbA1c Glycated</span>
                      <strong className="text-white text-sm font-bold tabular-nums">5.4</strong>
                      <span className="text-[10px] text-slate-400 ml-1">%</span>
                      <span className="text-[9px] text-emerald-400 block font-sans font-semibold">Optimal Non-DM</span>
                    </div>

                    <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                      <span className="text-[10px] text-slate-400 block truncate">Total Cholesterol</span>
                      <strong className="text-white text-sm font-bold tabular-nums">182</strong>
                      <span className="text-[10px] text-slate-400 ml-1">mg/dL</span>
                      <span className="text-[9px] text-emerald-400 block font-sans font-semibold">Desirable (&lt;200)</span>
                    </div>

                    <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                      <span className="text-[10px] text-slate-400 block truncate">Serum Creatinine</span>
                      <strong className="text-white text-sm font-bold tabular-nums">0.88</strong>
                      <span className="text-[10px] text-slate-400 ml-1">mg/dL</span>
                      <span className="text-[9px] text-emerald-400 block font-sans font-semibold">Healthy Renal</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Home Collection Tracker Card (Moved to bottom of Patient Profile) */}
        {homeCollections.length > 0 && (
          <section aria-label="Active Home Sample Tracking" className="space-y-3.5 pt-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <h2 className="font-bold text-xs sm:text-sm tracking-tight text-white uppercase font-mono">
                  Active Doorstep Sample Tracking
                </h2>
              </div>
              <button
                type="button"
                onClick={() => fetchHomeCollections()}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono transition cursor-pointer text-slate-300 flex items-center gap-1.5 border border-white/10 active:scale-95"
                title="Refresh tracking status"
              >
                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh Status</span>
              </button>
            </div>

            {homeCollections.map((col, cIdx) => (
              <div key={col.id || col.bookingId || cIdx} className="bg-[#0c1c28]/95 backdrop-blur-xl rounded-2xl border border-emerald-500/30 shadow-xl overflow-hidden space-y-0">
                {/* Header Strip */}
                <div className="bg-[#0f2838] text-white p-3.5 sm:px-5 flex items-center justify-between border-b border-white/10 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm tracking-tight">Home Sample Tracking</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">#{col.bookingId}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30 font-mono">
                      {col.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <div className="p-4 sm:p-5 space-y-4">
                  {/* Stepper Progress Bar */}
                  {(() => {
                    const st = col.status;
                    const isAssigned = ['PHLEBOTOMIST_ASSIGNED', 'SAMPLE_COLLECTED', 'RECEIVED_AT_LAB', 'PUBLISHED'].includes(st);
                    const isCollected = ['SAMPLE_COLLECTED', 'RECEIVED_AT_LAB', 'PUBLISHED'].includes(st);
                    const isInLab = ['RECEIVED_AT_LAB', 'PUBLISHED'].includes(st);
                    const currentStepNum = isInLab ? 4 : isCollected ? 3 : isAssigned ? 2 : 1;

                    const steps = [
                      { label: '1. Booked', done: true },
                      { label: '2. Assigned', done: isAssigned },
                      { label: '3. Collected', done: isCollected },
                      { label: '4. In Lab', done: isInLab },
                    ];

                    return (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono text-slate-300">
                          <span>Doorstep Fulfillment Progress</span>
                          <span className="text-emerald-400 font-bold">Step {currentStepNum} of 4</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {steps.map((step, idx) => (
                            <div key={idx} className="space-y-1">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  step.done ? 'bg-emerald-400' : 'bg-white/10'
                                }`}
                              />
                              <span
                                className={`text-[11px] block leading-tight truncate ${
                                  step.done ? 'font-semibold text-white' : 'text-slate-400'
                                }`}
                              >
                                {step.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Booking Details Box */}
                    <div className="md:col-span-2 bg-white/5 rounded-xl p-3.5 border border-white/10 space-y-2.5 text-xs">
                      <div className="flex justify-between items-start gap-2 flex-wrap">
                        <div>
                          <span className="text-[10px] font-mono text-slate-400 uppercase block">Test Package</span>
                          <span className="font-semibold text-white text-sm leading-tight block">{col.packageName}</span>
                        </div>
                        <div>
                          {col.paymentMethod === 'ONLINE_RAZORPAY' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                              <span>Paid {col.paymentAmount || '₹450'} (Razorpay)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
                              <span>Pay Cash: {col.paymentAmount || '₹990'}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
                        <div>
                          <span className="text-slate-400 text-[10px] block font-mono">Scheduled Window</span>
                          <strong className="text-slate-200 block">{col.preferredDate}</strong>
                          <span className="text-emerald-400 font-mono">{col.timeSlot}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block font-mono">Patient / Address</span>
                          <strong className="text-slate-200 block truncate">{col.patientName}</strong>
                          <span className="text-slate-400 truncate block">{col.address}</span>
                        </div>
                      </div>
                    </div>

                    {/* Verification OTP & Phlebotomist Details */}
                    <div className="p-3.5 bg-emerald-500/10 rounded-xl border border-emerald-500/25 flex flex-col justify-between gap-2.5">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-emerald-400 block font-semibold">Sample Verification OTP</span>
                        <span className="text-2xl font-bold font-mono tracking-widest text-white block mt-0.5 tabular-nums">
                          {col.collectionOtp || '6842'}
                        </span>
                        <span className="text-[10px] text-slate-400 block">Give this code to phlebotomist at doorstep</span>
                      </div>

                      {col.assignedPhlebotomist && (
                        <div className="pt-2 border-t border-emerald-500/20 flex items-center justify-between">
                          <div>
                            <strong className="text-xs font-semibold text-white block">{col.assignedPhlebotomist.name}</strong>
                            <span className="text-[10px] font-mono text-slate-400 block">{col.assignedPhlebotomist.badgeId}</span>
                          </div>
                          <a
                            href={`tel:${col.assignedPhlebotomist.phone}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 hover:text-emerald-200 bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            <span>Call</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        <div className="pt-2 text-center">
          <a
            href="/privacy"
            className="text-xs text-slate-400 hover:text-emerald-400 font-medium transition inline-flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Privacy & Data Rights (DPDP Act 2023)</span>
          </a>
        </div>
      </main>

      <footer className="p-4 text-center text-xs text-slate-400 max-w-7xl w-full mx-auto">
        <span>Company A Diagnostics • Family Health Records</span>
      </footer>

      {/* Home Sample Collection Booking Modal */}
      <HomeCollectionModal
        isOpen={isHomeCollectionOpen}
        onClose={() => setIsHomeCollectionOpen(false)}
        onSuccess={fetchHomeCollections}
      />

      {/* ABHA National Health Locker Modal */}
      <AbhaModal
        isOpen={isAbhaOpen}
        onClose={() => setIsAbhaOpen(false)}
        patientName={profiles?.[0]?.name || 'Lakshmi Prasanna K'}
        gender={profiles?.[0]?.gender || 'Female'}
        yob={profiles?.[0]?.yob || '1988'}
        uhid={profiles?.[0]?.uhid || 'UHID-AP-2026-90412'}
      />

      {/* Longitudinal Biomarker Health Trajectory Modal */}
      <BiomarkerTrendsModal
        isOpen={isTrendsModalOpen}
        onClose={() => setIsTrendsModalOpen(false)}
        patientName={profiles?.[0]?.fullName || 'Lakshmi Prasanna K'}
      />

      {/* Floating Global AI Copilot */}
      <FloatingAICopilot />
    </div>
  );
}
