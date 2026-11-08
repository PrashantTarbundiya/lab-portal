import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import LangSwitch from './LangSwitch';

export const HOSPITALS = [
  {
    slug: 'company-a-main-hospital',
    id: 'HOSP-01',
    name: 'Company A Main Super-Specialty',
    shortName: 'Company A Main',
    badge: 'Tertiary Care',
    defaultDoctor: 'dr-ramanaiah',
  },
  {
    slug: 'apollo-hospital-vijayawada',
    id: 'HOSP-02',
    name: 'Apollo Specialty Hospital',
    shortName: 'Apollo Hospital',
    badge: 'Cardio & Ortho',
    defaultDoctor: 'dr-harish-reddy',
  },
  {
    slug: 'manipal-hospital',
    id: 'HOSP-03',
    name: 'Manipal Super-Specialty Hospital',
    shortName: 'Manipal Hospital',
    badge: 'Pulmo & Onco',
    defaultDoctor: 'dr-raviteja',
  },
  {
    slug: 'ggh-vijayawada',
    id: 'HOSP-04',
    name: 'Government General Hospital (GGH)',
    shortName: 'GGH Vijayawada',
    badge: 'Teaching Hospital',
    defaultDoctor: 'dr-suresh-kumar',
  },
  {
    slug: 'company-a-central-lab',
    id: 'LAB-01',
    name: 'Company A Central Reference Lab',
    shortName: 'Reference Lab',
    badge: 'NABL ISO 15189',
    defaultDoctor: 'dr-ramanaiah',
  },
];

