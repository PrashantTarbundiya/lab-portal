import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../utils/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import StatusChip from '../../components/StatusChip';
import PatientNavbar from '../../components/PatientNavbar';
import DemoRibbon from '../../components/DemoRibbon';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import { SkeletonCard } from '../../components/Skeleton';
import FloatingAICopilot from '../../components/FloatingAICopilot';
import HomeCollectionModal from '../../components/HomeCollectionModal';
import { HOSPITALS } from '../../components/TopMainNavbar';

// Authentic family member demo accounts
const DEMO_FAMILY_MEMBERS = [
  { id: 'cmw06qpoc000ptl10sl19di9o', fullName: 'Lakshmi Prasanna K', relation: 'SELF', sex: 'F', orderCount: 3 },
  { id: 'cmw06qq0i000rtl10qfeib6oc', fullName: 'Srinivas Rao T', relation: 'SPOUSE', sex: 'M', orderCount: 2 },
  { id: 'cmw06qq6s000ttl10awv7mrde', fullName: 'Bhavani K', relation: 'CHILD', sex: 'F', orderCount: 1 },
  { id: 'cmw06qqde000vtl10gfymhuj7', fullName: 'Raghavendra T', relation: 'CHILD', sex: 'M', orderCount: 0 },
  { id: 'cmw0fmtsi0001tl7454v6jaqu', fullName: 'Kavya Murthy', relation: 'SELF', sex: 'F', orderCount: 2 },
];

