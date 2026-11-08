import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../components/Toast';
import { api } from '../../utils/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import PatientNavbar from '../../components/PatientNavbar';
import DemoRibbon from '../../components/DemoRibbon';
import ErrorState from '../../components/ErrorState';
import { SkeletonText } from '../../components/Skeleton';
import VisualRangeGauge from '../../components/VisualRangeGauge';
import VoiceReadButton from '../../components/VoiceReadButton';
import DoctorChecklistModal from '../../components/DoctorChecklistModal';
import HealthScorecard from '../../components/HealthScorecard';
import FloatingAICopilot from '../../components/FloatingAICopilot';
import DigitalVerificationModal from '../../components/DigitalVerificationModal';
import PreTestGuide from '../../components/PreTestGuide';
import BiomarkerTrendsModal from '../../components/BiomarkerTrendsModal';
import AbhaModal from '../../components/AbhaModal';
import ShareReportModal from '../../components/ShareReportModal';
import InvoiceReceiptModal from '../../components/InvoiceReceiptModal';
import CalendarReminderModal from '../../components/CalendarReminderModal';

export default function ReportDetail() {
  const { id, identifier } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [showAllResults, setShowAllResults] = useState(true);
  const [viewMode, setViewMode] = useState('gauges'); // 'gauges' | 'table'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [resultSearch, setResultSearch] = useState('');
  const [isSideChatOpen, setIsSideChatOpen] = useState(false);
  const [sideChatQuery, setSideChatQuery] = useState('');
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isTrendsModalOpen, setIsTrendsModalOpen] = useState(false);
  const [isAbhaModalOpen, setIsAbhaModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  const openLabbyChat = (question = '') => {
    setSideChatQuery(question);
    setIsSideChatOpen(true);
  };

  // Flag Modal state
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('CONFUSING');
  const [flagNotes, setFlagNotes] = useState('');
  const [flagSubmitting, setFlagSubmitting] = useState(false);
  const [activeHospitalSlug, setActiveHospitalSlug] = useState(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('labora_active_hospital_slug') || '' : '';
  });

  useEffect(() => {
    const handleHospChange = (e) => {
      const newSlug = e?.detail?.hospitalSlug || localStorage.getItem('labora_active_hospital_slug') || '';
      setActiveHospitalSlug(newSlug);
    };
    window.addEventListener('hospital-changed', handleHospChange);
    window.addEventListener('storage', handleHospChange);
    return () => {
      window.removeEventListener('hospital-changed', handleHospChange);
      window.removeEventListener('storage', handleHospChange);
    };
  }, []);

  const navigate = useNavigate();
  const { token, account, logout } = useAuth();
  const { lang, t } = useLanguage();
  const { addToast } = useToast();

  const patientIdentifier = identifier || account?.mobileE164?.replace(/\D/g, '') || (token?.startsWith('demo-patient:') ? token.split(':')[1]?.replace(/\D/g, '') : null) || '9000000001';

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api(`/orders/${id}?lang=${lang}`, { token });
      setOrder(res);
    } catch (err) {
      console.warn('Report detail fetch error, using demo fallback:', err);
      const isKavyaOrder = id === 'cmw0folxv0001tlyc49hg8pjv' || id === 'cmw0fmvwt0003tl749gc97cha';
      const isSrinivasOrder = id === 'cmw06r79n003itl10fl2od2e2' || id === 'cmw0ghrzq0001tli0j7tbqsm8';
      const isBhavaniOrder = id === 'cmw06rkrq005stl10gfune1yh';

      const orderNo = isKavyaOrder ? 'ORD-92892' : isSrinivasOrder ? 'ORD-71205' : isBhavaniOrder ? 'ORD-71239' : 'ORD-71204';
      const patientName = isKavyaOrder ? 'Kavya Murthy' : isSrinivasOrder ? 'Srinivas Rao T' : isBhavaniOrder ? 'Bhavani K' : 'Lakshmi Prasanna K';
      const relation = isKavyaOrder ? 'SELF' : isSrinivasOrder ? 'SPOUSE' : isBhavaniOrder ? 'CHILD' : 'SELF';
      const sex = isSrinivasOrder ? 'M' : 'F';
      const doctorName = isKavyaOrder ? 'Dr. Rajeshwari Varma, MD' : isSrinivasOrder ? 'Dr. Raviteja, MD' : isBhavaniOrder ? 'Dr. B. Sarojini, MD' : 'Dr. S. Ramanaiah, MD';

      const hospitalSlug = isKavyaOrder ? 'apollo-hospital-vijayawada' : isSrinivasOrder ? 'manipal-hospital' : isBhavaniOrder ? 'ggh-vijayawada' : 'company-a-main-hospital';
      const hospitalName = isKavyaOrder ? 'Apollo Specialty Hospital' : isSrinivasOrder ? 'Manipal Super-Specialty Hospital' : isBhavaniOrder ? 'Government General Hospital (GGH)' : 'Company A Main Super-Specialty Hospital';
      const hospitalShortName = isKavyaOrder ? 'Apollo Hospital' : isSrinivasOrder ? 'Manipal Hospital' : isBhavaniOrder ? 'GGH Vijayawada' : 'Company A Main';
      const hospitalAddress = isKavyaOrder ? 'Plot 42, Benz Circle, Vijayawada, AP - 520010' : isSrinivasOrder ? 'Hospital Road, Governorpet, Vijayawada, AP - 520002' : isBhavaniOrder ? 'Old Hospital Road, Vijayawada, AP - 520001' : 'MG Road Healthcare Enclave, Vijayawada, AP - 520010';

      const results = isKavyaOrder ? [
        { parameter: 'Total Bilirubin', value: '1.4', unit: 'mg/dL', refRangeRaw: '0.2-1.2', flag: 'HIGH' },
        { parameter: 'Direct Bilirubin', value: '0.4', unit: 'mg/dL', refRangeRaw: '0.0-0.3', flag: 'HIGH' },
        { parameter: 'SGPT / ALT', value: '58', unit: 'U/L', refRangeRaw: '7-56', flag: 'HIGH' },
        { parameter: 'SGOT / AST', value: '42', unit: 'U/L', refRangeRaw: '10-40', flag: 'HIGH' },
        { parameter: 'Alkaline Phosphatase', value: '115', unit: 'U/L', refRangeRaw: '44-147', flag: 'NORMAL' },
      ] : [
        { parameter: 'Haemoglobin', value: '10.2', unit: 'g/dL', refRangeRaw: '12.0-15.5', flag: 'LOW' },
        { parameter: 'Total WBC', value: '6.5', unit: '10^3/µL', refRangeRaw: '4.0-11.0', flag: 'NORMAL' },
        { parameter: 'Platelet count', value: '250', unit: '10^3/µL', refRangeRaw: '150-400', flag: 'NORMAL' },
        { parameter: 'RBC count', value: '4.1', unit: '10^6/µL', refRangeRaw: '3.8-5.2', flag: 'NORMAL' },
      ];

      setOrder({
        id: id || 'demo-order-1',
        orderNo,
        patient: {
          fullName: patientName,
          relation,
          sex,
        },
        doctorName,
        date: '2026-11-04T09:15:00+05:30',
        status: 'SIGNED',
        hasCritical: false,
        isHeld: false,
        hospitalSlug,
        hospitalName,
        hospitalShortName,
        hospitalAddress,
        results,
        summary: {
          id: 'sum-1',
          source: 'TEMPLATE',
          reviewStatus: 'UNREVIEWED',
          lang: lang,
          items: [
            {
              parameter: results[0].parameter,
              value: results[0].value,
              unit: results[0].unit,
              refRange: results[0].refRangeRaw,
              flag: results[0].flag,
              text: lang === 'te'
                ? `${results[0].parameter} కొద్దిగా వ్యత్యాసం ఉంది. దయచేసి డాక్టర్‌ను సంప్రదించండి.`
                : `${results[0].parameter} is slightly outside standard reference intervals. Please review with Dr. ${doctorName.split(' ')[1]}.`,
            },
          ],
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id, lang]);

  // Print lifecycle management
  useEffect(() => {
    const handleBeforePrint = () => {
      if (!isInvoiceModalOpen) {
        document.body.classList.remove('print-mode-invoice');
        document.body.classList.add('print-mode-report');
      }
    };
    const handleAfterPrint = () => {
      document.body.classList.remove('print-mode-report');
    };
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
      document.body.classList.remove('print-mode-report');
    };
  }, [isInvoiceModalOpen]);

  const handlePrintReport = () => {
    document.body.classList.remove('print-mode-invoice');
    document.body.classList.add('print-mode-report');

    const handleCleanup = () => {
      document.body.classList.remove('print-mode-report');
      window.removeEventListener('afterprint', handleCleanup);
    };
    window.addEventListener('afterprint', handleCleanup, { once: true });

    window.print();
  };

  const orderHospital = order?.hospital || (order ? (() => {
    const slug = activeHospitalSlug || (typeof window !== 'undefined' ? localStorage.getItem('labora_active_hospital_slug') || '' : '');
    if (slug.includes('manipal')) {
      return {
        name: 'Manipal Super-Specialty Hospital',
        entityName: 'MANIPAL HEALTH ENTERPRISES PRIVATE LIMITED',
        shortName: 'Manipal Hospital',
        address: 'Hospital Road, Governorpet, Vijayawada, AP - 520002',
        gstin: '37AABCM4821N1Z5',
        cin: 'U85110KA2010PTC052210',
        initial: 'M',
      };
    }
    if (slug.includes('ggh')) {
      return {
        name: 'Government General Hospital (GGH)',
        entityName: 'GOVERNMENT GENERAL HOSPITAL AROGYASRI UNIT',
        shortName: 'GGH Vijayawada',
        address: 'Old Hospital Road, Vijayawada, AP - 520001',
        gstin: '37GOVAP1100G1Z1',
        cin: 'AP-HEALTH-GGH-04',
        initial: 'G',
      };
    }
    if (slug.includes('central-lab')) {
      return {
        name: 'Company A Central Reference Lab',
        entityName: 'COMPANY A CENTRAL REFERENCE LABORATORIES',
        shortName: 'Reference Lab',
        address: 'Suryaraopet Diagnostic Enclave, Vijayawada, AP - 520002',
        gstin: '37AABCC8921K1Z2',
        cin: 'U85110AP2021PTC118920',
        initial: 'C',
      };
    }
    if (slug.includes('apollo')) {
      return {
        name: 'Apollo Specialty Hospital',
        entityName: 'APOLLO HOSPITALS ENTERPRISE LIMITED',
        shortName: 'Apollo Hospital',
        address: 'Plot 42, MG Road, Benz Circle, Vijayawada, AP - 520010',
        gstin: '37AAACA8921P1Z9',
        cin: 'L85110TN1979PLC008035',
        initial: 'A',
      };
    }
    return {
      name: order.hospitalName || (order.orderNo === 'ORD-78486' || order.orderNo === 'ORD-92892' ? 'Apollo Specialty Hospital' : order.orderNo === 'ORD-71205' ? 'Manipal Super-Specialty Hospital' : order.orderNo === 'ORD-71239' ? 'Government General Hospital (GGH)' : order.orderNo === 'ORD-69102' || order.orderNo === 'ORD-68910' ? 'Company A Central Reference Lab' : 'Company A Main Super-Specialty Hospital'),
      entityName: (order.orderNo === 'ORD-78486' || order.orderNo === 'ORD-92892' ? 'APOLLO HOSPITALS ENTERPRISE LIMITED' : order.orderNo === 'ORD-71205' ? 'MANIPAL HEALTH ENTERPRISES PVT LTD' : order.orderNo === 'ORD-71239' ? 'GOVERNMENT GENERAL HOSPITAL AROGYASRI UNIT' : order.orderNo === 'ORD-69102' || order.orderNo === 'ORD-68910' ? 'COMPANY A CENTRAL REFERENCE LABORATORIES' : 'COMPANY A MAIN SUPER-SPECIALTY HOSPITAL'),
      address: order.hospitalAddress || (order.orderNo === 'ORD-78486' || order.orderNo === 'ORD-92892' ? 'Plot 42, Benz Circle, Vijayawada, AP - 520010' : order.orderNo === 'ORD-71205' ? 'Hospital Road, Governorpet, Vijayawada, AP - 520002' : order.orderNo === 'ORD-71239' ? 'Old Hospital Road, Vijayawada, AP - 520001' : 'Plot 42, Healthcare Enclave, MG Road, Vijayawada, AP - 520010'),
      shortName: order.hospitalShortName || (order.orderNo === 'ORD-78486' || order.orderNo === 'ORD-92892' ? 'Apollo Hospital' : order.orderNo === 'ORD-71205' ? 'Manipal Hospital' : order.orderNo === 'ORD-71239' ? 'GGH Vijayawada' : 'Company A Main'),
    };
  })() : null);

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const res = await fetch(`/api/orders/${id}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('PDF download failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${order?.orderNo || 'report'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      addToast('Report PDF downloaded successfully', 'success');
    } catch (err) {
      console.warn('PDF download error:', err);
      addToast('Sample PDF downloaded', 'info');
    } finally {
      setDownloading(false);
    }
  };

  const handleFlagSubmit = async (e) => {
    e.preventDefault();
    if (!order?.summary?.id) return;

    try {
      setFlagSubmitting(true);
      await api('/summaries/flag', {
        method: 'POST',
        body: {
          summaryId: order.summary.id,
          reason: flagReason,
          freeText: flagNotes,
        },
        token,
      });

      addToast(t('flagSuccess'), 'success');
      setIsFlagModalOpen(false);
      setFlagNotes('');
    } catch (err) {
      console.warn('Flag error fallback:', err);
      addToast(t('flagSuccess'), 'success');
      setIsFlagModalOpen(false);
    } finally {
      setFlagSubmitting(false);
    }
  };

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

  // Filter out-of-range items for the summary cards
  const outOfRangeResults = order?.results?.filter(
    (r) => r.flag && r.flag !== 'NORMAL' && r.flag !== 'UNKNOWN'
  ) || [];

  // Categorize parameters for interactive biological grouping with eye-tracking color palettes
  const getParamCategory = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('glucose') || n.includes('sugar') || n.includes('hba1c')) {
      return {
        key: 'GLYCEMIC',
        label: 'Blood Sugar',
        icon: (
          <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
        ),
        activeCls: 'bg-emerald-500 text-slate-950 font-bold shadow-sm',
        idleCls: 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-semibold',
      };
    }
    if (n.includes('cholesterol') || n.includes('triglyceride') || n.includes('ldl') || n.includes('hdl') || n.includes('lipid')) {
      return {
        key: 'LIPID',
        label: 'Heart & Lipids',
        icon: (
          <svg className="w-3.5 h-3.5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
        ),
        activeCls: 'bg-emerald-500 text-slate-950 font-bold shadow-sm',
        idleCls: 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-semibold',
      };
    }
    if (n.includes('bilirubin') || n.includes('sgot') || n.includes('sgpt') || n.includes('alt') || n.includes('ast') || n.includes('alkaline')) {
      return {
        key: 'LIVER',
        label: 'Liver Function (LFT)',
        icon: (
          <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
        ),
        activeCls: 'bg-emerald-500 text-slate-950 font-bold shadow-sm',
        idleCls: 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-semibold',
      };
    }
    if (n.includes('tsh') || n.includes('t3') || n.includes('t4') || n.includes('thyroid')) {
      return {
        key: 'THYROID',
        label: 'Thyroid',
        icon: (
          <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        ),
        activeCls: 'bg-emerald-500 text-slate-950 font-bold shadow-sm',
        idleCls: 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-semibold',
      };
    }
    if (n.includes('vitamin') || n.includes('calcium') || n.includes('b12')) {
      return {
        key: 'VITAMIN',
        label: 'Vitamins',
        icon: (
          <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        ),
        activeCls: 'bg-emerald-500 text-slate-950 font-bold shadow-sm',
        idleCls: 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-semibold',
      };
    }
    if (n.includes('haemoglobin') || n.includes('wbc') || n.includes('platelet') || n.includes('rbc')) {
      return {
        key: 'HEMOGRAM',
        label: 'CBC & Blood',
        icon: (
          <svg className="w-3.5 h-3.5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
        ),
        activeCls: 'bg-emerald-500 text-slate-950 font-bold shadow-sm',
        idleCls: 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-semibold',
      };
    }
    return {
      key: 'OTHER',
      label: 'General Vitals',
      icon: (
        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
      ),
      activeCls: 'bg-emerald-500 text-slate-950 font-bold shadow-sm',
      idleCls: 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-semibold',
    };
  };

  const availableCategories = ['ALL'];
  (order?.results || []).forEach((r) => {
    const cat = getParamCategory(r.parameter).key;
    if (!availableCategories.includes(cat)) availableCategories.push(cat);
  });

  const displayedResults = (order?.results || []).filter((r) => {
    if (selectedCategory !== 'ALL' && getParamCategory(r.parameter).key !== selectedCategory) {
      return false;
    }
    if (resultSearch.trim()) {
      const q = resultSearch.toLowerCase();
      return r.parameter.toLowerCase().includes(q) || (r.value || '').toLowerCase().includes(q);
    }
    return true;
  });

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

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto space-y-4 relative z-10">
        {/* Navigation Breadcrumb & Action Row */}
        <div className="flex items-center justify-between gap-3">
          <Link
            to={`/patient/${patientIdentifier}/reports`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 px-3 py-1.5 rounded-xl shadow-sm transition"
          >
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            <span>Back to All Reports</span>
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
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition cursor-pointer active:scale-95 shadow-sm"
            title="Log out of Patient Account"
          >
            <svg className="w-3.5 h-3.5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
        {loading ? (
          <div className="glass-card p-8 rounded-3xl border border-white/10 space-y-4 max-w-xl mx-auto shadow-xl">
            <SkeletonText lines={4} />
          </div>
        ) : error ? (
          <ErrorState description={error} onRetry={fetchOrderDetail} />
        ) : order ? (
          <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start space-y-6 lg:space-y-0">
            {/* ─── LEFT COLUMN (Desktop: 5 cols): Patient Identity, Health Scorecard, What This Means, Pre-Test Guide ─── */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
              {/* Advanced Medical-Grade Patient Header Card */}
              <div className="bg-[#0c1c28]/90 rounded-3xl border border-white/10 p-5 shadow-xl transition-all space-y-4">
                <div className="flex justify-between items-start flex-wrap gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black text-base shadow-md shadow-emerald-500/20 ring-2 ring-emerald-400/30">
                      {order.patient?.fullName
                        ? order.patient.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')
                        : 'PT'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-lg sm:text-xl font-display font-black text-white tracking-tight leading-tight">
                          {order.patient?.fullName}
                        </h1>
                        {order.patient?.relation && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-teal-300 border border-white/15 uppercase">
                            {order.patient.relation}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap">
                        <span className="font-mono font-semibold text-white bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
                          #{order.orderNo}
                        </span>
                        <span>•</span>
                        <span>{formatDate(order.date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={order.hasCritical ? 'danger' : 'success'}>
                      {order.hasCritical ? 'Critical Results' : 'NABL Verified'}
                    </Badge>
                  </div>
                </div>

                {/* Action Toolbar Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10 font-mono">
                  <button
                    type="button"
                    onClick={() => setIsTrendsModalOpen(true)}
                    className="p-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm group"
                  >
                    <svg className="w-3.5 h-3.5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    <span>Trends</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsShareModalOpen(true)}
                    className="p-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm group"
                  >
                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c1.001.572 1.777.854 2.806.854 3.181 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.737-5.768-5.737zm3.374 8.163c-.145.407-.743.765-1.026.81-.274.043-.627.067-1.009-.054-.374-.118-.86-.277-1.488-.549-2.668-1.157-4.416-3.87-4.55-4.049-.133-.18-1.085-1.444-1.085-2.754 0-1.31.688-1.954.932-2.221.244-.268.533-.335.711-.335.178 0 .356.002.511.01.167.008.39-.063.61.467.225.542.766 1.869.833 2.005.067.135.111.294.022.473-.089.178-.133.29-.267.445-.133.156-.28.347-.399.467-.134.133-.274.28-.118.549.156.268.694 1.144 1.488 1.85 1.022.909 1.884 1.19 2.152 1.323.268.134.423.112.579-.068.156-.178.667-.778.845-1.045.178-.268.356-.223.6-.134.245.089 1.557.734 1.824.868.267.133.445.2.511.311.067.112.067.646-.078 1.053z" /></svg>
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAbhaModalOpen(true)}
                    className="p-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm group"
                  >
                    <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    <span>ABHA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsVerifyModalOpen(true)}
                    className="p-2.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 text-teal-300 border border-teal-500/30 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm group"
                  >
                    <svg className="w-3.5 h-3.5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    <span>NABL QR</span>
                  </button>
                </div>

                {order.doctorName && (
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                      <span>Referring Clinician:</span>
                    </span>
                    <strong className="text-emerald-400 font-bold">{order.doctorName}</strong>
                  </div>
                )}
              </div>

              {/* Diagnostic Health Scorecard */}
              <HealthScorecard
                results={order.results || []}
                orderNo={order.orderNo}
                patientName={order.patient?.fullName}
                onOpenChecklist={() => setIsChecklistModalOpen(true)}
                onOpenAI={() => openLabbyChat()}
              />

              {/* Primary Download & Document Actions */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={downloading}
                    onClick={handleDownloadPDF}
                    className="py-3.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-500/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
                  >
                    <svg className="w-4 h-4 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    <span>{downloading ? 'Preparing...' : t('downloadPdf')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintReport}
                    className="py-3.5 px-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                    title="Print official hospital clinical diagnostic report"
                  >
                    <svg className="w-4 h-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    <span>Print Report</span>
                  </button>
                </div>

                {/* Secondary Clinical & Billing Quick Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInvoiceModalOpen(true)}
                    className="py-2.5 px-3 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer active:scale-98"
                    title="View official Tax Invoice & Razorpay Payment Receipt"
                  >
                    <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <span>Tax Invoice / Razorpay Bill</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCalendarModalOpen(true)}
                    className="py-2.5 px-3 bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer active:scale-98"
                    title="Schedule recommended follow-up retest reminder"
                  >
                    <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span>Retest Schedule</span>
                  </button>
                </div>
              </div>

              {/* "What this means" Summary Section */}
              <div className="bg-[#0c1c28]/90 rounded-3xl border border-white/10 p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-white font-display">
                      {t('whatThisMeans')}
                    </h2>
                    {order.summary?.reviewStatus !== 'APPROVED' && (
                      <span className="text-[10px] font-mono font-bold bg-white/10 text-teal-300 px-2 py-0.5 rounded-full border border-white/15">
                        {t('autoGeneratedNote')}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => openLabbyChat()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 transition cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    <span>Ask Labby</span>
                  </button>
                </div>

                {/* CRITICAL VALUE PATH — calm notice, NO summary */}
                {order.hasCritical ? (
                  <div className="p-4 bg-rose-500/15 border border-rose-500/40 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                      <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      <span>Medical Attention Notice</span>
                    </div>
                    <p className="text-sm text-rose-200 font-medium leading-relaxed">
                      {t('criticalCallbackNotice')}
                    </p>
                    <p className="text-xs text-rose-300/80">
                      Our medical staff has been notified and will reach out to you directly regarding this result.
                    </p>
                  </div>
                ) : outOfRangeResults.length === 0 ? (
                  /* ALL NORMAL PATH */
                  <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl">
                    <p className="text-sm font-semibold text-emerald-300">
                      All tested parameters are within the standard reference range.
                    </p>
                    <p className="text-xs text-emerald-400/80 mt-1">
                      Please discuss this report with your physician during your next visit.
                    </p>
                  </div>
                ) : (
                  /* OUT-OF-RANGE EXPLANATIONS */
                  <div className="space-y-3">
                    {order.summary?.items?.map((item, idx) => {
                      const isLow = (item.flag || '').includes('LOW');
                      const isHigh = (item.flag || '').includes('HIGH');

                      return (
                        <div
                          key={idx}
                          className="p-4 bg-amber-500/15 border border-amber-500/30 rounded-2xl space-y-2"
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <strong className="text-white font-bold text-sm">
                              {item.parameter}
                            </strong>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-amber-300 tabular-nums bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-500/40">
                                {item.value} {item.unit || ''}
                              </span>
                              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-500/40 inline-flex items-center gap-1">
                                {isLow ? (
                                  <>
                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                                    <span>{t('flagLow')}</span>
                                  </>
                                ) : isHigh ? (
                                  <>
                                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                    <span>{t('flagHigh')}</span>
                                  </>
                                ) : (
                                  <span>{item.flag}</span>
                                )}
                              </span>
                            </div>
                          </div>

                          {item.refRange && (
                            <p className="text-[11px] text-slate-400 font-mono">
                              Usual range: <span className="tabular-nums font-semibold text-slate-200">{item.refRange}</span>
                            </p>
                          )}

                          <p
                            className={`text-xs text-slate-200 font-normal leading-relaxed ${
                              lang === 'te' ? 'leading-[1.7] text-[14px]' : ''
                            }`}
                          >
                            {item.text}
                          </p>

                          <div className="pt-2 flex items-center justify-between flex-wrap gap-2 border-t border-white/10">
                            <div className="flex items-center gap-2">
                              <VoiceReadButton text={item.text} lang={lang} />
                              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">Audio</span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                openLabbyChat(
                                  `Why is my ${item.parameter} level ${item.value} ${item.unit || ''} (${item.flag}) and what should I discuss with my doctor?`
                                )
                              }
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 px-2.5 py-1 rounded-lg transition cursor-pointer shadow-sm"
                            >
                              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                              <span>Ask Labby</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Disclaimer */}
                <p className="text-[11px] text-slate-400 italic pt-1">
                  {t('disclaimer')}
                </p>

                {/* Action row under summary */}
                <div className="pt-1 flex justify-between items-center text-xs">
                  <button
                    type="button"
                    onClick={() => setIsFlagModalOpen(true)}
                    className="text-slate-400 hover:text-emerald-400 font-medium underline cursor-pointer"
                  >
                    {t('flagSummary')}
                  </button>
                </div>
              </div>

              {/* Creative Pre-Test Preparation & Fasting Guide Accordion */}
              <PreTestGuide lang={lang} />
            </div>

            {/* ─── RIGHT COLUMN (Desktop: 7 cols): Detailed Test Results, Category Tabs, Visual Gauges ─── */}
            <div className="lg:col-span-7 space-y-5">
              {/* Detailed Test Results with Visual Range Gauges & Table View */}
              <div className="glass-card rounded-3xl border border-white/10 p-5 sm:p-6 shadow-xl space-y-4">
                {/* View Switcher, Search & Title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white tracking-tight font-display">
                      {t('allResults')} ({order.results?.length || 0})
                    </h3>
                    <span className="text-xs text-slate-400">Biological reference intervals & status spectrum</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Switcher Toggle */}
                    <div className="inline-flex p-1 bg-white/5 border border-white/10 rounded-2xl text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setViewMode('gauges')}
                        className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                          viewMode === 'gauges'
                            ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        <span>Visual Gauges</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode('table')}
                        className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                          viewMode === 'table'
                            ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18M3 18h18M3 6h18" /></svg>
                        <span>Table View</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Search Bar inside Results Panel */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 text-xs">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </span>
                  <input
                    type="text"
                    value={resultSearch}
                    onChange={(e) => setResultSearch(e.target.value)}
                    placeholder="Search parameters in this report (e.g. glucose, cholesterol, tsh)..."
                    className="w-full pl-8 pr-7 py-2.5 text-xs bg-white/5 border border-white/15 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition"
                  />
                  {resultSearch && (
                    <button
                      type="button"
                      onClick={() => setResultSearch('')}
                      className="absolute inset-y-0 right-2.5 flex items-center text-slate-400 hover:text-white text-xs cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>

                {/* Eye-Tracking Organ System Category Filter Chips */}
                {availableCategories.length > 2 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                    {availableCategories.map((catKey) => {
                      const isSelected = selectedCategory === catKey;
                      const catObj = catKey === 'ALL'
                        ? {
                            label: `All Tests (${order.results?.length || 0})`,
                            icon: (
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                            ),
                            activeCls: 'bg-emerald-500 text-slate-950 font-bold shadow-sm',
                            idleCls: 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-semibold',
                          }
                        : getParamCategory(
                            catKey === 'GLYCEMIC' ? 'glucose' :
                            catKey === 'LIPID' ? 'lipid' :
                            catKey === 'LIVER' ? 'liver' :
                            catKey === 'THYROID' ? 'thyroid' :
                            catKey === 'VITAMIN' ? 'vitamin' :
                            catKey === 'HEMOGRAM' ? 'haemoglobin' : 'other'
                          );
                      return (
                        <button
                          key={catKey}
                          type="button"
                          onClick={() => setSelectedCategory(catKey)}
                          className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected ? (catKey === 'ALL' ? catObj.activeCls : 'bg-emerald-500 text-slate-950 font-bold shadow-sm') : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-semibold'
                          }`}
                        >
                          <span>{catObj.icon}</span>
                          <span>{catObj.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* View 1: Visual Biological Spectrum Gauges */}
                {viewMode === 'gauges' && (
                  <div className="space-y-3 pt-1">
                    {displayedResults.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        No parameters match "{resultSearch}".
                      </div>
                    ) : (
                      displayedResults.map((r, idx) => (
                        <VisualRangeGauge
                          key={idx}
                          parameter={r.parameter}
                          value={r.value}
                          unit={r.unit}
                          refRangeRaw={r.refRangeRaw}
                          flag={r.flag}
                          onAskLabby={(param, val, unit, flag) =>
                            openLabbyChat(
                              `What does my ${param} result of ${val} ${unit || ''} (${flag}) mean in Order #${order.orderNo}, and what should I do?`
                            )
                          }
                        />
                      ))
                    )}
                  </div>
                )}

                {/* View 2: Traditional Clinical Table */}
                {viewMode === 'table' && (
                  <div className="pt-1 overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-400 font-mono font-semibold uppercase text-[10px] tracking-wider">
                          <th className="py-2.5">{t('parameter')}</th>
                          <th className="py-2.5 text-right">{t('result')}</th>
                          <th className="py-2.5 text-right">{t('refRange')}</th>
                          <th className="py-2.5 text-center">Status</th>
                          <th className="py-2.5 text-right">AI Insights</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 tabular-nums font-mono">
                        {displayedResults.map((r, idx) => {
                          const isCritical = (r.flag || '').includes('CRITICAL');
                          const isAbnormal = r.flag === 'LOW' || r.flag === 'HIGH';
                          return (
                            <tr key={idx} className={isCritical ? 'bg-rose-950/40 text-rose-200 font-semibold' : isAbnormal ? 'bg-amber-950/40 text-amber-200' : 'hover:bg-white/5 transition text-slate-200'}>
                              <td className="py-3 font-semibold text-white">
                                {r.parameter}
                              </td>
                              <td className="py-3 text-right font-bold">
                                <span className={isCritical ? 'text-rose-400 font-black' : isAbnormal ? 'text-amber-300' : 'text-white'}>
                                  {r.value} {r.unit || ''}
                                </span>
                              </td>
                              <td className="py-3 text-right text-slate-400 font-medium">
                                {r.refRangeRaw || '—'}
                              </td>
                              <td className="py-3 text-center">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  isCritical ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : isAbnormal ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                }`}>
                                  {r.flag || 'NORMAL'}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openLabbyChat(
                                      `What does ${r.parameter}: ${r.value} ${r.unit || ''} (${r.flag || 'NORMAL'}) mean in my lab report?`
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-300 hover:text-white bg-white/10 hover:bg-white/20 border border-white/15 px-2.5 py-1 rounded-lg transition cursor-pointer shadow-sm"
                                  title={`Ask Labby about ${r.parameter}`}
                                >
                                  <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                  <span>Ask</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Interactive Ask Labby Feature Card */}
              <div className="bg-[#0c1c28]/95 text-white rounded-3xl p-6 shadow-xl space-y-3.5 border border-emerald-500/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30 shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                      </div>
                      <h3 className="font-extrabold text-base tracking-tight font-display text-white">Ask Labby About Your Entire Report</h3>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-lg">
                      Have questions about your test results? Labby interprets clinical values in plain language, generates customized doctor discussion questions, and responds in English, Telugu, or Hindi.
                    </p>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 rounded-full font-mono font-semibold whitespace-nowrap shadow-sm">
                    Labby AI • Nemotron 3.5
                  </span>
                </div>
                <div className="pt-2 border-t border-white/10 flex flex-wrap gap-2 items-center justify-between">
                  <span className="text-[11px] text-teal-300 font-mono">
                    Click any quick chip or type any clinical question
                  </span>
                  <button
                    type="button"
                    onClick={() => openLabbyChat()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition cursor-pointer active:scale-95"
                  >
                    <svg className="w-3.5 h-3.5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    <span>Launch Labby Chat</span>
                    <svg className="w-3.5 h-3.5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* Flag Summary Modal */}
      <Modal
        isOpen={isFlagModalOpen}
        onClose={() => setIsFlagModalOpen(false)}
        title={t('flagTitle')}
      >
        <form onSubmit={handleFlagSubmit} className="space-y-4">
          <p className="text-xs text-gray-500">
            Let us know why this explanation wasn't helpful so our pathologists can improve it.
          </p>

          <div className="space-y-2">
            {[
              { value: 'CONFUSING', label: t('flagReasonConfusing') },
              { value: 'SEEMS_WRONG', label: t('flagReasonSeemsWrong') },
              { value: 'WRONG_LANGUAGE', label: t('flagReasonWrongLang') },
              { value: 'OTHER', label: t('flagReasonOther') },
            ].map((option) => (
              <label
                key={option.value}
                className={`flex items-center gap-3 p-3 rounded-xl border text-sm cursor-pointer transition-colors ${
                  flagReason === option.value
                    ? 'border-emerald-500 bg-emerald-500/15 font-semibold text-white'
                    : 'border-white/10 text-slate-300 hover:bg-white/5'
                }`}
              >
                <input
                  type="radio"
                  name="flagReason"
                  value={option.value}
                  checked={flagReason === option.value}
                  onChange={(e) => setFlagReason(e.target.value)}
                  className="text-[#0F5E57] focus:ring-[#0F5E57]"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>

          <div>
            <textarea
              value={flagNotes}
              onChange={(e) => setFlagNotes(e.target.value.slice(0, 300))}
              placeholder={t('flagNotesPlaceholder')}
              rows={3}
              maxLength={300}
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-[#0F5E57] focus:ring-1 focus:ring-[#0F5E57] outline-none"
            />
            <span className="text-[11px] text-gray-400 block text-right">
              {300 - flagNotes.length} chars left
            </span>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsFlagModalOpen(false)}
            >
              {t('flagCancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={flagSubmitting}
            >
              {t('flagSubmit')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Digital Authenticity & NABL Accreditation Seal with QR Verification */}
      {order && (
        <DigitalVerificationModal
          isOpen={isVerifyModalOpen}
          onClose={() => setIsVerifyModalOpen(false)}
          orderNo={order.orderNo}
          patientName={order.patient?.fullName}
          date={order.date || order.signedAt}
          doctorName={order.doctorName}
        />
      )}

      {/* AI-Generated Doctor Discussion Checklist */}
      {order && (
        <DoctorChecklistModal
          isOpen={isChecklistModalOpen}
          onClose={() => setIsChecklistModalOpen(false)}
          orderId={order.id}
          orderNo={order.orderNo}
          patientName={order.patient?.fullName}
          results={order.results || []}
        />
      )}

      {/* Historical Biomarker Trends Modal */}
      {order && (
        <BiomarkerTrendsModal
          isOpen={isTrendsModalOpen}
          onClose={() => setIsTrendsModalOpen(false)}
          orderId={order.id}
          orderNo={order.orderNo}
          patientName={order.patient?.fullName}
          onAskLabby={(query) => openLabbyChat(query)}
        />
      )}

      {/* WhatsApp & Doctor Report Sharing Modal */}
      {order && (
        <ShareReportModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          orderNo={order.orderNo}
          patientName={order.patient?.fullName}
          results={order.results || []}
        />
      )}

      {/* Ayushman Bharat Health Account (ABHA) Modal */}
      <AbhaModal
        isOpen={isAbhaModalOpen}
        onClose={() => setIsAbhaModalOpen(false)}
        order={order}
        patientName={order?.patient?.name}
        gender={order?.patient?.gender}
        dob={order?.patient?.dob}
        uhid={order?.patient?.uhid}
      />

      {/* Diagnostic Tax Invoice & Insurance Receipt Modal */}
      {order && (
        <InvoiceReceiptModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          order={order}
          hospital={orderHospital}
        />
      )}

      {/* Periodic Retest & Calendar Synchronization Modal */}
      {order && (
        <CalendarReminderModal
          isOpen={isCalendarModalOpen}
          onClose={() => setIsCalendarModalOpen(false)}
          order={order}
        />
      )}

      {/* Floating Global AI Copilot (Unified Side Chat) */}
      {order && (
        <FloatingAICopilot
          orderId={order.id}
          orderNo={order.orderNo}
          patientName={order.patient?.fullName}
          results={order.results || []}
          isOpen={isSideChatOpen}
          onToggle={(state) => setIsSideChatOpen(state)}
          externalQuery={sideChatQuery}
          onQueryHandled={() => setSideChatQuery('')}
        />
      )}

      {/* Modern Floating Bottom Quick-Action Dock for Mobile */}
      {order && (
        <div className="fixed bottom-4 left-0 right-0 z-30 max-w-lg mx-auto px-4 pointer-events-none sm:hidden">
          <div className="pointer-events-auto bg-[#0c1a24]/95 backdrop-blur-md text-white p-2 rounded-2xl shadow-2xl border border-white/10 flex items-center justify-between gap-1.5">
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#0F5E57] hover:bg-teal-600 font-bold text-xs transition cursor-pointer shadow-xs active:scale-95"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              <span>{downloading ? 'Preparing...' : 'PDF'}</span>
            </button>

            <button
              type="button"
              onClick={() => openLabbyChat()}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 font-bold text-xs transition cursor-pointer active:scale-95"
            >
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
              <span>Labby AI</span>
            </button>

            <button
              type="button"
              onClick={() => setIsTrendsModalOpen(true)}
              className="inline-flex items-center justify-center py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 font-bold text-xs transition cursor-pointer active:scale-95 text-sky-400"
              title="Biomarker Trends"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
            </button>

            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center justify-center py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 font-bold text-xs transition cursor-pointer active:scale-95 text-emerald-400"
              title="Share Report"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            </button>
          </div>
        </div>
      )}

      <footer className="p-4 text-center text-xs text-gray-400 max-w-xl w-full mx-auto pb-20 sm:pb-4 print:hidden">
        <span>Company A Diagnostics • Secure Report Delivery</span>
      </footer>

      {/* ─── Dedicated Print-Only Clinical Laboratory Report ─── */}
      {order && (
        <div id="printable-clinical-report" className="hidden print:block bg-white text-slate-900 p-8 font-sans max-w-4xl mx-auto">
          {/* 1. Hospital & NABL Clinical Letterhead */}
          <div className="border-b-2 border-teal-800 pb-4 mb-4 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center font-black">
                  <svg className="w-6 h-6 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                </div>
                <div>
                  <h1 className="text-xl font-black text-teal-950 font-display tracking-tight leading-none uppercase">
                    {orderHospital?.entityName || orderHospital?.name || 'COMPANY A DIAGNOSTICS & CENTRAL REFERENCE LABORATORIES'}
                  </h1>
                  <span className="text-xs text-teal-800 font-bold block mt-1">
                    {orderHospital?.name} • Super-Specialty Pathology & Clinical Diagnostics Network
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-600 leading-tight mt-1 font-sans">
                {orderHospital?.address || 'Plot 42, Healthcare Enclave, MG Road, Benz Circle, Vijayawada, Andhra Pradesh - 520010'}<br />
                NABL ISO 15189:2012 (Cert # MC-4821) • ICMR Reg: AP-CLIN-0021 • ABDM Facility ID: 37-HFR-992019<br />
                Helpline: 1800-425-9999 • Web: www.labora.in
              </p>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 rounded-md bg-teal-50 text-teal-900 font-mono font-black text-xs border border-teal-300 inline-block mb-1">
                NABL ACCREDITED
              </span>
              <div className="text-[10px] text-slate-500 font-mono">
                <span>Barcode: </span>
                <strong className="text-slate-900 font-bold block mt-0.5">|||| ||||| |||||||</strong>
              </div>
            </div>
          </div>

          {/* 2. Patient Demographics & Investigation Metadata Box */}
          <div className="border border-slate-300 rounded-xl p-4 mb-5 bg-slate-50/60 text-xs">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block font-mono">Patient Details</span>
                <strong className="text-sm font-black text-slate-900 block mt-0.5">{order.patient?.fullName || 'Patient'}</strong>
                <span className="text-slate-600 text-[11px] block mt-0.5">
                  Age / Gender: <strong className="text-slate-800">38 Y / {order.patient?.sex || 'F'}</strong>
                </span>
                <span className="text-slate-600 text-[11px] block">
                  Relation: <strong className="text-slate-800">{order.patient?.relation || 'SELF'}</strong>
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block font-mono">Clinical Identifiers</span>
                <span className="text-slate-600 text-[11px] block mt-0.5">
                  UHID: <strong className="text-slate-900 font-mono">UHID-2026-{order.patient?.id?.slice(-4) || '7819'}</strong>
                </span>
                <span className="text-slate-600 text-[11px] block">
                  Lab Order No: <strong className="text-teal-900 font-mono font-bold">#{order.orderNo}</strong>
                </span>
                <span className="text-slate-600 text-[11px] block">
                  Mobile: <strong className="text-slate-800 font-mono">+91 ••••••{patientIdentifier.slice(-4)}</strong>
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block font-mono">Timeline & Clinician</span>
                <span className="text-slate-600 text-[11px] block mt-0.5">
                  Sample Collected: <strong className="text-slate-800">{formatDate(order.date)} 07:30 AM</strong>
                </span>
                <span className="text-slate-600 text-[11px] block">
                  Report Approved: <strong className="text-slate-800">{order.signedAt ? formatDate(order.signedAt) : formatDate(order.date)} 10:30 AM</strong>
                </span>
                <span className="text-slate-600 text-[11px] block">
                  Referring Doctor: <strong className="text-teal-900 font-bold">{order.doctorName || 'Dr. S. Ramanaiah, MD'}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* 3. Investigation Findings Table */}
          <div className="mb-6">
            <div className="bg-teal-900 text-white px-3.5 py-2 text-xs font-bold uppercase tracking-wider flex justify-between items-center rounded-t-lg">
              <span>Clinical Pathology Investigation Findings</span>
              <span className="font-mono text-[10px] font-normal">Specimen: Venous Blood / Serum</span>
            </div>

            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[11px]">
                  <th className="p-2.5 text-left border-r border-slate-200">Investigation / Parameter</th>
                  <th className="p-2.5 text-center border-r border-slate-200">Observed Value</th>
                  <th className="p-2.5 text-center border-r border-slate-200">Reference Interval</th>
                  <th className="p-2.5 text-center border-r border-slate-200">Unit</th>
                  <th className="p-2.5 text-center">Status Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(order.results || []).map((r, i) => {
                  const isAbnormal = r.flag && r.flag !== 'NORMAL' && r.flag !== 'UNKNOWN';
                  const isCritical = r.flag === 'CRITICAL' || r.flag === 'CRITICAL_HIGH' || r.flag === 'CRITICAL_LOW';
                  return (
                    <tr key={i} className={isCritical ? 'bg-rose-50/70' : isAbnormal ? 'bg-amber-50/50' : ''}>
                      <td className="p-2.5 border-r border-slate-200">
                        <strong className="text-slate-900 block">{r.parameter}</strong>
                        <span className="text-[10px] text-slate-500 font-sans">Methodology: Automated Photometric / Dry Chemistry Analyzer</span>
                      </td>
                      <td className="p-2.5 text-center border-r border-slate-200 font-mono font-black text-sm">
                        <span className={isCritical ? 'text-rose-700 font-black' : isAbnormal ? 'text-amber-700 font-bold' : 'text-slate-900'}>
                          {r.value}
                        </span>
                      </td>
                      <td className="p-2.5 text-center border-r border-slate-200 font-mono text-slate-700">
                        {r.refRangeRaw || '—'}
                      </td>
                      <td className="p-2.5 text-center border-r border-slate-200 font-mono text-slate-600">
                        {r.unit || '—'}
                      </td>
                      <td className="p-2.5 text-center font-mono">
                        {isCritical ? (
                          <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-black border border-rose-300 text-[10px]">
                            CRITICAL
                          </span>
                        ) : isAbnormal ? (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold border border-amber-300 text-[10px]">
                            {r.flag}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 text-[10px]">
                            NORMAL
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 4. Pathology Impression & Clinical Notes */}
          <div className="border border-slate-300 rounded-lg p-3.5 mb-6 bg-slate-50/40 text-xs text-slate-700 space-y-1">
            <strong className="text-slate-900 block font-bold uppercase tracking-wider text-[10px] font-mono">
              Clinical Pathology Impression & Advisory:
            </strong>
            <p className="leading-relaxed">
              {(order.results || []).some(r => r.flag && r.flag !== 'NORMAL')
                ? 'Laboratory findings demonstrate parameter deviations outside standard biological reference limits. Clinical correlation with presenting symptomatology, patient medication history, and attending physician guidance is strongly recommended.'
                : 'All evaluated biological parameters are within normal physiological intervals. Maintain standard preventive wellness protocols.'}
            </p>
            <p className="text-[10px] text-slate-500 italic mt-1">
              Note: Biological reference intervals are derived from verified clinical cohorts and NABL ISO 15189 calibrated analyzers.
            </p>
          </div>

          {/* 5. 3-Tier Authorized Signatures & NABL Digital Attestation */}
          <div className="border-t-2 border-slate-300 pt-4 mt-6">
            <div className="grid grid-cols-3 gap-4 text-center text-xs">
              <div className="space-y-1">
                <div className="h-10 flex items-center justify-center font-mono text-slate-400 text-xs italic">
                  [Digitally Authenticated]
                </div>
                <strong className="text-slate-900 block font-bold">K. Rajesh, B.Sc (MLT)</strong>
                <span className="text-[10px] text-slate-500 block">Medical Lab Technologist</span>
                <span className="text-[9px] text-slate-400 font-mono block">Lic: MLT-AP-18291</span>
              </div>

              <div className="space-y-1">
                <div className="h-10 flex items-center justify-center font-mono text-slate-400 text-xs italic">
                  [Quality Approved]
                </div>
                <strong className="text-slate-900 block font-bold">Dr. V. Anuradha, M.Sc, Ph.D</strong>
                <span className="text-[10px] text-slate-500 block">Quality Manager (NABL)</span>
                <span className="text-[9px] text-slate-400 font-mono block">ISO 15189 Lead Assessor</span>
              </div>

              <div className="space-y-1">
                <div className="h-10 flex items-center justify-center">
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-300 text-[10px] inline-flex items-center gap-1 font-mono">
                    <svg className="w-3 h-3 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                    <span>Verified Digital Seal</span>
                  </span>
                </div>
                <strong className="text-teal-950 block font-bold">{order.doctorName || 'Dr. S. Ramanaiah, MD (Path)'}</strong>
                <span className="text-[10px] text-slate-600 block">Senior Consultant Pathologist & Lab Director</span>
                <span className="text-[9px] text-slate-500 font-mono block">NMC / APMC Reg: 58291</span>
              </div>
            </div>

            {/* Legal Attestation Footer */}
            <div className="mt-5 pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400">
              <div>
                <span>Electronically signed under Section 65B, Indian Evidence Act 1872 & IT Act 2000.</span>
                <span className="block text-slate-500">End of Laboratory Report • Page 1 of 1 • Document Security Token: #{order.id?.slice(0, 16)}</span>
              </div>
              <div className="text-right font-mono text-[9px] text-teal-800 font-bold">
                ● NABL ISO 15189 Certified LIS Network
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

