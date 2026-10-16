import { requireSupabase } from '@/lib/supabase';

/**
 * Starts Google OAuth in Supabase and redirects back to the app callback route.
 * The callback page reads the session and then routes the user back to the
 * original page. Keep the final redirect URL same-origin and explicit.
 */
export async function signInWithGoogleSupabase(returnTo = '/') {
  const client = requireSupabase();
  const safeReturnTo = (() => {
    try {
      const candidate = new URL(returnTo, window.location.origin);
      if (candidate.origin !== window.location.origin) return '/';
      const path = candidate.pathname + candidate.search;
      return path.startsWith('/') && !path.startsWith('//') && !path.includes('\\') ? path : '/';
    } catch {
      return '/';
    }
  })();

  const callbackUrl = new URL('/auth/callback', window.location.origin);
  callbackUrl.searchParams.set('returnTo', safeReturnTo);

  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl.toString(),
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  });

  if (error) throw error;
}