// Distinct, separate reports per person with explicit hospital facility mapping
export const DEMO_REPORTS_BY_PERSON = [
  // --- Lakshmi Prasanna K (cmw06qpoc000ptl10sl19di9o) ---
  {
    id: 'cmw06r5ex0034tl10yg46q93p',
    orderNo: 'ORD-71204',
    patientId: 'cmw06qpoc000ptl10sl19di9o',
    patientName: 'Lakshmi Prasanna K',
    relation: 'SELF',
    testName: 'Complete Blood Count (CBC) with Differential',
    date: '2026-11-01T10:15:00+05:30',
    status: 'SIGNED',
    isHeld: false,
    hasCritical: true,
    resultCount: 4,
    hospitalSlug: 'company-a-main-hospital',
    hospitalName: 'Company A Main Super-Specialty Hospital',
    hospitalShortName: 'Company A Main',
    hospitalBadge: 'MG Road Enclave',
    doctorName: 'Dr. S. Ramanaiah, MD',
  },
  {
    id: 'cmw0fjf0m0001tlmguem56cz1',
    orderNo: 'ORD-71250',
    patientId: 'cmw06qpoc000ptl10sl19di9o',
    patientName: 'Lakshmi Prasanna K',
    relation: 'SELF',
    testName: 'Thyroid & Vitamin Wellness Panel (TSH, D3, B12)',
    date: '2026-11-03T08:32:00+05:30',
    status: 'SIGNED',
    isHeld: false,
    hasCritical: false,
    resultCount: 5,
    hospitalSlug: 'company-a-main-hospital',
    hospitalName: 'Company A Main Super-Specialty Hospital',
    hospitalShortName: 'Company A Main',
    hospitalBadge: 'MG Road Enclave',
    doctorName: 'Dr. S. Ramanaiah, MD',
  },
  {
    id: 'cmw0ghvqg0009tli0li63c72b',
    orderNo: 'ORD-69102',
    patientId: 'cmw06qpoc000ptl10sl19di9o',
    patientName: 'Lakshmi Prasanna K',
    relation: 'SELF',
    testName: 'Glycated Hemoglobin (HbA1c) & Fasting Plasma Glucose',
    date: '2026-10-25T07:45:00+05:30',
    status: 'SIGNED',
    isHeld: false,
    hasCritical: false,
    resultCount: 3,
    hospitalSlug: 'company-a-central-lab',
    hospitalName: 'Company A Central Reference Lab',
    hospitalShortName: 'Reference Lab',
    hospitalBadge: 'Suryaraopet',
    doctorName: 'Dr. P. Anitha, MD',
  },

  // --- Srinivas Rao T (cmw06qq0i000rtl10qfeib6oc) ---
  {
    id: 'cmw06r79n003itl10fl2od2e2',
    orderNo: 'ORD-71205',
    patientId: 'cmw06qq0i000rtl10qfeib6oc',
    patientName: 'Srinivas Rao T',
    relation: 'SPOUSE',
    testName: 'Diabetes & Comprehensive Lipid Profile',
    date: '2026-11-01T11:00:00+05:30',
    status: 'SIGNED',
    isHeld: false,
    hasCritical: false,
    resultCount: 6,
    hospitalSlug: 'manipal-hospital',
    hospitalName: 'Manipal Super-Specialty Hospital',
    hospitalShortName: 'Manipal Hospital',
    hospitalBadge: 'Governorpet',
    doctorName: 'Dr. Raviteja, MD',
  },
  {
    id: 'cmw0ghrzq0001tli0j7tbqsm8',
    orderNo: 'ORD-68910',
    patientId: 'cmw06qq0i000rtl10qfeib6oc',
    patientName: 'Srinivas Rao T',
    relation: 'SPOUSE',
    testName: 'Renal & Hepatic Vital Health Panel (KFT + LFT)',
    date: '2026-10-22T08:15:00+05:30',
    status: 'SIGNED',
    isHeld: false,
    hasCritical: false,
    resultCount: 8,
    hospitalSlug: 'company-a-central-lab',
    hospitalName: 'Company A Central Reference Lab',
    hospitalShortName: 'Reference Lab',
    hospitalBadge: 'Suryaraopet',
    doctorName: 'Dr. R. Naidu, MD',
  },

  // --- Bhavani K (cmw06qq6s000ttl10awv7mrde) ---
  {
    id: 'cmw06rkrq005stl10gfune1yh',
    orderNo: 'ORD-71239',
    patientId: 'cmw06qq6s000ttl10awv7mrde',
    patientName: 'Bhavani K',
    relation: 'CHILD',
    testName: 'Pediatric Immunity & Serum Ferritin Profile',
    date: '2026-10-28T09:30:00+05:30',
    status: 'SIGNED',
    isHeld: false,
    hasCritical: false,
    resultCount: 4,
    hospitalSlug: 'ggh-vijayawada',
    hospitalName: 'Government General Hospital (GGH)',
    hospitalShortName: 'GGH Vijayawada',
    hospitalBadge: 'Teaching Hospital',
    doctorName: 'Dr. B. Sarojini, MD',
  },

  // --- Kavya Murthy (cmw0fmtsi0001tl7454v6jaqu) ---
  {
    id: 'cmw0fmvwt0003tl749gc97cha',
    orderNo: 'ORD-78486',
    patientId: 'cmw0fmtsi0001tl7454v6jaqu',
    patientName: 'Kavya Murthy',
    relation: 'SELF',
    testName: 'Comprehensive Metabolic Panel (CMP-14)',
    date: '2026-11-02T10:00:00+05:30',
    status: 'SIGNED',
    isHeld: false,
    hasCritical: false,
    resultCount: 14,
    hospitalSlug: 'apollo-hospital-vijayawada',
    hospitalName: 'Apollo Specialty Hospital',
    hospitalShortName: 'Apollo Hospital',
    hospitalBadge: 'Benz Circle',
    doctorName: 'Dr. Harish Reddy, MD',
  },
  {
    id: 'cmw0folxv0001tlyc49hg8pjv',
    orderNo: 'ORD-92892',
    patientId: 'cmw0fmtsi0001tl7454v6jaqu',
    patientName: 'Kavya Murthy',
    relation: 'SELF',
    testName: 'Doctor Consultation Follow-up Pathology Review',
    date: '2026-11-04T09:15:00+05:30',
    status: 'SIGNED',
    isHeld: false,
    hasCritical: false,
    resultCount: 5,
    hospitalSlug: 'apollo-hospital-vijayawada',
    hospitalName: 'Apollo Specialty Hospital',
    hospitalShortName: 'Apollo Hospital',
    hospitalBadge: 'Benz Circle',
    doctorName: 'Dr. Rajeshwari Varma, MD',
  },
];

