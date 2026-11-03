import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import Field from '../../components/Field';
import DemoRibbon from '../../components/DemoRibbon';

export default function StaffLogin() {
  const [email, setEmail] = useState('frontdesk@demo.local');
  const [password, setPassword] = useState('Demo@12345');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { staffLogin, role } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      await staffLogin(email, password);
      // Wait for auth context to update role, then navigate
      navigate('/staff');
    } catch (err) {
      console.warn('Staff login fallback:', err);
      // Demo fallback: if demo credentials, simulate login
      if (email === 'doctor@demo.local') {
        navigate('/doctor');
      } else if (email === 'frontdesk@demo.local' || email === 'frontdesk2@demo.local') {
        navigate('/staff');
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-between">
      <DemoRibbon />

      <header className="p-4 max-w-md w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0F5E57] flex items-center justify-center text-white font-bold text-sm">
            A
          </div>
          <span className="font-bold text-gray-900 text-sm">
            Staff & Doctor Portal
          </span>
        </div>
        <a
          href="/"
          className="text-xs text-[#0F5E57] hover:underline font-semibold"
        >
          ← Patient Portal
        </a>
      </header>

      <main className="flex-1 flex flex-col justify-center px-4 py-8 max-w-md w-full mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200/90 p-8 shadow-sm space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F5E57]">
              Internal Console
            </span>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-1">
              Sign In
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Authorized personnel only. Access is monitored and audited.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              label="Staff Email"
              id="staff-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="frontdesk@demo.local"
              required
            />

            <Field
              label="Password"
              id="staff-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            {error && (
              <p className="text-xs text-red-600 font-semibold" role="alert">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              className="font-bold"
            >
              Sign In to Console
            </Button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="pt-4 border-t border-gray-100 text-xs text-gray-500 space-y-1">
            <p className="font-semibold text-gray-700">Demo Accounts:</p>
            <p>Front Desk: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">frontdesk@demo.local</code> / <code className="bg-gray-100 px-1 py-0.5 rounded">Demo@12345</code></p>
            <p>Doctor: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">doctor@demo.local</code> / <code className="bg-gray-100 px-1 py-0.5 rounded">Demo@12345</code></p>
          </div>
        </div>
      </main>

      <footer className="p-4 text-center text-xs text-gray-400">
        <span>Company A Diagnostics • Front Desk & Pathology Console</span>
      </footer>
    </div>
  );
}

