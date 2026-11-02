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
      setRole(data.role);
      setAccount(data.account);
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
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession) {
          await fetchAccount(newSession.access_token);
        } else {
          setRole(null);
          setAccount(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchAccount]);

  const loginWithPhone = async (phone) => {
    const { data, error } = await supabase.auth.signInWithOtp({ phone });
    if (error) throw error;
    return data;
  };

  const verifyOtp = async (phone, otpToken) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: otpToken,
      type: 'sms',
    });
    if (error) throw error;
    setSession(data.session);
    setUser(data.user);
    if (data.session) {
      await fetchAccount(data.session.access_token);
    }
    return data;
  };

  const staffLogin = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    setSession(data.session);
    setUser(data.user);
    if (data.session) {
      await fetchAccount(data.session.access_token);
    }
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setAccount(null);
  };

  const value = {
    user,
    session,
    role,
    account,
    loading,
    loginWithPhone,
    verifyOtp,
    staffLogin,
    logout,
    isAuthenticated: !!session,
    isPatient: role === 'patient',
    isStaff: role === 'staff' || role === 'admin',
    isDoctor: role === 'doctor',
    isAdmin: role === 'admin',
    token: session?.access_token ?? null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