export default function TopMainNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const dropdownRef = useRef(null);
  const servicesRef = useRef(null);

  const { token, user, logout } = useAuth();
  const { addToast } = useToast();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);

  // Extract active hospital slug from URL if present, or fallback to saved / default
  const pathParts = currentPath.split('/').filter(Boolean);
  const matchedHospFromUrl = HOSPITALS.find((h) => pathParts[0] === h.slug);

  const [activeHospitalSlug, setActiveHospitalSlug] = useState(() => {
    if (matchedHospFromUrl) return matchedHospFromUrl.slug;
    return localStorage.getItem('labora_active_hospital_slug') || 'company-a-main-hospital';
  });

  // Sync active hospital when URL changes
  useEffect(() => {
    if (matchedHospFromUrl && matchedHospFromUrl.slug !== activeHospitalSlug) {
      setActiveHospitalSlug(matchedHospFromUrl.slug);
      localStorage.setItem('labora_active_hospital_slug', matchedHospFromUrl.slug);
    }
  }, [matchedHospFromUrl, activeHospitalSlug]);

  const activeHospital =
    HOSPITALS.find((h) => h.slug === activeHospitalSlug) || HOSPITALS[0];

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsRoleDropdownOpen(false);
      }
      if (servicesRef.current && !servicesRef.current.contains(event.target)) {
        setIsServicesOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleHospitalChange = (newSlug) => {
    setActiveHospitalSlug(newSlug);
    localStorage.setItem('labora_active_hospital_slug', newSlug);

    const targetHosp = HOSPITALS.find((h) => h.slug === newSlug) || HOSPITALS[0];

    // Broadcast hospital change event to patient profile picker, report list, etc.
    try {
      window.dispatchEvent(
        new CustomEvent('hospital-changed', {
          detail: { hospitalSlug: newSlug, hospital: targetHosp },
        })
      );
      window.dispatchEvent(new Event('storage'));
    } catch {
      // safe
    }

    // Intelligently route to that hospital's corresponding page
    if (currentPath.includes('/front-desk') || currentPath === '/staff') {
      navigate(`/${newSlug}/front-desk`);
    } else if (currentPath.includes('/lab-tasks') || currentPath.includes('/lab/tasks')) {
      navigate(`/${newSlug}/lab-tasks`);
    } else if (currentPath.includes('/doctor')) {
      navigate(`/${newSlug}/doctor/${targetHosp.defaultDoctor}`);
    } else if (currentPath.includes('/admin') && !currentPath.includes('superadmin')) {
      navigate(`/${newSlug}/admin`);
    } else {
      addToast(`Active facility changed: ${targetHosp.name}`, 'info');
    }
  };

  const quickRoles = [
    {
      id: 'FRONT_DESK',
      label: 'Front-Desk Reception',
      type: 'desk',
      sub: `${activeHospital.shortName} Reception`,
      token: 'demo-staff:frontdesk@demo.local',
      route: `/${activeHospitalSlug}/front-desk`,
      badge: 'Reception Desk',
    },
    {
      id: 'LAB_TECH',
      label: 'Pathology & Lab Tasks',
      type: 'lab',
      sub: `${activeHospital.shortName} Testing Pipeline`,
      token: 'demo-staff:pathologist@demo.local',
      route: `/${activeHospitalSlug}/lab-tasks`,
      badge: 'LIS Specimen',
    },
    {
      id: 'DOCTOR',
      label: `Doctor Console (${activeHospital.defaultDoctor.replace(/^dr-/, 'Dr. ')})`,
      type: 'doctor',
      sub: `${activeHospital.name}`,
      token: 'demo-doctor',
      route: `/${activeHospitalSlug}/doctor/${activeHospital.defaultDoctor}`,
      badge: 'Attending MD',
    },
    {
      id: 'HOSPITAL_ADMIN',
      label: 'Hospital Superintendent',
      type: 'hospital',
      sub: `Medical Board Admin`,
      token: 'demo-staff',
      route: `/${activeHospitalSlug}/admin`,
      badge: 'Superintendent',
    },
    {
      id: 'SUPER_ADMIN',
      label: 'Super Admin (CMO Network)',
      type: 'admin',
      sub: 'All 6 Labs & 38 Centers',
      token: 'demo-admin',
      route: '/admin',
      badge: 'CMO Hub',
    },
    {
      id: 'PATIENT',
      label: 'Patient Family Portal',
      type: 'patient',
      sub: 'Lakshmi Prasanna (+919000000001)',
      token: 'demo-patient:+919000000001',
      route: '/patient/9000000001/profiles',
      badge: 'Vault (5)',
    },
  ];

  const handleQuickLogin = (roleObj) => {
    try {
      localStorage.setItem('portal_token', roleObj.token);
      setIsRoleDropdownOpen(false);
      addToast(`Switched role to ${roleObj.label}`, 'success');
      navigate(roleObj.route);
    } catch {
      navigate(roleObj.route);
    }
  };

  const isFrontDeskActive =
    currentPath.includes('/front-desk') || currentPath === '/staff' || currentPath.startsWith('/staff/orders');
  const isLabTasksActive =
    currentPath.includes('/lab-tasks') || currentPath.includes('/lab/tasks');
  const isDoctorActive = currentPath.includes('/doctor');
  const isHospitalAdminActive = currentPath.includes('/admin') && !currentPath.includes('/superadmin') && currentPath !== '/admin';
  const isPatientActive =
    currentPath === '/' || currentPath.startsWith('/patient') || currentPath.startsWith('/profiles') || currentPath.startsWith('/reports');

  return (
    <header className="bg-[#07151f]/95 backdrop-blur-2xl text-white text-xs sticky top-0 z-50 border-b border-white/10 shadow-xl shadow-black/30">
      <div className="w-full max-w-[1680px] mx-auto px-2 sm:px-4 lg:px-6 h-13 flex items-center justify-between gap-2">
        
        {/* Brand & Hospital Facility Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            to={`/${activeHospitalSlug}/front-desk`}
            className="flex items-center gap-2 hover:opacity-95 transition pr-2.5 border-r border-white/10 group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm group-hover:scale-105 transition-transform">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <span className="font-bold text-white text-[13px] tracking-tight block leading-tight group-hover:text-emerald-300 transition-colors">
                LABORA
              </span>
              <span className="text-[9px] text-emerald-400 font-mono font-medium block">
                NABL ISO 15189
              </span>
            </div>
          </Link>

          {/* Hospital Switcher Dropdown */}
          <div className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/10 transition-colors">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <select
              value={activeHospitalSlug}
              onChange={(e) => handleHospitalChange(e.target.value)}
              className="bg-transparent text-slate-100 font-medium text-[11px] focus:outline-none cursor-pointer max-w-[130px] sm:max-w-[190px] truncate"
              title="Change Hospital Facility"
            >
              {HOSPITALS.map((hosp) => (
                <option key={hosp.slug} value={hosp.slug} className="bg-[#07151f] text-slate-100 font-sans">
                  {hosp.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Core Tasks Navigation Pills */}
        <nav className="flex items-center gap-1 shrink-0 flex-wrap">
          {/* 1. FRONT DESK */}
          <Link
            to={`/${activeHospitalSlug}/front-desk`}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              isFrontDeskActive
                ? 'bg-emerald-500/20 text-emerald-300 shadow-sm border border-emerald-500/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
            title={`Front Desk Reception for ${activeHospital.name}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="hidden sm:inline">Front Desk</span>
            <span className="sm:hidden">Desk</span>
            {isFrontDeskActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse hidden lg:inline-block"></span>
            )}
          </Link>

          {/* 2. LAB TASKS */}
          <Link
            to={`/${activeHospitalSlug}/lab-tasks`}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              isLabTasksActive
                ? 'bg-emerald-500/20 text-emerald-300 shadow-sm border border-emerald-500/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
            title={`Specimen Testing & Laboratory Pipeline for ${activeHospital.name}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <span className="hidden sm:inline">Lab Tasks</span>
            <span className="sm:hidden">Lab</span>
            {isLabTasksActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse hidden lg:inline-block"></span>
            )}
          </Link>

          {/* 3. DOCTOR CONSOLE */}
          <Link
            to={`/${activeHospitalSlug}/doctor/${activeHospital.defaultDoctor}`}
            className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              isDoctorActive
                ? 'bg-teal-500/20 text-teal-300 shadow-sm border border-teal-500/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
            title={`Doctor Consultation Console for ${activeHospital.name}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>Doctor</span>
            {isDoctorActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
            )}
          </Link>

          {/* 4. HOSPITAL ADMIN / SUPERINTENDENT */}
          <Link
            to={`/${activeHospitalSlug}/admin`}
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              isHospitalAdminActive
                ? 'bg-purple-500/20 text-purple-300 shadow-sm border border-purple-500/30'
                : 'text-purple-300 hover:text-white hover:bg-purple-500/10 border border-purple-500/20'
            }`}
            title={`Hospital Superintendent & Department Admin for ${activeHospital.name}`}
          >
            <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="hidden xl:inline">Hosp Admin</span>
            <span className="xl:hidden">Hosp</span>
            {isHospitalAdminActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
            )}
          </Link>

          {/* 5. PATIENT PORTAL */}
          <Link
            to="/profiles"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              isPatientActive
                ? 'bg-teal-500/20 text-teal-300 shadow-sm border border-teal-500/30'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Patient</span>
          </Link>

          {/* 5. SUPER ADMIN */}
          <Link
            to="/admin"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              currentPath === '/admin' || currentPath.includes('/superadmin')
                ? 'bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/30'
                : 'text-amber-300 hover:text-white hover:bg-amber-500/10 border border-amber-500/20'
            }`}
            title="CMO Super Admin Oversight across 6 Facilities"
          >
            <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="hidden xl:inline">Super Admin</span>
            <span className="xl:hidden">Admin</span>
          </Link>

          {/* 6. LOG TRACKER */}
          <Link
            to="/access-logs"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              currentPath === '/access-logs' || currentPath.includes('/staff/access-logs')
                ? 'bg-teal-500/20 text-teal-300 shadow-sm border border-teal-500/30'
                : 'text-teal-300 hover:text-white hover:bg-teal-500/10 border border-teal-500/20'
            }`}
            title="DPDP / HIPAA Immutable Access Log Tracker"
          >
            <svg className="w-3.5 h-3.5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <span className="hidden xl:inline">Log Tracker</span>
            <span className="xl:hidden">Logs</span>
          </Link>

          {/* 7. ALL SERVICES QUICK DROPDOWN */}
          <div className="relative inline-block" ref={servicesRef}>
            <button
              type="button"
              onClick={() => setIsServicesOpen(!isServicesOpen)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer active:scale-95"
              title="All Core Services Quick Launch"
            >
              <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span className="hidden sm:inline">Services</span>
              <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isServicesOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-[#0a1824]/95 backdrop-blur-2xl border border-white/15 rounded-xl shadow-2xl p-2.5 space-y-1 z-50 animate-scaleUp text-slate-100">
                <div className="px-2 py-1 text-[10px] font-mono font-medium text-emerald-400 border-b border-white/10 flex items-center justify-between">
                  <span>Core Services</span>
                  <span className="text-slate-400">Vijayawada Hub</span>
                </div>

                <Link
                  to="/access-logs"
                  onClick={() => setIsServicesOpen(false)}
                  className="w-full text-left p-2 rounded-lg hover:bg-white/10 flex items-center gap-2.5 text-xs text-white transition group"
                >
                  <div className="p-1.5 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/20">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <div>
                    <strong className="block font-medium group-hover:text-emerald-300">Log Tracker</strong>
                    <span className="text-[10px] text-slate-400 block">Immutable DPDP Audit Trail</span>
                  </div>
                </Link>

                <Link
                  to="/operations-report"
                  onClick={() => setIsServicesOpen(false)}
                  className="w-full text-left p-2 rounded-lg hover:bg-white/10 flex items-center gap-2.5 text-xs text-white transition group"
                >
                  <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <strong className="block font-medium group-hover:text-emerald-300">Operations Report</strong>
                    <span className="text-[10px] text-slate-400 block">SLA & Turnaround Metrics</span>
                  </div>
                </Link>

                <Link
                  to="/import"
                  onClick={() => setIsServicesOpen(false)}
                  className="w-full text-left p-2 rounded-lg hover:bg-white/10 flex items-center gap-2.5 text-xs text-white transition group"
                >
                  <div className="p-1.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  <div>
                    <strong className="block font-medium group-hover:text-cyan-300">Specimen Data Ingestion</strong>
                    <span className="text-[10px] text-slate-400 block">CSV & HL7 Ingestion</span>
                  </div>
                </Link>

                <Link
                  to="/book-appointment"
                  onClick={() => setIsServicesOpen(false)}
                  className="w-full text-left p-2 rounded-lg hover:bg-white/10 flex items-center gap-2.5 text-xs text-white transition group"
                >
                  <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                  </div>
                  <div>
                    <strong className="block font-medium group-hover:text-amber-300">Book OPD & Lab Test</strong>
                    <span className="text-[10px] text-slate-400 block">Instant Token & Map Locator</span>
                  </div>
                </Link>

                <Link
                  to={`/${activeHospitalSlug}/admin`}
                  onClick={() => setIsServicesOpen(false)}
                  className="w-full text-left p-2 rounded-lg hover:bg-white/10 flex items-center gap-2.5 text-xs text-white transition group"
                >
                  <div className="p-1.5 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/20">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <strong className="block font-medium group-hover:text-teal-300">Hospital Admin</strong>
                    <span className="text-[10px] text-slate-400 block">Superintendent Console</span>
                  </div>
                </Link>

                <Link
                  to="/admin"
                  onClick={() => setIsServicesOpen(false)}
                  className="w-full text-left p-2 rounded-lg hover:bg-white/10 flex items-center gap-2.5 text-xs text-white transition group border-t border-white/10 pt-2"
                >
                  <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <strong className="block font-medium group-hover:text-amber-300">Super Admin Console</strong>
                    <span className="text-[10px] text-slate-400 block">CMO Network Management</span>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Right Tools: Language + AI Copilot + Role Switcher + Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0" ref={dropdownRef}>
          <LangSwitch className="inline-flex" />

          {/* Instant Clinical AI Companion Button */}
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('open-ai-copilot'));
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/15 to-indigo-500/15 hover:from-purple-500/25 hover:to-indigo-500/25 text-purple-300 border border-purple-500/30 text-xs font-semibold transition cursor-pointer active:scale-95 shadow-sm"
            title="Ask Labby (Clinical AI Diagnostic Copilot)"
          >
            <span className="text-purple-300">✨</span>
            <span className="hidden sm:inline">Ask Labby AI</span>
            <span className="sm:hidden">AI</span>
          </button>

          <button
            type="button"
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition cursor-pointer active:scale-95 shadow-sm"
            title="Instant 1-Click Role Switcher"
          >
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <span className="hidden sm:inline">Role Switcher</span>
            <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {(token || (typeof window !== 'undefined' && localStorage.getItem('portal_token'))) && (
            <button
              type="button"
              onClick={async () => {
                try {
                  localStorage.removeItem('portal_token');
                  await logout();
                } catch {
                  localStorage.removeItem('portal_token');
                }
                addToast('Signed out successfully', 'info');
                navigate('/');
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 transition cursor-pointer active:scale-95 shadow-sm"
              title="Log out of Portal"
            >
              <svg className="w-3.5 h-3.5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}

          {/* Floating Dropdown Menu (Glassmorphism Elevated) */}
          {isRoleDropdownOpen && (
            <div className="absolute right-3 top-full mt-2 w-72 sm:w-80 bg-[#0a1824]/95 backdrop-blur-2xl border border-white/15 rounded-xl shadow-2xl p-2.5 space-y-1.5 z-50 animate-scaleUp text-slate-100">
              <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[11px]">
                <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  <span>Portal Switcher</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{activeHospital.shortName}</span>
              </div>

              <div className="space-y-1 max-h-80 overflow-y-auto pr-0.5 scrollbar-thin">
                {quickRoles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleQuickLogin(role)}
                    className="w-full text-left p-2 rounded-lg hover:bg-white/10 transition-all flex items-center justify-between group cursor-pointer border border-transparent hover:border-white/10"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-white/5 group-hover:bg-emerald-500/15 flex items-center justify-center text-slate-300 group-hover:text-emerald-400 border border-white/10 transition-colors">
                        {role.type === 'desk' && (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        )}
                        {role.type === 'lab' && (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                        )}
                        {role.type === 'doctor' && (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        )}
                        {role.type === 'hospital' && (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        )}
                        {role.type === 'admin' && (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        )}
                        {role.type === 'patient' && (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        )}
                      </div>
                      <div>
                        <strong className="text-xs font-semibold text-white block leading-tight group-hover:text-emerald-300 transition-colors">
                          {role.label}
                        </strong>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {role.sub}
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-emerald-300 border border-emerald-500/20 font-mono">
                      {role.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
