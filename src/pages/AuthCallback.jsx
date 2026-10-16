import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { getAuthErrorMessage, isSupabaseConfigured, supabase } from '@/lib/supabase';
import { safeReturnTo } from '@/lib/authReturnTo';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function finalizeAuth() {
      try {
        if (!isSupabaseConfigured || !supabase) {
          throw new Error('Supabase auth sozlanmagan.');
        }

        const params = new URLSearchParams(window.location.search);
        const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
        const hashParams = new URLSearchParams(hash);
        const code = params.get('code') || hashParams.get('code');
        const errorCode = params.get('error') || hashParams.get('error');
        if (errorCode) {
          throw new Error('Google orqali kirish bekor qilindi yoki yakunlanmadi. Qayta urinib ko‘ring.');
        }

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw new Error('Kirish sessiyasini tiklab bo‘lmadi. Qayta urinib ko‘ring.');
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw new Error('Kirish sessiyasini tekshirib bo‘lmadi. Qayta urinib ko‘ring.');
        if (!session?.user) {
          throw new Error('Sessiya tiklanmadi. Iltimos, qayta urinib ko‘ring.');
        }

        const dest = safeReturnTo();
        if (!cancelled) navigate(dest || '/', { replace: true });
      } catch (err) {
        if (!cancelled) {
          setError(getAuthErrorMessage(err, 'Google orqali kirish muvaffaqiyatsiz yakunlandi. Qayta urinib ko‘ring.'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    finalizeAuth();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="flex flex-col items-center gap-3 text-center text-sm text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Kirishni yakunlayapmiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border border-destructive/20 bg-card p-6 text-center shadow-sm">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
          <h1 className="text-xl font-semibold">Kirishda xatolik</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Login sahifasiga qaytish
          </button>
        </div>
      </div>
    );
  }

  return null;
}
