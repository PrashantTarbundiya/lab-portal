import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAccount = useCallback(async (accessToken) => {
    try {
      const data = await api('/auth/me', { token: accessToken });
      const r = (data.role || data.type || '').toUpperCase();
      setRole(r);
      setAccount(data.account || null);
      if (data.user) setUser(data.user);
      return data;
    } catch {
      setRole(null);
      setAccount(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = localStorage.getItem('portal_token');
        if (storedToken) {
          setSession({ access_token: storedToken });
          await fetchAccount(storedToken);
          setLoading(false);
          return;
        }

        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (existingSession) {
          setSession(existingSession);
          setUser(existingSession.user);
          await fetchAccount(existingSession.access_token);
        }
      } catch {
        // Session restore failed silently
      } finally {
        setLoading(false);
      }
    };

    restoreSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (newSession) {
          setSession(newSession);
          setUser(newSession.user);
          await fetchAccount(newSession.access_token);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchAccount]);

  const loginWithPhone = async (phone) => {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
      return data;
    } catch {
      // In demo mode or if Supabase SMS is not configured, succeed so OTP screen opens
      return { success: true };
    }
  };

  const verifyOtp = async (phone, otpToken) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: otpToken,
        type: 'sms',
      });
      if (error) throw error;
      setSession(data.session);
      setUser(data.user);
      if (data.session) {
        localStorage.setItem('portal_token', data.session.access_token);
        await fetchAccount(data.session.access_token);
      }
      return data;
    } catch {
      // Fall back to demo login
      const res = await api('/auth/demo-login', {
        method: 'POST',
        body: { role: 'PATIENT', identifier: phone },
      });
      localStorage.setItem('portal_token', res.token);
      setSession({ access_token: res.token });
      setUser({ phone });
      setAccount(res.account);
      setRole('PATIENT');
      return res;
    }
  };

  const staffLogin = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      setSession(data.session);
      setUser(data.user);
      if (data.session) {
        localStorage.setItem('portal_token', data.session.access_token);
        await fetchAccount(data.session.access_token);
      }
      return data;
    } catch {
      // Fall back to demo login
      const targetRole = email.toLowerCase().includes('doctor') ? 'DOCTOR' : 'STAFF';
      const res = await api('/auth/demo-login', {
        method: 'POST',
        body: { role: targetRole, identifier: email },
      });
      localStorage.setItem('portal_token', res.token);
      setSession({ access_token: res.token });
      setUser(res.user);
      setRole(res.role || targetRole);
      return res;
    }
  };

  const logout = async () => {
    localStorage.removeItem('portal_token');
    try {
      await supabase.auth.signOut();
    } catch {}
    setUser(null);
    setSession(null);
    setRole(null);
    setAccount(null);
  };

  const normalizedRole = (role || '').toUpperCase();

  const value = {
    user,
    session,
    role: normalizedRole,
    account,
    loading,
    loginWithPhone,
    verifyOtp,
    staffLogin,
    logout,
    isAuthenticated: !!session,
    isPatient: normalizedRole === 'PATIENT',
    isStaff: normalizedRole === 'STAFF' || normalizedRole === 'FRONT_DESK',
    isDoctor: normalizedRole === 'DOCTOR',
    isAdmin: normalizedRole === 'ADMIN',
    token: session?.access_token ?? null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
