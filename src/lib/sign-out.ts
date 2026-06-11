import { supabase } from '@/integrations/supabase/client';

/** Clear cached auth state and Supabase cookies without redirecting. */
export function clearAuthSession() {
  localStorage.removeItem('user_role');
  localStorage.removeItem('user_logged_in');
  localStorage.removeItem('user_id');
  localStorage.removeItem('user_email');
  localStorage.removeItem('user_full_name');
  localStorage.removeItem('user_phone');

  document.cookie.split(';').forEach((cookie) => {
    const name = cookie.split('=')[0].trim();
    if (name.startsWith('sb-') || name.includes('supabase')) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
    }
  });

  try {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        sessionStorage.removeItem(key);
      }
    });
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('sb-') || key.includes('supabase')) {
        localStorage.removeItem(key);
      }
    });
  } catch {
    // Ignore storage errors
  }

  supabase.auth.signOut().catch(() => {});
}

/**
 * Sign out without awaiting Supabase (which can hang).
 * Clears session and redirects immediately.
 */
export function signOutClient(redirectTo = '/') {
  clearAuthSession();
  window.location.href = redirectTo;
}
