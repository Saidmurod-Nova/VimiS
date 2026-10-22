import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getAuthErrorMessage, isSupabaseConfigured, supabase } from "@/lib/supabase";
import { signInWithGoogleSupabase } from "@/lib/supabaseOAuth";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, ScanLine } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { safeReturnTo } from "@/lib/authReturnTo";
import { PrimaryButton, SecondaryButton } from "@/components/vimi/VimiButton";
import { TextInput } from "@/components/vimi/VimiInput";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const returnTo = safeReturnTo();
  const useSupabaseAuth = import.meta.env.VITE_AUTH_PROVIDER === "supabase";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (useSupabaseAuth) {
        if (!isSupabaseConfigured) throw new Error("Supabase konfiguratsiyasi topilmadi.");
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        window.location.assign(returnTo);
      } else {
        await base44.auth.loginViaEmailPassword(email, password);
        window.location.href = returnTo;
      }
    } catch (err) {
        setError(getAuthErrorMessage(err, "Kirish amalga oshmadi. Ma’lumotlarni tekshirib, qayta urinib ko‘ring."));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    try {
      if (useSupabaseAuth) await signInWithGoogleSupabase(returnTo);
      else base44.auth.loginWithProvider("google", returnTo);
    } catch (err) {
        setError(getAuthErrorMessage(err, "Google orqali kirish amalga oshmadi. Qayta urinib ko‘ring."));
    }
  };

  return (
    <AuthLayout
      title="Xush kelibsiz"
      subtitle="Hisobingizga kiring"
      footer={
        <>
          Hisobingiz yo'qmi?{" "}
          <Link
            to={"/register" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")}
            className="font-medium text-primary hover:underline"
          >
            Ro'yxatdan o'tish
          </Link>
        </>
      }
    >
      <SecondaryButton className="h-12 w-full" onClick={handleGoogle}>
        <GoogleIcon className="mr-2 w-5 h-5" />
        Google bilan davom etish
      </SecondaryButton>


      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">yoki</span>
        </div>
      </div>

      {error && <div className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <TextInput
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={Mail}
            required
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Parol</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Parolni unutdingiz?
            </Link>
          </div>
          <TextInput
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={Lock}
            required
            />
        </div>
        <PrimaryButton type="submit" className="h-12 w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              Kirilmoqda...
            </>
          ) : (
            "Kirish"
          )}
        </PrimaryButton>
          {useSupabaseAuth && (
            <Link
              to={`/login/scan${returnTo !== "/" ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`}
              className="mt-5 flex items-center justify-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <ScanLine className="h-4 w-4" aria-hidden="true" />
              Skaner qilib kirish
            </Link>
          )}
      </form>
    </AuthLayout>
  );
}