export default function ReportList() {
  const [orders, setOrders] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('ALL');
  const [isHomeCollectionOpen, setIsHomeCollectionOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { identifier } = useParams();
  const { token, account, logout } = useAuth();
  const { t } = useLanguage();

  const [activeHospitalSlug, setActiveHospitalSlug] = useState(
    () => searchParams.get('hospitalSlug') || localStorage.getItem('labora_active_hospital_slug') || 'apollo-hospital-vijayawada'
  );
  const [filterFacilityOnly, setFilterFacilityOnly] = useState(
    () => Boolean(searchParams.get('hospitalSlug') || localStorage.getItem('labora_active_hospital_slug'))
  );

  const activeHospital =
    HOSPITALS.find((h) => h.slug === activeHospitalSlug) || HOSPITALS[0];

  const patientIdentifier = identifier || account?.mobileE164?.replace(/\D/g, '') || (token?.startsWith('demo-patient:') ? token.split(':')[1]?.replace(/\D/g, '') : null) || account?.id || '9000000001';

  // Ensure unique patient ID is in the URL path: /patient/:identifier/reports
  useEffect(() => {
    if (!identifier && patientIdentifier) {
      const q = searchParams.toString() ? `?${searchParams.toString()}` : '';
      navigate(`/patient/${patientIdentifier}/reports${q}`, { replace: true });
    }
  }, [identifier, patientIdentifier, searchParams, navigate]);

  const patientId = searchParams.get('patientId');

  // Find active patient profile from loaded profiles
  const activeProfile = profiles.find((p) => {
    if (!patientId || patientId === 'all') return false;
    if (p.id === patientId) return true;
    const pClean = patientId.toLowerCase();
    if (pClean === 'p1' && p.fullName.toLowerCase().includes('lakshmi')) return true;
    if (pClean === 'p2' && p.fullName.toLowerCase().includes('srinivas')) return true;
    if (pClean === 'p3' && p.fullName.toLowerCase().includes('bhavani')) return true;
    if (pClean === 'p4' && p.fullName.toLowerCase().includes('raghavendra')) return true;
    if (pClean === 'p5' && p.fullName.toLowerCase().includes('kavya')) return true;
    return p.fullName.toLowerCase().includes(pClean);
  });

  // Fetch Family Profiles to power the quick member switcher
  const fetchProfiles = async () => {
    try {
      const res = await api('/patients/profiles', { token });
      if (res?.patients) {
        setProfiles(res.patients);
      }
    } catch {
      if (token?.includes('9000000001')) {
        setProfiles(DEMO_FAMILY_MEMBERS);
      }
    }
  };

  const fetchOrders = async (hospSlug = activeHospitalSlug, facilityOnly = filterFacilityOnly) => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (patientId) params.append('patientId', patientId);
      if (facilityOnly && hospSlug && hospSlug !== 'all') {
        params.append('hospitalSlug', hospSlug);
      }
      const query = params.toString() ? `?${params.toString()}` : '';
      const res = await api(`/orders${query}`, { token });
      if (res?.orders) {
        setOrders(res.orders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.warn('Orders fetch error:', err);
      if (token?.includes('9000000001')) {
        let fallback = DEMO_REPORTS_BY_PERSON;
        if (facilityOnly && hospSlug && hospSlug !== 'all') {
          fallback = fallback.filter((o) => o.hospitalSlug === hospSlug);
        }
        setOrders(fallback);
      } else {
        setOrders([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    fetchOrders(activeHospitalSlug, filterFacilityOnly);
  }, [patientId, activeHospitalSlug, filterFacilityOnly]);

  // Listen to TopMainNavbar hospital switcher
  useEffect(() => {
    const handleHospitalChanged = (e) => {
      const newSlug = e?.detail?.hospitalSlug || localStorage.getItem('labora_active_hospital_slug') || 'company-a-main-hospital';
      setActiveHospitalSlug(newSlug);
      setFilterFacilityOnly(true);
      fetchOrders(newSlug, true);
    };

    window.addEventListener('hospital-changed', handleHospitalChanged);
    window.addEventListener('storage', handleHospitalChanged);

    return () => {
      window.removeEventListener('hospital-changed', handleHospitalChanged);
      window.removeEventListener('storage', handleHospitalChanged);
    };
  }, [patientId]);

  // Strict profile and search filtering
  const filteredOrders = orders.filter((o) => {
    // 0. Hospital Facility Isolation
    if (filterFacilityOnly && activeHospitalSlug && activeHospitalSlug !== 'all') {
      if (o.hospitalSlug && o.hospitalSlug !== activeHospitalSlug) {
        return false;
      }
    }

    // 1. Strict Patient Profile Isolation
    if (patientId && patientId !== 'all') {
      const pClean = patientId.toLowerCase();
      const matchesDirectId = o.patientId === patientId;
      const matchesActiveProfileId = activeProfile && o.patientId === activeProfile.id;
      const matchesAlias =
        (pClean === 'p1' && o.patientName?.toLowerCase().includes('lakshmi')) ||
        (pClean === 'p2' && o.patientName?.toLowerCase().includes('srinivas')) ||
        (pClean === 'p3' && o.patientName?.toLowerCase().includes('bhavani')) ||
        (pClean === 'p4' && o.patientName?.toLowerCase().includes('raghavendra')) ||
        (pClean === 'p5' && o.patientName?.toLowerCase().includes('kavya'));
      const matchesName = activeProfile
        ? o.patientName?.toLowerCase().includes(activeProfile.fullName.toLowerCase())
        : o.patientName?.toLowerCase().includes(pClean);

      if (!matchesDirectId && !matchesActiveProfileId && !matchesAlias && !matchesName) {
        return false;
      }
    }

    // 2. Tab Filter
    if (filterTab === 'SIGNED' && o.status !== 'SIGNED') return false;
    if (filterTab === 'PROCESSING' && o.status !== 'PROCESSING') return false;
    if (filterTab === 'CRITICAL' && !o.hasCritical) return false;

    // 3. Search Term
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (o.orderNo || '').toLowerCase().includes(q) ||
      (o.testName || '').toLowerCase().includes(q) ||
      (o.patientName || '').toLowerCase().includes(q)
    );
  });

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const handleSwitchMember = (targetId) => {
    if (!targetId || targetId === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ patientId: targetId });
    }
  };

  return (
    <div className="min-h-screen bg-[#07151f] text-slate-100 flex flex-col justify-between relative overflow-x-hidden selection:bg-emerald-400 selection:text-slate-950 font-sans">
      {/* Stitch Deep-Teal Atmospheric Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-36 left-1/4 w-[750px] h-[750px] bg-teal-500/10 rounded-full blur-[140px]"></div>
        <div className="absolute top-1/3 -right-40 w-[620px] h-[620px] bg-emerald-500/10 rounded-full blur-[160px]"></div>
        <div className="absolute -bottom-32 left-1/3 w-[850px] h-[850px] bg-slate-900/40 rounded-full blur-[180px]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(#4edea3_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.035]"></div>
      </div>

      <DemoRibbon />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-5xl w-full mx-auto space-y-5 relative z-10">
        {/* Navigation Breadcrumb & Action Row */}
        <div className="flex items-center justify-between gap-3">
          <Link
            to={`/patient/${patientIdentifier}/profiles`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition"
          >
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Family Vault</span>
          </Link>

          <button
            type="button"
            onClick={async () => {
              try {
                localStorage.removeItem('portal_token');
                await logout();
              } catch {
                localStorage.removeItem('portal_token');
              }
              navigate('/');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition cursor-pointer active:scale-95 shadow-sm"
            title="Log out of Patient Account"
          >
            <svg className="w-3.5 h-3.5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>

        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {activeProfile ? `${activeProfile.fullName.split(' ')[0]}'s Diagnostic Records` : t('reportsTitle')}
              </h1>
              <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                {filteredOrders.length} {filteredOrders.length === 1 ? 'Record' : 'Records'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Pathology tests, laboratory biomarkers, and digital medical signatures
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsHomeCollectionOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-lg transition cursor-pointer shadow-sm active:scale-95"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              <span>Book Collection</span>
            </button>
            <Link
              to="/book-appointment"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition cursor-pointer shadow-sm active:scale-95"
            >
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Nearby Hospitals</span>
            </Link>
            <button
              onClick={fetchOrders}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center border border-white/10 transition cursor-pointer"
              title="Refresh Reports"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* ─── HOSPITAL FACILITY CONTEXT & SWITCHER STRIP ─── */}
        <div className="bg-[#0c1c28]/95 backdrop-blur-xl p-3.5 rounded-2xl border border-white/10 shadow-md space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs text-slate-300 font-medium">Selected Facility:</span>
              <span className="text-xs font-semibold text-white bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
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
                  fetchOrders(activeHospitalSlug, next);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  filterFacilityOnly
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                }`}
              >
                <span>{filterFacilityOnly ? `Filtering: ${activeHospital.shortName}` : 'Filter: All Network Facilities'}</span>
              </button>
            </div>
          </div>

          {/* Quick Facility Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => {
                setFilterFacilityOnly(false);
                fetchOrders('all', false);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                !filterFacilityOnly
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              <span>All Facilities</span>
              <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded ${!filterFacilityOnly ? 'bg-black/30 text-white' : 'bg-white/10 text-slate-300'}`}>
                {DEMO_REPORTS_BY_PERSON.length}
              </span>
            </button>

            {HOSPITALS.map((h) => {
              const isSelected = activeHospitalSlug === h.slug && filterFacilityOnly;
              const count = DEMO_REPORTS_BY_PERSON.filter((o) => o.hospitalSlug === h.slug).length;

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
                    fetchOrders(h.slug, true);
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

        {/* ─── FAMILY MEMBER SELECTOR BAR ─── */}
        <div className="bg-[#0c1c28]/80 rounded-xl border border-white/10 p-3 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 text-[11px] font-mono flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Family Member Profile:</span>
            </span>
            {activeProfile && (
              <span className="text-[11px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Viewing: <strong className="text-white">{activeProfile.fullName}</strong> ({activeProfile.relation})
              </span>
            )}
          </div>

          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => handleSwitchMember('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                !patientId || patientId === 'all'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>All Family Members</span>
            </button>

            {profiles.map((p) => {
              const isSelected = activeProfile?.id === p.id || patientId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSwitchMember(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-slate-950' : 'bg-slate-400'}`}></span>
                  <span>{p.fullName}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isSelected ? 'bg-black/20 text-slate-950 font-bold' : 'bg-white/10 text-slate-400'
                  }`}>
                    {p.relation}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Bar & Status Filter */}
        <div className="space-y-2.5 bg-[#0c1c28]/80 rounded-xl border border-white/10 p-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by test name, order #, or parameter..."
              className="w-full pl-8 pr-8 py-2 bg-white/5 rounded-lg border border-white/10 text-xs text-white placeholder-slate-400 focus:border-emerald-400 focus:outline-none transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
                aria-label="Clear search"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>

          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs font-mono">
            {[
              { id: 'ALL', label: `All (${filteredOrders.length})` },
              { id: 'SIGNED', label: `Verified (${filteredOrders.filter(o => o.status === 'SIGNED').length})` },
              { id: 'CRITICAL', label: `Critical (${filteredOrders.filter(o => o.hasCritical).length})` },
              { id: 'PROCESSING', label: `In Lab (${filteredOrders.filter(o => o.status === 'PROCESSING').length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id)}
                className={`px-3 py-1 rounded-lg transition cursor-pointer whitespace-nowrap text-xs font-medium ${
                  filterTab === tab.id
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : error ? (
          <ErrorState description={error} onRetry={fetchOrders} />
        ) : filteredOrders.length === 0 ? (
          <div className="bg-[#0c1c28]/80 rounded-2xl border border-white/10 p-8 text-center space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-white text-base">
                {activeProfile ? `No reports on file for ${activeProfile.fullName}` : 'No diagnostic reports match your filter'}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {activeProfile
                  ? `${activeProfile.fullName} does not have any active or signed pathology records yet. You can book a home sample collection or an OPD appointment below.`
                  : searchTerm
                  ? `No pathology records match "${searchTerm}". Try resetting your search or filter.`
                  : 'Verified test results will be automatically stored in this health vault once released.'}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsHomeCollectionOpen(true)}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition shadow-sm cursor-pointer"
              >
                Book Home Sample Collection
              </button>
              <Link
                to="/book-appointment"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold rounded-lg border border-white/10 transition shadow-sm"
              >
                Find Nearby Hospital OPD
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredOrders.map((order) => {
              const isCritical = order.hasCritical;
              const cardBorder = isCritical
                ? 'border border-rose-500/40 bg-[#16121a]/80'
                : 'border border-white/10 bg-[#0c1c28]/80';

              return (
                <div
                  key={order.id}
                  onClick={() => navigate(`/patient/${patientIdentifier}/reports/${order.id}`)}
                  className={`p-4 rounded-xl hover:border-emerald-500/40 hover:bg-[#0c1c28] transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.99] shadow-sm ${cardBorder}`}
                >
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-bold text-white text-xs sm:text-sm leading-snug group-hover:text-emerald-300 transition-colors">
                            {order.testName}
                          </h2>
                          {isCritical && (
                            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                              Critical Alert
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <span>Patient:</span>
                          <strong className="text-slate-200">{order.patientName}</strong>
                          {order.relation && (
                            <span className="text-[10px] font-mono bg-white/5 text-emerald-300 px-1.5 py-0.2 rounded border border-white/10">
                              {order.relation}
                            </span>
                          )}
                        </p>
                      </div>

                      <StatusChip status={order.status} isHeld={order.isHeld} />
                    </div>

                    <div className="flex items-center gap-2 flex-wrap pt-0.5">
                      {order.resultCount && (
                        <div className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                          <span>{order.resultCount} Biomarkers</span>
                        </div>
                      )}

                      {order.hospitalName && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                          <svg className="w-3 h-3 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                          <span>{order.hospitalShortName || order.hospitalName}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2.5 mt-2.5 border-t border-white/10">
                    <div className="tabular-nums flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                      <span className="bg-white/5 text-white px-1.5 py-0.5 rounded font-mono text-[10px] border border-white/10">#{order.orderNo}</span>
                      <span>•</span>
                      <span>{formatDate(order.date)}</span>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
                      <span>{t('openReport')}</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer className="p-4 text-center text-xs text-slate-400 max-w-5xl w-full mx-auto">
        <a href="/privacy" className="hover:underline text-slate-500 font-medium">
          Privacy & Data Rights (DPDP Act 2023)
        </a>
        <span className="mx-2">•</span>
        <span>Company A Diagnostics</span>
      </footer>

      {/* Home Sample Collection Booking Modal */}
      <HomeCollectionModal
        isOpen={isHomeCollectionOpen}
        onClose={() => setIsHomeCollectionOpen(false)}
        defaultPatientName={activeProfile?.fullName || ''}
        onSuccess={fetchOrders}
      />

      {/* Floating Global AI Copilot */}
      <FloatingAICopilot />
    </div>
  );
}
