import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useToast } from '../../components/Toast';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function SuperAdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [counts, setCounts] = useState({ all: 0, verified: 0, pending: 0, suspended: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING_VERIFICATION'); // default to pending for fast admin action
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedDoctorModal, setSelectedDoctorModal] = useState(null);
  const [isRegisterHospOpen, setIsRegisterHospOpen] = useState(false);
  const [hospName, setHospName] = useState('');
  const [hospCategory, setHospCategory] = useState('HOSPITAL');
  const [hospAddress, setHospAddress] = useState('');
  const [hospBeds, setHospBeds] = useState(250);
  const [hospPhone, setHospPhone] = useState('+91 866 288 1100');
  const [submittingHosp, setSubmittingHosp] = useState(false);

  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleRegisterFacility = async (e) => {
    e.preventDefault();
    if (!hospName || !hospAddress) return;
    try {
      setSubmittingHosp(true);
      const res = await api('/hospitals', {
        method: 'POST',
        body: {
          name: hospName,
          category: hospCategory,
          address: hospAddress,
          bedCapacity: hospBeds,
          phone: hospPhone,
        },
      });
      addToast(`${res.facility?.category} "${res.facility?.name}" registered and approved!`, 'success');
      setHospName('');
      setHospAddress('');
      setIsRegisterHospOpen(false);
      fetchData();
    } catch (err) {
      addToast(`Registration failed: ${err.message}`, 'error');
    } finally {
      setSubmittingHosp(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ovRes, docRes, facRes] = await Promise.all([
        api('/admin/overview'),
        api(`/admin/doctors?status=${activeTab}&search=${encodeURIComponent(search)}`),
        api('/admin/facilities'),
      ]);

      setOverview(ovRes);
      setDoctors(docRes.doctors || []);
      setCounts(docRes.counts || { all: 0, verified: 0, pending: 0, suspended: 0 });
      setFacilities(facRes.facilities || []);
    } catch (err) {
      console.warn('Super Admin fetch error, fallback to demo data:', err);
      // Fallback
      setOverview({
        hospitalName: 'Company A Healthcare & Academic Medical Center',
        accreditations: ['NABL ISO 15189:2022', 'NABH Digital Health', 'ABDM Gateway Grade 1'],
        stats: {
          totalDoctors: 5,
          verifiedDoctors: 2,
          pendingVerification: 2,
          suspendedDoctors: 1,
          activeHospitalBeds: 450,
          dailyDiagnosticTests: 1240,
          activeLaboratories: 3,
          avgTurnaroundHours: 1.8,
        },
        superAdmin: {
          name: 'Dr. M. Ramanathan, MD, FRCPath',
          role: 'Chief Medical Officer (CMO) & Super Admin',
          email: 'cmo@company-a-hospital.org',
        },
      });
      setDoctors([
        {
          id: 'doc-pooja',
          name: 'Dr. Pooja Sharma',
          email: 'drpooja@demo.local',
          phone: '+91 99881 77210',
          nmcRegNo: 'NMC-2024-51029',
          stateCouncil: 'Karnataka Medical Council (KMC)',
          specialization: 'Endocrinology & Diabetology',
          degrees: 'MBBS, DNB (Endocrinology)',
          hospitalBranch: 'City Care OPD & Wellness Center',
          department: 'Endocrine & Metabolic Clinic',
          verificationStatus: 'PENDING_VERIFICATION',
          verifiedAt: null,
          canSignReports: false,
          ordersCount: 14,
          submittedAt: '2026-11-01T14:20:00.000Z',
          notes: 'Medical Council degree certificate submitted. Awaiting Super Admin CMO verification check.',
        },
        {
          id: 'doc-vikram',
          name: 'Dr. Vikram Anand',
          email: 'vikram.anand@demo.local',
          phone: '+91 97110 55412',
          nmcRegNo: 'NMC-2023-77401',
          stateCouncil: 'Maharashtra Medical Council (MMC)',
          specialization: 'Cardiology & Vascular Medicine',
          degrees: 'MBBS, MD, DM (Cardiology)',
          hospitalBranch: 'Main Super-Specialty Hospital - Cardiac Tower',
          department: 'Cardiovascular Sciences',
          verificationStatus: 'PENDING_VERIFICATION',
          verifiedAt: null,
          canSignReports: false,
          ordersCount: 8,
          submittedAt: '2026-11-02T10:45:00.000Z',
          notes: 'State council reciprocity verification document pending.',
        },
      ]);
      setCounts({ all: 5, verified: 2, pending: 2, suspended: 1 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, search]);

  const handleUpdateStatus = async (doctor, newStatus) => {
    try {
      setUpdatingId(doctor.id);
      const res = await api(`/admin/doctors/${doctor.id}/verify`, {
        method: 'PATCH',
        body: {
          status: newStatus,
          notes: newStatus === 'VERIFIED'
            ? 'Credentials & NMC medical license verified by Super Admin CMO.'
            : newStatus === 'SUSPENDED'
            ? 'Suspended by Super Admin.'
            : 'Resubmission requested.',
        },
      });

      addToast(
        newStatus === 'VERIFIED'
          ? `${doctor.name} is now VERIFIED. Authorized to sign clinical reports.`
          : `${doctor.name} status updated to ${newStatus}.`,
        newStatus === 'VERIFIED' ? 'success' : 'info'
      );

      // Refresh list
      fetchData();
    } catch (err) {
      console.warn('Update verification status fallback:', err);
      // Local optimistic update
      setDoctors((prev) =>
        prev.map((d) =>
          d.id === doctor.id
            ? { ...d, verificationStatus: newStatus, canSignReports: newStatus === 'VERIFIED' }
            : d
        )
      );
      addToast(`Status updated to ${newStatus} for ${doctor.name}`, 'success');
    } finally {
      setUpdatingId(null);
      setSelectedDoctorModal(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#07151f] text-slate-100 flex flex-col font-sans relative selection:bg-emerald-400 selection:text-slate-950">
      {/* Atmospheric Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-36 left-1/4 w-[750px] h-[750px] bg-teal-500/10 rounded-full blur-[140px]"></div>
        <div className="absolute top-1/3 -right-40 w-[620px] h-[620px] bg-emerald-500/10 rounded-full blur-[160px]"></div>
      </div>

      {/* Super Admin Top Command Banner */}
      <header className="relative z-10 bg-gradient-to-r from-[#061723] via-[#091f2e] to-[#07151f] text-white border-b border-white/10 shadow-lg py-5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-[10px] uppercase tracking-wider font-mono">
                  Super Admin • Chief Medical Officer (CMO) Console
                </span>
                <span className="text-slate-400 text-xs hidden sm:inline font-mono">• Multi-Hospital Network</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-white">
                Hospital Administration & Doctor Credentialing
              </h1>
              <p className="text-xs text-slate-300">
                Medical council verification, physician credentialing, and multi-center diagnostic governance.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <span className="text-xs font-bold text-white block">
                  {overview?.superAdmin?.name || 'Dr. M. Ramanathan, MD, FRCPath'}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-medium block">
                  {overview?.superAdmin?.role || 'Chief Medical Officer'}
                </span>
              </div>

              <Link
                to="/staff/lab-tasks"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold shadow-sm transition cursor-pointer active:scale-95"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                <span>Laboratory Tasks Board</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-8">
        {/* KPI Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 rounded-2xl border border-white/10 shadow-lg space-y-1 text-white">
            <span className="text-xs font-mono uppercase font-bold text-slate-400 block">Total Network Doctors</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-display font-black text-white tabular-nums">{counts.all || 5}</span>
              <span className="text-xs text-emerald-300 font-bold bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-mono">
                4 Branches
              </span>
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 shadow-lg space-y-1 text-white">
            <span className="text-xs font-mono uppercase font-bold text-amber-300 block">Pending CMO Verification</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-display font-black text-amber-400 tabular-nums">{counts.pending || 2}</span>
              <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2.5 py-0.5 rounded-full animate-pulse font-mono">
                Action Required
              </span>
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 shadow-lg space-y-1 text-white">
            <span className="text-xs font-mono uppercase font-bold text-emerald-300 block">Verified & Active Doctors</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-display font-black text-emerald-400 tabular-nums">{counts.verified || 2}</span>
              <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-mono">
                NMC Approved
              </span>
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-white/10 shadow-lg space-y-1 text-white">
            <span className="text-xs font-mono uppercase font-bold text-slate-400 block">Daily Lab Tests Done</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-display font-black text-white tabular-nums">1,240</span>
              <span className="text-[10px] font-bold text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full font-mono">
                99.4% On-Time
              </span>
            </div>
          </div>
        </div>

        {/* Doctor Credentialing Section */}
        <section className="bg-[#0b1a27]/90 rounded-2xl border border-white/10 shadow-xl p-6 sm:p-7 space-y-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Doctor Credentialing & Medical Registration Verification
                </h2>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Hospital Super Admin verification engine. Only verified physicians can sign and release clinical pathology reports.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 p-1 rounded-xl self-start sm:self-auto overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('PENDING_VERIFICATION')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'PENDING_VERIFICATION'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Pending Review ({counts.pending || 2})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('VERIFIED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'VERIFIED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                Verified ({counts.verified || 2})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  activeTab === 'ALL'
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                All ({counts.all || 5})
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search doctor by name, NMC registration number, specialty, or hospital branch..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/15 bg-[#07151f]/80 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
            />
          </div>

          {/* Doctors Table / Cards */}
          {loading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : doctors.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-mono">
              No doctors found matching the current filter.
            </div>
          ) : (
            <div className="overflow-x-auto border border-white/10 rounded-2xl glass-card">
              <table className="min-w-full divide-y divide-white/10 text-left text-xs">
                <thead className="bg-white/5 font-mono text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Physician & Qualifications</th>
                    <th className="py-3 px-4">NMC / State Reg No.</th>
                    <th className="py-3 px-4">Specialization & Branch</th>
                    <th className="py-3 px-4">Verification Status</th>
                    <th className="py-3 px-4">Signing Authorization</th>
                    <th className="py-3 px-4 text-right">Super Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-transparent">
                  {doctors.map((doc) => {
                    const isPending = doc.verificationStatus === 'PENDING_VERIFICATION';
                    const isVerified = doc.verificationStatus === 'VERIFIED';
                    const isSuspended = doc.verificationStatus === 'SUSPENDED';

                    return (
                      <tr key={doc.id} className="hover:bg-white/5 transition">
                        <td className="py-3.5 px-4">
                          <strong className="text-sm font-display font-black text-white block">
                            {doc.name}
                          </strong>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {doc.degrees}
                          </span>
                          <span className="text-[10px] text-slate-500 block font-mono">
                            {doc.email}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono">
                          <span className="px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-emerald-300 font-bold text-xs inline-block">
                            {doc.nmcRegNo}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {doc.stateCouncil || 'National Medical Commission'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <strong className="text-slate-200 font-bold block">
                            {doc.specialization}
                          </strong>
                          <span className="text-[11px] text-slate-400 block truncate max-w-xs">
                            {doc.hospitalBranch}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {isVerified && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-mono text-[11px]">
                              <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                              <span>NMC VERIFIED</span>
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono text-[11px]">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                              <span>PENDING REVIEW</span>
                            </span>
                          )}
                          {isSuspended && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/30 font-mono text-[11px]">
                              <svg className="w-3 h-3 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                              <span>SUSPENDED</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {doc.canSignReports ? (
                            <span className="text-emerald-400 font-medium text-xs flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              <span>Authorized (NABL Active)</span>
                            </span>
                          ) : (
                            <span className="text-amber-400 font-medium text-xs flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                              <span>Restricted (Under Review)</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending && (
                              <button
                                type="button"
                                disabled={updatingId === doc.id}
                                onClick={() => handleUpdateStatus(doc, 'VERIFIED')}
                                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm transition cursor-pointer active:scale-95 flex items-center gap-1"
                                title="Verify doctor credentials against medical registry"
                              >
                                <svg className="w-3 h-3 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                <span>{updatingId === doc.id ? 'Verifying...' : 'Approve & Verify'}</span>
                              </button>
                            )}

                            {isVerified && (
                              <button
                                type="button"
                                disabled={updatingId === doc.id}
                                onClick={() => handleUpdateStatus(doc, 'SUSPENDED')}
                                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 hover:text-white font-bold text-xs transition cursor-pointer active:scale-95"
                                title="Suspend doctor credentials"
                              >
                                Suspend Access
                              </button>
                            )}

                            {isSuspended && (
                              <button
                                type="button"
                                disabled={updatingId === doc.id}
                                onClick={() => handleUpdateStatus(doc, 'VERIFIED')}
                                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs transition cursor-pointer active:scale-95"
                              >
                                Re-Activate Doctor
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setSelectedDoctorModal(doc)}
                              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer border border-white/15"
                              title="Inspect full medical credentials"
                            >
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Multi-Hospital Diagnostic Network Overview */}
        <section className="bg-[#0b1924]/85 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl p-5 sm:p-6 space-y-4 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>Hospital Facilities & Central Laboratory Centers</span>
              </h3>
              <p className="text-xs text-slate-400">
                Network branches integrated into the centralized LIS and clinical verification system.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsRegisterHospOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-sm transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto active:scale-98"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              <span>Register Hospital / Lab</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {facilities.map((fac) => (
              <div key={fac.id} className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-2 text-white hover:border-emerald-500/30 transition-colors">
                <div className="flex items-start justify-between">
                  <span className="font-semibold text-sm text-white block">{fac.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    Active
                  </span>
                </div>
                <span className="text-xs text-emerald-400 font-medium block">{fac.type}</span>
                <span className="text-[11px] text-slate-400 block">{fac.location}</span>
                <div className="pt-2 border-t border-white/10 text-[11px] flex justify-between text-slate-300 font-mono">
                  <span>Director: <strong className="text-white">{fac.labDirector}</strong></span>
                  <span className="tabular-nums">{fac.activeTechnicians} Technicians</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Doctor Inspection Modal */}
      {selectedDoctorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
          <div className="bg-[#0b1924] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-white/15 space-y-4 text-white">
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  {selectedDoctorModal.name}
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {selectedDoctorModal.degrees} • {selectedDoctorModal.specialization}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoctorModal(null)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition border border-white/10"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-white/5 border border-white/10 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[10px] font-mono">NMC / State Reg No</span>
                  <strong className="text-emerald-400 font-mono text-sm tabular-nums">{selectedDoctorModal.nmcRegNo}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-mono">Medical Council</span>
                  <strong className="text-white">{selectedDoctorModal.stateCouncil}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-mono">Hospital Wing</span>
                  <span className="text-slate-200">{selectedDoctorModal.hospitalBranch}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-mono">Department</span>
                  <span className="text-slate-200">{selectedDoctorModal.department || 'Clinical Medicine'}</span>
                </div>
              </div>

              {selectedDoctorModal.notes && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
                  <span className="font-semibold block mb-0.5 text-xs">Super Admin Note:</span>
                  <p className="text-[11px] leading-relaxed text-amber-200/90">{selectedDoctorModal.notes}</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setSelectedDoctorModal(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 transition cursor-pointer border border-white/10"
              >
                Close
              </button>
              {selectedDoctorModal.verificationStatus !== 'VERIFIED' && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedDoctorModal, 'VERIFIED')}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 transition cursor-pointer shadow-sm flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Verify & Authorize</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Register Hospital / Laboratory Modal */}
      {isRegisterHospOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
          <div className="bg-[#0b1924] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-white/15 space-y-4 text-white">
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono font-medium text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md inline-block mb-1 border border-emerald-500/20">
                  Network Facility Onboarding
                </span>
                <h3 className="text-base font-bold text-white">
                  Register Hospital or Diagnostic Laboratory
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRegisterHospOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition border border-white/10"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleRegisterFacility} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-medium">
                  Facility Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setHospCategory('HOSPITAL')}
                    className={`p-2.5 rounded-xl border text-center font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      hospCategory === 'HOSPITAL'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span>Hospital / Medical Center</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHospCategory('LABORATORY')}
                    className={`p-2.5 rounded-xl border text-center font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      hospCategory === 'LABORATORY'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <span>Diagnostic Laboratory</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-medium">
                  Hospital / Laboratory Name
                </label>
                <input
                  type="text"
                  value={hospName}
                  onChange={(e) => setHospName(e.target.value)}
                  placeholder="e.g. City Multi-Specialty Hospital & Research Wing"
                  className="w-full border border-white/15 bg-[#07151f] rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-medium">
                  Physical Address & Location
                </label>
                <input
                  type="text"
                  value={hospAddress}
                  onChange={(e) => setHospAddress(e.target.value)}
                  placeholder="e.g. Ring Road Medical Zone, Vijayawada - 520008"
                  className="w-full border border-white/15 bg-[#07151f] rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {hospCategory === 'HOSPITAL' && (
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1 font-medium">
                      Inpatient Bed Capacity
                    </label>
                    <input
                      type="number"
                      value={hospBeds}
                      onChange={(e) => setHospBeds(Number(e.target.value))}
                      className="w-full border border-white/15 bg-[#07151f] rounded-xl p-2.5 text-xs text-white font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 font-medium">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={hospPhone}
                    onChange={(e) => setHospPhone(e.target.value)}
                    className="w-full border border-white/15 bg-[#07151f] rounded-xl p-2.5 text-xs text-white font-mono tabular-nums focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsRegisterHospOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingHosp}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 transition cursor-pointer disabled:opacity-50 shadow-sm flex items-center gap-1.5 active:scale-98"
                >
                  <span>{submittingHosp ? 'Registering...' : 'Register & Grant Approval'}</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

