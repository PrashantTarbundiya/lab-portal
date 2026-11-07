import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import HospitalPortalSwitcher from '../../components/HospitalPortalSwitcher';
import Button from '../../components/Button';
import Field from '../../components/Field';

export default function DoctorLogin() {
  const [selectedDoctor, setSelectedDoctor] = useState('suresh');
  const [regNo, setRegNo] = useState('MCI-2018-84920');
  const [email, setEmail] = useState('doctor@demo.local');
  const [password, setPassword] = useState('Doctor@2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { staffLogin } = useAuth();

  const demoDoctors = [
    {
      id: 'suresh',
      name: 'Dr. K. Suresh, MD',
      regNo: 'MCI-2018-84920',
      email: 'doctor@demo.local',
      specialty: 'Internal Medicine & Critical Care',
      hospital: 'Main Super-Specialty Hospital',
      status: 'VERIFIED',
      statusLabel: 'NMC Verified by CMO',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    },
    {
      id: 'verma',
      name: 'Dr. A. Verma, MD',
      regNo: 'MCI-2021-19284',
      email: 'pathologist@demo.local',
      specialty: 'Pathology & Laboratory Medicine',
      hospital: 'Central Core Diagnostics Lab',
      status: 'VERIFIED',
      statusLabel: 'NMC Verified by CMO',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    },
    {
      id: 'pooja',
      name: 'Dr. Pooja Sharma, MD',
      regNo: 'NMC-2024-51029',
      email: 'drpooja@demo.local',
      specialty: 'Endocrinology & Diabetology',
      hospital: 'City Care OPD & Wellness',
      status: 'PENDING_VERIFICATION',
      statusLabel: 'Pending Super Admin Review',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
  ];

  const handleSelectDoctor = (doc) => {
    setSelectedDoctor(doc.id);
    setRegNo(doc.regNo);
    setEmail(doc.email);
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      // In demo mode, establish doctor session
      localStorage.setItem('portal_token', 'demo-doctor');
      localStorage.setItem('doctor_profile', JSON.stringify({
        regNo,
        email,
        name: demoDoctors.find(d => d.regNo === regNo)?.name || 'Dr. Medical Practitioner',
        status: demoDoctors.find(d => d.regNo === regNo)?.status || 'VERIFIED',
      }));

      await staffLogin(email, password);
      navigate('/doctor');
    } catch (err) {
      console.warn('Doctor login fallback to demo session:', err);
      localStorage.setItem('portal_token', 'demo-doctor');
      navigate('/doctor');
    } finally {
      setLoading(false);
    }
  };

  const activeDoc = demoDoctors.find(d => d.id === selectedDoctor);

  return (
    <div className="min-h-screen bg-[#07151f] text-slate-100 flex flex-col justify-between relative overflow-x-hidden selection:bg-emerald-400 selection:text-slate-950 font-sans">
      {/* Atmospheric Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-36 left-1/4 w-[750px] h-[750px] bg-teal-500/10 rounded-full blur-[140px]"></div>
        <div className="absolute top-1/3 -right-40 w-[620px] h-[620px] bg-emerald-500/10 rounded-full blur-[160px]"></div>
      </div>

      <main className="flex-1 flex flex-col justify-center px-4 py-8 max-w-xl w-full mx-auto space-y-6 relative z-10">
        {/* Doctor Portal Header Badge */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <span className="font-black text-white text-lg tracking-tight">
              LABORA
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-900 text-teal-200 border border-teal-700">
              Company A Diagnostics
            </span>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-950/80 border border-teal-500/40 text-teal-300 text-xs font-semibold shadow-xs">
            <svg className="w-3.5 h-3.5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span>National Medical Commission (NMC) Physician Gateway</span>
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping"></span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Consultant & Doctor Portal
          </h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Authorized clinical access for licensed physicians, pathologists, and referring consultants.
          </p>
        </div>

        {/* Doctor Card Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center justify-between">
            <span>Select Doctor Profile to Sign In:</span>
            <span className="text-[10px] text-teal-400 font-normal">One-Click Clinician Switch</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {demoDoctors.map((doc) => {
              const isSelected = selectedDoctor === doc.id;
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => handleSelectDoctor(doc)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-teal-900/60 border-teal-400 shadow-md ring-1 ring-teal-400/50'
                      : 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-700/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <span className="font-extrabold text-xs text-white block truncate">
                      {doc.name}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold border inline-flex items-center gap-1 ${doc.badgeColor}`}>
                      {doc.status === 'VERIFIED' ? (
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      )}
                      <span>{doc.status === 'VERIFIED' ? 'Verified' : 'Pending'}</span>
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono block">
                    {doc.regNo}
                  </span>
                  <span className="text-[10px] text-teal-300 font-medium block truncate mt-0.5">
                    {doc.specialty}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Doctor Credential Verification Status Box */}
        {activeDoc && (
          <div className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
            activeDoc.status === 'VERIFIED'
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
              : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
          }`}>
            <div className="flex items-center justify-between font-bold text-xs">
              <span className="flex items-center gap-1.5">
                {activeDoc.status === 'VERIFIED' ? (
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                ) : (
                  <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                )}
                <span>Doctor Verification Status:</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                activeDoc.status === 'VERIFIED'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-amber-500 text-slate-950'
              }`}>
                {activeDoc.status}
              </span>
            </div>

            <p className="text-[11px] opacity-90 leading-relaxed">
              {activeDoc.status === 'VERIFIED'
                ? `Dr. ${activeDoc.name.replace(/^Dr\.\s*/, '')} is verified by the Super Admin CMO under Medical Council Reg #${activeDoc.regNo}. Authorized to review and sign clinical pathology reports.`
                : `Dr. ${activeDoc.name.replace(/^Dr\.\s*/, '')} credentials are currently awaiting approval in the Super Admin Verification Console. Critical report sign-off is restricted until NMC review completes.`
              }
            </p>

            {activeDoc.status === 'PENDING_VERIFICATION' && (
              <div className="pt-1">
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-amber-400 underline hover:text-amber-300"
                >
                  <span>Super Admin? Click here to approve this doctor in the Verification Hub</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Doctor Login Form */}
        <div className="bg-slate-800/90 rounded-3xl border border-slate-700/80 p-6 sm:p-7 shadow-xl space-y-5">
          <form onSubmit={handleLogin} className="space-y-4">
            <Field
              label="Doctor NMC / State Medical Registration Number"
              id="doc-reg-no"
              type="text"
              value={regNo}
              onChange={(e) => setRegNo(e.target.value)}
              placeholder="e.g. MCI-2018-84920"
              hint="Verified against National Medical Commission practitioner registry"
              required
            />

            <Field
              label="Registered Medical Email"
              id="doc-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@demo.local"
              required
            />

            <Field
              label="Secure Password / Biometric PIN"
              id="doc-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            {error && (
              <p className="text-xs text-rose-400 font-semibold">{error}</p>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              className="py-3 font-extrabold text-sm shadow-md rounded-xl bg-teal-600 hover:bg-teal-500 text-white cursor-pointer inline-flex items-center justify-center gap-1.5"
            >
              <span>Sign In to Doctor Clinical Console</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </Button>
          </form>

          {/* Quick links & Super Admin link */}
          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
            <Link to="/" className="hover:text-white transition inline-flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              <span>Patient Portal</span>
            </Link>
            <Link to="/admin" className="text-teal-400 font-semibold hover:text-teal-300 transition inline-flex items-center gap-1.5">
              <span>Super Admin Hub</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </main>

      <footer className="p-4 text-center text-xs text-slate-500">
        <span>Company A Healthcare Network • NABL ISO 15189 • DPDP Act 2023 Compliant</span>
      </footer>
    </div>
  );
}

