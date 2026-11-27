import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { isSupabaseConfigured, supabase, getAuthProvider, getAuthErrorMessage } from '@/lib/supabase';
import { registerCurrentSession } from '@/lib/userSessions';

/**
 * @typedef {object} AuthProfile
 * @property {string} id
 * @property {string} email
 * @property {string} full_name
 * @property {string} phone
 * @property {string} avatar
 * @property {string} role
 * @property {string | null} selected_location
 * @property {Record<string, any>} data
 */

/**
 * @typedef {object} AuthErrorState
 * @property {string} type
 * @property {string} message
 */

/**
 * @typedef {object} AuthContextValue
 * @property {AuthProfile | null} user
 * @property {boolean} isAuthenticated
 * @property {boolean} isLoadingAuth
 * @property {boolean} isLoadingPublicSettings
 * @property {AuthErrorState | null} authError
 * @property {Record<string, any> | null} appPublicSettings
 * @property {boolean} authChecked
 * @property {(shouldRedirect?: boolean) => Promise<void>} logout
 * @property {() => void} navigateToLogin
 * @property {() => Promise<void>} checkUserAuth
 * @property {() => Promise<void>} checkAppState
 * @property {(updates?: Record<string, any>) => Promise<void>} updateUser
 */

const defaultAuthContext = /** @type {AuthContextValue} */ ({
  user: null,
  isAuthenticated: false,
  isLoadingAuth: true,
  isLoadingPublicSettings: true,
  authError: null,
  appPublicSettings: null,
  authChecked: false,
  logout: async () => {},
  navigateToLogin: () => {},
  checkUserAuth: async () => {},
  checkAppState: async () => {},
  updateUser: async () => {},
});

const AuthContext = createContext(defaultAuthContext);
const useSupabaseAuth = getAuthProvider() === 'supabase';

/**
 * @param {any} authUser
 * @param {Record<string, any>} [profile={}] 
 * @returns {AuthProfile | null}
 */
