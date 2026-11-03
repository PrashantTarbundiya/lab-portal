import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../utils/api';
import Card from '../../components/Card';
import DemoRibbon from '../../components/DemoRibbon';
import PatientNavbar from '../../components/PatientNavbar';
import { SkeletonCard } from '../../components/Skeleton';
import ErrorState from '../../components/ErrorState';
import FloatingAICopilot from '../../components/FloatingAICopilot';

export default function ProfilePicker() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const { t } = useLanguage();

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api('/patients/profiles', { token });
      setProfiles(res.patients || []);
    } catch (err) {
      console.warn('Profile fetch error, using demo fallback:', err);
      // Demo fallback for family 9000000001
      setProfiles([
        { id: 'p1', fullName: 'Lakshmi Prasanna K', relation: 'SELF', sex: 'F', orderCount: 2 },
        { id: 'p2', fullName: 'Srinivas Rao T', relation: 'SPOUSE', sex: 'M', orderCount: 1 },
        { id: 'p3', fullName: 'Bhavani K', relation: 'CHILD', sex: 'F', orderCount: 1 },
        { id: 'p4', fullName: 'Raghavendra T', relation: 'CHILD', sex: 'M', orderCount: 0 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleSelect = (patientId) => {
    if (patientId) {
      navigate(`/reports?patientId=${patientId}`);
    } else {
      navigate('/reports'); // All family reports
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-between">
      <DemoRibbon />
      <PatientNavbar />

      <main className="flex-1 px-4 py-6 max-w-md w-full mx-auto space-y-4">
        {/* Creative Family Health Hub Banner */}
        <div className="bg-gradient-to-br from-[#0F5E57] via-[#0d4f49] to-teal-950 text-white p-5 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider uppercase bg-white/20 px-2 py-0.5 rounded-full text-teal-100">
              🌿 Family Health Vault
            </span>
            <span className="text-xs text-teal-200">
              DPDP Act 2023 Secured
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {profiles[0]?.fullName ? `${profiles[0].fullName.split(' ')[0]}'s Family Health` : 'Family Health Records'}
            </h1>
            <p className="text-xs text-teal-100/90 mt-0.5 leading-relaxed">
              Consolidated diagnostic history for all registered dependents and family members under mobile link.
            </p>
          </div>
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-teal-200 font-medium">
              👥 <strong>{profiles.length}</strong> Family Members
            </span>
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className="px-2.5 py-1 bg-white text-[#0F5E57] rounded-lg font-bold text-xs hover:bg-teal-50 transition cursor-pointer shadow-2xs"
            >
              View All Reports →
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-base font-bold text-gray-900 tracking-tight">
            {t('profileTitle')}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Select a profile to view specific diagnostic reports
          </p>
        </div>

        {loading ? (
          <div className="space-y-3">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : error ? (
          <ErrorState description={error} onRetry={fetchProfiles} />
        ) : (
          <div className="space-y-3">
            {/* Individual Profile Cards */}
            {profiles.map((p) => {
              const relationBadge = p.relation === 'SELF'
                ? { bg: 'bg-emerald-100 text-emerald-800', border: 'border-emerald-200' }
                : p.relation === 'SPOUSE'
                ? { bg: 'bg-blue-100 text-blue-800', border: 'border-blue-200' }
                : p.relation === 'CHILD'
                ? { bg: 'bg-purple-100 text-purple-800', border: 'border-purple-200' }
                : { bg: 'bg-amber-100 text-amber-800', border: 'border-amber-200' };

              return (
                <Card
                  key={p.id}
                  hoverable
                  onClick={() => handleSelect(p.id)}
                  className="p-4 flex items-center justify-between border-gray-200/90 hover:border-[#0F5E57] group transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F5E57] font-bold text-base group-hover:bg-[#0F5E57] group-hover:text-white transition-colors">
                      {p.fullName ? p.fullName.charAt(0).toUpperCase() : 'P'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-gray-900 text-sm leading-snug">
                          {p.fullName}
                        </h3>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border ${relationBadge.bg} ${relationBadge.border}`}>
                          {p.relation}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 font-medium">
                        {p.sex === 'F' ? 'Female' : p.sex === 'M' ? 'Male' : 'Other'}
                        {p.orderCount !== undefined && ` • ${p.orderCount} report${p.orderCount === 1 ? '' : 's'}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-gray-400 group-hover:text-[#0F5E57] group-hover:translate-x-0.5 transition-all text-lg font-bold">
                    →
                  </span>
                </Card>
              );
            })}

            {/* "All Family Reports" Option */}
            <Card
              hoverable
              onClick={() => handleSelect(null)}
              className="p-4 flex items-center justify-between border-dashed border-gray-300 hover:border-[#0F5E57] group transition-all bg-gray-50/50"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 font-bold group-hover:bg-[#0F5E57] group-hover:text-white transition-colors">
                  👥
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm leading-snug">
                    {t('profileAll')}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    View unified timeline of all family tests
                  </p>
                </div>
              </div>
              <span className="text-gray-400 group-hover:text-[#0F5E57] group-hover:translate-x-0.5 transition-all text-lg font-bold">
                →
              </span>
            </Card>
          </div>
        )}

        <div className="mt-8 text-center">
          <a
            href="/privacy"
            className="text-xs text-gray-500 hover:text-gray-800 underline font-medium"
          >
            Privacy & Data Rights
          </a>
        </div>
      </main>

      <footer className="p-4 text-center text-xs text-gray-400 max-w-md w-full mx-auto">
        <span>Company A Diagnostics • Family Health Records</span>
      </footer>

      {/* Floating Global AI Copilot */}
      <FloatingAICopilot />
    </div>
  );
}

