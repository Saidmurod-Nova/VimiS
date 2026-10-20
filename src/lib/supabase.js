import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseMode = import.meta.env.VITE_AUTH_PROVIDER === 'supabase';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseKey && !supabaseUrl.includes('YOUR_PROJECT_REF') && !supabaseKey.startsWith('YOUR_')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function getAuthProvider() {
  return import.meta.env.VITE_AUTH_PROVIDER === 'supabase' ? 'supabase' : 'base44';
} 

export function getAuthErrorMessage(error, fallback = 'Xatolik yuz berdi.') {
  if (!error) return fallback;
  const message = typeof error === 'string' ? error : error.message || error.code || '';
  const normalized = String(message).toLowerCase();
  if (normalized.includes('invalid login credentials') || normalized.includes('invalid_credentials')) return 'Email yoki parol noto‘g‘ri.';
  if (normalized.includes('email not confirmed')) return 'Email manzilingizni tasdiqlang.';
  if (normalized.includes('already registered') || normalized.includes('user_already_exists')) return 'Bu email bilan hisob avval ro‘yxatdan o‘tgan.';
  if (normalized.includes('password should be') || normalized.includes('weak_password')) return 'Parol xavfsizlik talablariga javob bermaydi.';
  if (normalized.includes('otp') || normalized.includes('token has expired') || normalized.includes('invalid token')) return 'Tasdiqlash havolasi yoki kodi yaroqsiz yoki muddati tugagan.';
  if (normalized.includes('rate limit') || normalized.includes('too many requests')) return 'Urinishlar soni oshib ketdi. Birozdan keyin qayta urinib ko‘ring.';
  if (normalized.includes('fetch') || normalized.includes('network')) return 'Tarmoq bilan bog‘lanib bo‘lmadi. Internet aloqasini tekshiring.';
  return fallback;
}

export function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase sozlanmagan. .env.local faylida VITE_SUPABASE_URL va VITE_SUPABASE_PUBLISHABLE_KEY qiymatlarini kiriting.');
  }
  return supabase;
}
