"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { signOutClient } from '@/lib/sign-out';

interface AuthContextType {
  user: any;
  userRole: string | null;
  isLoggedIn: boolean;
  isPlayer: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  authReady: boolean;
  handleSignOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  isLoggedIn: false,
  isPlayer: false,
  isOwner: false,
  isAdmin: false,
  authReady: false,
  handleSignOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(() => {
    // Initialize from cache synchronously to prevent flash
    if (typeof window !== 'undefined') {
      const cachedLoggedIn = localStorage.getItem('user_logged_in');
      const cachedRole = localStorage.getItem('user_role');
      const cachedId = localStorage.getItem('user_id');
      const cachedEmail = localStorage.getItem('user_email');
      if (cachedLoggedIn && cachedRole) {
        return { id: cachedId, email: cachedEmail, _cached: true };
      }
    }
    return null;
  });

  const [userRole, setUserRole] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('user_role');
    }
    return null;
  });

  // Auth is always "ready" on the client — either we have cached data (logged in)
  // or we don't (not logged in). Either way, show buttons immediately.
  const [authReady, setAuthReady] = useState(() => {
    if (typeof window !== 'undefined') {
      return true; // Always ready on client — show Sign In if no cache, Sign Out if cache exists
    }
    return false; // SSR: not ready
  });

  useEffect(() => {
    let isMounted = true;

    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (session?.user) {
          setUser(session.user);
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, full_name, phone, whatsapp_number')
            .eq('id', session.user.id)
            .single();

          if (!isMounted) return;

          if (profile?.role) {
            setUserRole(profile.role);
            localStorage.setItem('user_role', profile.role);
            localStorage.setItem('user_logged_in', 'true');
            localStorage.setItem('user_id', session.user.id);
            localStorage.setItem('user_email', session.user.email || '');
            if (profile.full_name) localStorage.setItem('user_full_name', profile.full_name);
            if (profile.phone || profile.whatsapp_number) {
              localStorage.setItem('user_phone', profile.phone || profile.whatsapp_number || '');
            }
          }
        } else {
          setUser(null);
          setUserRole(null);
          localStorage.removeItem('user_role');
          localStorage.removeItem('user_logged_in');
          localStorage.removeItem('user_id');
          localStorage.removeItem('user_email');
          localStorage.removeItem('user_full_name');
          localStorage.removeItem('user_phone');
        }
      } catch (error) {
        // Silent fail
      } finally {
        if (isMounted) setAuthReady(true);
      }
    };

    checkUser();

    // Listen to auth changes for real-time updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      try {
        if (session?.user) {
          setUser(session.user);
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, full_name, phone, whatsapp_number')
            .eq('id', session.user.id)
            .single();

          if (!isMounted) return;

          if (profile?.role) {
            setUserRole(profile.role);
            localStorage.setItem('user_role', profile.role);
            localStorage.setItem('user_logged_in', 'true');
            localStorage.setItem('user_id', session.user.id);
            localStorage.setItem('user_email', session.user.email || '');
            if (profile.full_name) localStorage.setItem('user_full_name', profile.full_name);
            if (profile.phone || profile.whatsapp_number) {
              localStorage.setItem('user_phone', profile.phone || profile.whatsapp_number || '');
            }
          }
        } else {
          setUser(null);
          setUserRole(null);
          localStorage.removeItem('user_role');
          localStorage.removeItem('user_logged_in');
          localStorage.removeItem('user_id');
          localStorage.removeItem('user_email');
          localStorage.removeItem('user_full_name');
          localStorage.removeItem('user_phone');
        }
        setAuthReady(true);
      } catch (error) {
        console.error('Auth state change error:', error);
        if (isMounted) setAuthReady(true);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = useCallback(async () => {
    setUser(null);
    setUserRole(null);
    signOutClient('/');
  }, []);

  const isLoggedIn = !!user;
  const isPlayer = userRole === 'player';
  const isOwner = userRole === 'venue_owner';
  const isAdmin = userRole === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      userRole,
      isLoggedIn,
      isPlayer,
      isOwner,
      isAdmin,
      authReady,
      handleSignOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
