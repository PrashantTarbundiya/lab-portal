import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useToast } from '../../components/Toast';
import LoadingSpinner from '../../components/LoadingSpinner';

const FACILITY_SLUGS = {
  'HOSP-01': 'company-a-main-hospital',
  'HOSP-02': 'apollo-hospital-vijayawada',
  'HOSP-03': 'manipal-hospital',
  'HOSP-04': 'ggh-vijayawada',
  'LAB-01': 'company-a-central-lab',
};

const SLUG_TO_ID = {
  'company-a-main-hospital': 'HOSP-01',
  'apollo-hospital-vijayawada': 'HOSP-02',
  'manipal-hospital': 'HOSP-03',
  'ggh-vijayawada': 'HOSP-04',
  'company-a-central-lab': 'LAB-01',
};

export default function HospitalAdminDashboard() {
  const [facilities, setFacilities] = useState([]);
  const [selectedFacilityId, setSelectedFacilityId] = useState('HOSP-01');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('DEPARTMENTS'); // DEPARTMENTS | APPOINTMENTS | ADD_DOCTOR

  const { hospitalSlug, facilityId } = useParams();
  const navigate = useNavigate();

  // Ensure unique hierarchical URL structure in address bar: /:hospitalSlug/admin
  useEffect(() => {
    if (hospitalSlug && SLUG_TO_ID[hospitalSlug]) {
      setSelectedFacilityId(SLUG_TO_ID[hospitalSlug]);
    } else if (facilityId) {
      setSelectedFacilityId(facilityId);
    } else {
      navigate('/company-a-main-hospital/admin', { replace: true });
    }
  }, [hospitalSlug, facilityId, navigate]);

  const handleFacilityChange = (newFacilityId) => {
    setSelectedFacilityId(newFacilityId);
    const slug = FACILITY_SLUGS[newFacilityId] || newFacilityId.toLowerCase();
    navigate(`/${slug}/admin`);
  };

  // New Doctor Form State
  const [docName, setDocName] = useState('');
  const [docDegrees, setDocDegrees] = useState('MBBS, MD');
  const [docNmcRegNo, setDocNmcRegNo] = useState('');
  const [docDepartment, setDocDepartment] = useState('Cardiology & Cardiovascular Sciences');
  const [docOpdFee, setDocOpdFee] = useState(700);
  const [docExp, setDocExp] = useState(8);
  const [submittingDoc, setSubmittingDoc] = useState(false);

  const { addToast } = useToast();

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const res = await api('/hospitals');
      setFacilities(res.hospitals || []);
    } catch (err) {
      console.warn('Hospital admin fetch fallback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  const activeFacility = facilities.find(f => f.id === selectedFacilityId) || facilities[0];

  const handleDualVerify = async (docId, approved) => {
    try {
      const res = await api(`/hospitals/${activeFacility.id}/doctors/${docId}/dual-verify`, {
        method: 'PATCH',
        body: {
          verifierType: 'HOSPITAL_ADMIN',
          approved,
        },
      });

      addToast(
        approved
          ? `Doctor approved by Hospital Medical Board. Overall Status: ${res.doctor?.status}`
          : `Hospital verification revoked for doctor`,
        approved ? 'success' : 'info'
      );
      fetchFacilities();
    } catch (err) {
      addToast(`Verification update failed: ${err.message}`, 'error');
    }
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    if (!docName || !docNmcRegNo) return;

    try {
      setSubmittingDoc(true);
      const res = await api(`/hospitals/${activeFacility.id}/doctors`, {
        method: 'POST',
        body: {
          departmentId: docDepartment,
          name: docName,
          degrees: docDegrees,
          nmcRegNo: docNmcRegNo,
          opdFee: docOpdFee,
          experienceYears: docExp,
        },
      });

      addToast(`Doctor ${docName} registered under ${activeFacility.name}! Hospital Tier-1 verified.`, 'success');
      setDocName('');
      setDocNmcRegNo('');
      setActiveTab('DEPARTMENTS');
      fetchFacilities();
    } catch (err) {
      addToast(`Failed to add doctor: ${err.message}`, 'error');
    } finally {
      setSubmittingDoc(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07151f] text-slate-100 flex flex-col font-sans relative selection:bg-emerald-400 selection:text-slate-950">
      {/* Atmospheric Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-36 left-1/4 w-[750px] h-[750px] bg-teal-500/10 rounded-full blur-[140px]"></div>
        <div className="absolute top-1/3 -right-40 w-[620px] h-[620px] bg-emerald-500/10 rounded-full blur-[160px]"></div>
      </div>

      {/* Hospital Admin Header */}
      <header className="relative z-10 bg-gradient-to-r from-[#061723] via-[#091f2e] to-[#07151f] text-white border-b border-white/10 shadow-lg py-5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-[10px] uppercase tracking-wider font-mono">
                Hospital Administration • Medical Superintendent Console
              </span>
              <span className="text-slate-400 text-xs hidden sm:inline font-mono">• Tier-1 Hospital Credentialing</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-white">
              {activeFacility?.name || 'Hospital Administration'}
            </h1>
            <p className="text-xs text-slate-300">
              Department hierarchy management, doctor registration, and hospital medical board verification.
            </p>
          </div>

          {/* Facility Selector */}
          <div className="glass-card p-2.5 rounded-2xl border border-white/15 text-xs space-y-1">
            <span className="text-[10px] text-emerald-300 font-bold uppercase font-mono block">Managing Hospital Facility:</span>
            <select
              value={selectedFacilityId}
              onChange={(e) => handleFacilityChange(e.target.value)}
              className="glass-input bg-[#0b1924] border border-white/15 text-white text-xs rounded-xl p-2 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
            >
              {facilities.map((f) => (
                <option key={f.id} value={f.id} className="bg-[#0b1924] text-white">
                  {f.name} ({f.category})
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('DEPARTMENTS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'DEPARTMENTS'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>Hospital Departments & Doctor Verification</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ADD_DOCTOR')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ADD_DOCTOR'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            <span>Register Doctor in Hospital</span>
          </button>
        </div>

        {/* TAB 1: DEPARTMENTS & DOCTORS */}
        {activeTab === 'DEPARTMENTS' && (
          <div className="space-y-6">
            <div className="glass-card p-5 rounded-3xl border border-white/10 shadow-xl space-y-2 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-display font-black text-white">
                    Dual Verification Matrix (Hospital + Super Admin)
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Under hospital accreditation guidelines, both the <strong className="text-white">Hospital Medical Superintendent</strong> and the <strong className="text-white">Super Admin CMO</strong> must approve a physician before they can sign reports.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold text-[10px] inline-flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                    <span>FULLY_VERIFIED: Both Approved</span>
                  </span>
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold text-[10px] inline-flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>Awaiting Super Admin</span>
                  </span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="space-y-4">
                {activeFacility?.departments?.map((dept) => (
                  <div
                    key={dept.id}
                    className="glass-panel-elevated rounded-3xl border border-white/15 p-5 sm:p-6 shadow-2xl space-y-4 text-white"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3.5">
                      <div>
                        <h4 className="text-base sm:text-lg font-display font-black text-white">
                          {dept.name}
                        </h4>
                        <span className="text-xs text-slate-300">
                          Department Head: <strong className="text-white font-medium">{dept.head}</strong> • Timings: {dept.opdTimings}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-xl border border-emerald-500/40 self-start sm:self-auto shadow-xs">
                        {dept.doctors?.length || 0} Physicians Assigned
                      </span>
                    </div>

                    {dept.doctors?.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center">
                        No doctors assigned to this department yet. Use "Register Doctor" tab above to onboard.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {dept.doctors.map((doc) => (
                          <div
                            key={doc.id}
                            className="bg-[#0c1a24]/90 backdrop-blur-xl border border-white/12 hover:border-emerald-500/40 p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-slate-200 transition-all shadow-lg"
                          >
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <strong className="text-sm sm:text-base font-display font-black text-white">
                                  {doc.name}
                                </strong>
                                <span className="text-xs text-slate-300 font-mono">
                                  ({doc.degrees})
                                </span>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black border ${
                                  doc.status === 'FULLY_VERIFIED'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                }`}>
                                  {doc.status.replace(/_/g, ' ')}
                                </span>
                              </div>

                              <div className="text-xs text-slate-300 font-mono flex flex-wrap items-center gap-x-4 gap-y-1">
                                <span>Reg No: <strong className="text-emerald-400 font-bold">{doc.nmcRegNo}</strong></span>
                                <span>Council: <strong className="text-white">{doc.stateCouncil}</strong></span>
                                <span>Fee: <strong className="text-emerald-400 font-bold">₹{doc.opdFee}</strong></span>
                                <span>Slots: <strong className="text-slate-300">{doc.slotsAvailable?.slice(0, 3).join(', ')}...</strong></span>
                              </div>

                              <div className="text-[11px] pt-1 flex flex-wrap items-center gap-3">
                                <span className={doc.hospitalVerified ? 'text-emerald-300 font-medium flex items-center gap-1.5' : 'text-amber-300 font-medium flex items-center gap-1.5'}>
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                  <span>Hospital Board: {doc.hospitalVerified ? 'Approved' : 'Pending'}</span>
                                </span>
                                <span className={doc.superAdminVerified ? 'text-emerald-300 font-medium flex items-center gap-1.5' : 'text-amber-300 font-medium flex items-center gap-1.5'}>
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                  <span>Super Admin CMO: {doc.superAdminVerified ? 'Approved' : 'Pending NMC Check'}</span>
                                </span>
                              </div>
                            </div>

                            {/* Verification Actions */}
                            <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                              {!doc.hospitalVerified ? (
                                <button
                                  type="button"
                                  onClick={() => handleDualVerify(doc.id, true)}
                                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/25 transition cursor-pointer active:scale-95 inline-flex items-center gap-1.5"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                                  <span>Hospital Board Approve</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleDualVerify(doc.id, false)}
                                  className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/35 border border-rose-500/50 text-rose-200 hover:text-white font-bold text-xs transition cursor-pointer active:scale-95 shadow-sm"
                                >
                                  Revoke Hospital Stamp
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REGISTER DOCTOR IN HOSPITAL */}
        {activeTab === 'ADD_DOCTOR' && (
          <div className="glass-panel-elevated rounded-3xl border border-white/15 p-6 sm:p-8 shadow-2xl max-w-xl mx-auto space-y-5 text-white">
            <div>
              <span className="text-[10px] uppercase font-mono font-black text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full inline-block mb-1 border border-emerald-500/40">
                Hospital Tier-1 Registration
              </span>
              <h3 className="text-xl font-display font-black text-white tracking-tight">
                Register New Doctor at {activeFacility?.name}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Adding a doctor automatically grants Hospital Medical Board approval and queues the doctor for Super Admin central NMC registry check.
              </p>
            </div>

            <form onSubmit={handleAddDoctor} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1">
                  Doctor Full Name & Title
                </label>
                <input
                  type="text"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Kumar, MD"
                  className="w-full glass-input border border-white/15 bg-[#07151f]/80 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1">
                  Medical Degrees & Specialization
                </label>
                <input
                  type="text"
                  value={docDegrees}
                  onChange={(e) => setDocDegrees(e.target.value)}
                  placeholder="e.g. MBBS, MD (General Medicine), DNB"
                  className="w-full glass-input border border-white/15 bg-[#07151f]/80 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1">
                  National Medical Commission (NMC / State) Registration Number
                </label>
                <input
                  type="text"
                  value={docNmcRegNo}
                  onChange={(e) => setDocNmcRegNo(e.target.value)}
                  placeholder="e.g. MCI-2022-77189"
                  className="w-full glass-input border border-white/15 bg-[#07151f]/80 rounded-xl p-3 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1">
                  Hospital Department
                </label>
                <select
                  value={docDepartment}
                  onChange={(e) => setDocDepartment(e.target.value)}
                  className="w-full glass-input border border-white/15 bg-[#07151f]/80 rounded-xl p-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
                >
                  {activeFacility?.departments?.map((d) => (
                    <option key={d.id} value={d.id} className="bg-[#0b1924] text-white">
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1">
                    OPD Consultation Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={docOpdFee}
                    onChange={(e) => setDocOpdFee(e.target.value)}
                    className="w-full glass-input border border-white/15 bg-[#07151f]/80 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-slate-400 mb-1">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    value={docExp}
                    onChange={(e) => setDocExp(e.target.value)}
                    className="w-full glass-input border border-white/15 bg-[#07151f]/80 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingDoc}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-sm cursor-pointer disabled:opacity-50 active:scale-98 flex items-center justify-center gap-1.5"
              >
                <span>{submittingDoc ? 'Registering Doctor...' : 'Submit Doctor Registration with Hospital Board Verification'}</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
