"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  // ───── Hydration-safe state: always null/false on first render (server & client match) ─────
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const didInit = useRef(false);

  useEffect(() => {
    // Runs once on client mount — read cached auth from localStorage SYNCHRONOUSLY
    // so all three state updates batch into the same React commit (no flash).
    if (didInit.current) return;
    didInit.current = true;

    const cachedLoggedIn = localStorage.getItem('user_logged_in');
    const cachedRole = localStorage.getItem('user_role');
    const cachedId = localStorage.getItem('user_id');
    const cachedEmail = localStorage.getItem('user_email');

    if (cachedLoggedIn && cachedRole) {
      setUser({ id: cachedId, email: cachedEmail, _cached: true });
      setUserRole(cachedRole);
    }
    // Whether cached or not, auth is ready now — show the correct buttons immediately
    setAuthReady(true);

    // Then verify with Supabase in the background (corrects stale cache)
    let isMounted = true;

    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (session?.user) {
          setUser(session.user);

          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (!isMounted) return;

          if (profile?.role) {
            setUserRole(profile.role);
            localStorage.setItem('user_role', profile.role);
            localStorage.setItem('user_logged_in', 'true');
            localStorage.setItem('user_id', session.user.id);
            localStorage.setItem('user_email', session.user.email || '');
          }
        } else {
          setUser(null);
          setUserRole(null);
          localStorage.removeItem('user_role');
          localStorage.removeItem('user_logged_in');
          localStorage.removeItem('user_id');
          localStorage.removeItem('user_email');
        }
      } catch {
        // Silent fail — cached state is good enough
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
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (!isMounted) return;

          if (profile?.role) {
            setUserRole(profile.role);
            localStorage.setItem('user_role', profile.role);
            localStorage.setItem('user_logged_in', 'true');
            localStorage.setItem('user_id', session.user.id);
            localStorage.setItem('user_email', session.user.email || '');
          }
        } else {
          setUser(null);
          setUserRole(null);
          localStorage.removeItem('user_role');
          localStorage.removeItem('user_logged_in');
          localStorage.removeItem('user_id');
          localStorage.removeItem('user_email');
        }
      } catch (error) {
        console.error('Auth state change error:', error);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = useCallback(async () => {
    // 1. Clear localStorage immediately
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_logged_in');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');

    // 2. Clear React state
    setUser(null);
    setUserRole(null);

    // 3. Call Supabase signOut (with timeout safety)
    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise(resolve => setTimeout(resolve, 3000)),
      ]);
    } catch {
      // Ignore errors
    }

    // 4. Force-clear ALL Supabase auth cookies (bulletproof cleanup)
    //    @supabase/ssr stores tokens in cookies like: sb-<ref>-auth-token, sb-<ref>-auth-token.0, .1, etc.
    document.cookie.split(';').forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      if (name.startsWith('sb-') || name.includes('supabase')) {
        // Delete the cookie for all possible paths
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
      }
    });

    // 5. Also clear sessionStorage in case anything is cached there
    try {
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          sessionStorage.removeItem(key);
        }
      });
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('sb-') || key.includes('supabase')) {
          localStorage.removeItem(key);
        }
      });
    } catch {
      // Ignore storage errors
    }

    // 6. Redirect — session is fully destroyed now
    window.location.href = '/';
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