function profileUser(authUser, profile = {}) {
  if (!authUser) return null;
  const metadata = authUser.user_metadata || {};
  return {
    id: authUser.id,
    email: authUser.email || '',
    full_name: profile.full_name || metadata.full_name || metadata.name || '',
    phone: profile.phone || metadata.phone || '',
    avatar: profile.avatar || metadata.avatar_url || metadata.picture || '',
    role: profile.role || 'user',
    selected_location: profile.selected_location || null,
    data: { ...profile, phone: profile.phone || metadata.phone || '' },
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(/** @type {AuthProfile | null} */ (null));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(/** @type {AuthErrorState | null} */ (null));
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(/** @type {Record<string, any> | null} */ (null));

  /** @param {any} authUser */
  const loadSupabaseUser = useCallback(async (authUser) => {
    if (!authUser || !supabase) {
      setUser(null);
      setIsAuthenticated(false);
      return;
    }
    let profile = {};
    const { data, error } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
    if (error) throw new Error('Profil ma’lumotlarini yuklab bo‘lmadi. Qayta urinib ko‘ring.');
    if (data) profile = data;
    setUser(profileUser(authUser, profile));
    setIsAuthenticated(true);
  }, []);

  const checkUserAuth = useCallback(async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      if (useSupabaseAuth) {
        if (!isSupabaseConfigured || !supabase) {
          throw new Error('Supabase URL yoki publishable key sozlanmagan.');
        }
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!session?.user) {
          setUser(null);
          setIsAuthenticated(false);
          return;
        }
        await loadSupabaseUser(session.user);
      } else {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      if (error?.status === 403 && error?.data?.extra_data?.reason === 'user_not_registered') {
        setAuthError({ type: 'user_not_registered', message: getAuthErrorMessage(error, 'Foydalanuvchi ro‘yxatdan o‘tmagan.') });
      } else if (error?.status === 401 || error?.status === 403 || error?.name === 'AuthSessionMissingError') {
        setAuthError({ type: 'auth_required', message: 'Kirish kerak. Iltimos, hisobga kiring.' });
      } else {
        setAuthError({ type: 'unknown', message: getAuthErrorMessage(error, 'Autentifikatsiyani tekshirib bo‘lmadi.') });
      }
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, [loadSupabaseUser, useSupabaseAuth]);

  const checkAppState = useCallback(async () => {
    setIsLoadingPublicSettings(true);
    setAuthError(null);
    if (useSupabaseAuth) {
      if (!isSupabaseConfigured) {
        setAuthError({ type: 'configuration', message: 'Supabase sozlanmagan.' });
        setIsLoadingAuth(false);
        setAuthChecked(true);
        setIsLoadingPublicSettings(false);
        return;
      }
      setAppPublicSettings({ provider: 'supabase' });
      await checkUserAuth();
      setIsLoadingPublicSettings(false);
      return;
    }
    try {
      const publicSettings = await base44.app.getPublicSettings();
      setAppPublicSettings(publicSettings);
      if (appParams.token) await checkUserAuth();
      else {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    } catch (error) {
      const reason = error?.data?.extra_data?.reason;
      setAuthError({
        type: error?.status === 403 && reason ? reason : 'unknown',
        message: getAuthErrorMessage(error, 'Ilovani yuklab bo‘lmadi. Qayta urinib ko‘ring.'),
      });
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } finally {
      setIsLoadingPublicSettings(false);
    }
  }, [checkUserAuth]);

  useEffect(() => {
    /** @type {{ unsubscribe?: () => void } | undefined} */
    let subscription;
    let sessionRegistration = Promise.resolve();
    if (useSupabaseAuth && isSupabaseConfigured && supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.refresh_token) {
          sessionRegistration = sessionRegistration
            .then(() => registerCurrentSession(session.refresh_token))
            .catch(() => {});
        }
        if (event === 'INITIAL_SESSION') return;
        try {
          if (!session?.user) {
            setUser(null);
            setIsAuthenticated(false);
            setAuthChecked(true);
            setIsLoadingAuth(false);
            return;
          }
          await loadSupabaseUser(session.user);
        } catch {
          setUser(null);
          setIsAuthenticated(false);
          setAuthError({ type: 'profile_error', message: 'Profil ma’lumotlarini yuklab bo‘lmadi. Qayta urinib ko‘ring.' });
        } finally {
          setAuthChecked(true);
          setIsLoadingAuth(false);
        }
      });
      subscription = data.subscription;
    }
    checkAppState();
    return () => subscription?.unsubscribe?.();
  }, [checkAppState, loadSupabaseUser, useSupabaseAuth]);

  const logout = async (shouldRedirect = true) => {
    if (useSupabaseAuth) {
      if (!supabase) {
        setUser(null);
        setIsAuthenticated(false);
        if (shouldRedirect) window.location.assign('/login');
        return;
      }
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(getAuthErrorMessage(error, 'Hisobdan chiqib bo‘lmadi. Qayta urinib ko‘ring.'));
      setUser(null);
      setIsAuthenticated(false);
      if (shouldRedirect) window.location.assign('/login');
      return;
    }
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) base44.auth.logout(window.location.href);
    else base44.auth.logout();
  };

  const updateUser = async (updates = {}) => {
    const allowedFields = ['full_name', 'phone', 'avatar', 'selected_location'];
    const safeUpdates = Object.fromEntries(
      allowedFields
        .filter((field) => Object.prototype.hasOwnProperty.call(updates, field))
        .map((field) => [field, typeof updates[field] === 'string' ? updates[field].trim() : updates[field]])
    );

    if (useSupabaseAuth) {
      if (!supabase || !user?.id) throw new Error('Profilni yangilash uchun hisobga kiring.');
      const { data, error } = await supabase
        .from('profiles')
        .update(safeUpdates)
        .eq('id', user.id)
        .select('id')
        .maybeSingle();
      if (error || !data) throw new Error('Profilni saqlab bo‘lmadi. Qayta urinib ko‘ring.');
      setUser((current) => current ? {
        ...current,
        ...safeUpdates,
        data: { ...current.data, ...safeUpdates },
      } : current);
      return;
    }

    const updatedUser = await base44.auth.updateMe(safeUpdates);
    setUser(updatedUser);
  };

  const navigateToLogin = () => {
    if (useSupabaseAuth) {
      const returnTo = window.location.pathname + window.location.search;
      window.location.assign('/login?returnTo=' + encodeURIComponent(returnTo));
    } else base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{
      user, isAuthenticated, isLoadingAuth, isLoadingPublicSettings, authError,
      appPublicSettings, authChecked, logout, updateUser, navigateToLogin, checkUserAuth, checkAppState,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
