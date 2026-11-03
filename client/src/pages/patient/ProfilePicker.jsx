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

      <main className="flex-1 px-4 py-6 max-w-md w-full mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {t('profileTitle')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Select a family member to view their diagnostic reports
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
            {profiles.map((p) => (
              <Card
                key={p.id}
                hoverable
                onClick={() => handleSelect(p.id)}
                className="p-5 flex items-center justify-between border-gray-200/90 hover:border-[#0F5E57] group transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0F5E57] font-bold text-lg group-hover:bg-[#0F5E57] group-hover:text-white transition-colors">
                    {p.fullName ? p.fullName.charAt(0).toUpperCase() : 'P'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base leading-snug">
                      {p.fullName}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">
                      {p.relation} • {p.sex === 'F' ? 'Female' : p.sex === 'M' ? 'Male' : 'Other'}
                      {p.orderCount !== undefined && ` • ${p.orderCount} report${p.orderCount === 1 ? '' : 's'}`}
                    </p>
                  </div>
                </div>
                <span className="text-gray-400 group-hover:text-[#0F5E57] group-hover:translate-x-0.5 transition-all text-xl">
                  →
                </span>
              </Card>
            ))}

            {/* "All Family Reports" Option */}
            <Card
              hoverable
              onClick={() => handleSelect(null)}
              className="p-5 flex items-center justify-between border-dashed border-gray-300 hover:border-[#0F5E57] group transition-all bg-gray-50/50"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 font-bold group-hover:bg-[#0F5E57] group-hover:text-white transition-colors">
                  👥
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base leading-snug">
                    {t('profileAll')}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    View reports for all family members
                  </p>
                </div>
              </div>
              <span className="text-gray-400 group-hover:text-[#0F5E57] group-hover:translate-x-0.5 transition-all text-xl">
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

