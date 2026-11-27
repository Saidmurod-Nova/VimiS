import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getAuthErrorMessage, isSupabaseConfigured, supabase } from "@/lib/supabase";
import { signInWithGoogleSupabase } from "@/lib/supabaseOAuth";
import { Mail, Lock, Loader2, ShieldCheck } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import AuthLayout from "@/components/AuthLayout";
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

  /** @type {import("react").ChangeEventHandler<HTMLInputElement>} */
  const handleEmailChange = (event) => setEmail(event.currentTarget.value);
  /** @type {import("react").ChangeEventHandler<HTMLInputElement>} */
  const handlePasswordChange = (event) => setPassword(event.currentTarget.value);

  /** @param {import("react").FormEvent<HTMLFormElement>} e */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (useSupabaseAuth) {
        if (!isSupabaseConfigured || !supabase) throw new Error("Supabase konfiguratsiyasi topilmadi.");
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
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      if (useSupabaseAuth) await signInWithGoogleSupabase(returnTo);
      else await base44.auth.loginWithProvider("google", returnTo);
    } catch (err) {
      console.error("Google orqali kirish amalga oshmadi.", err);
      setError(getAuthErrorMessage(err, "Google orqali kirish amalga oshmadi. Qayta urinib ko‘ring."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Hisobingizga kiring"
      subtitle="Davom etish uchun email va parolingizni kiriting."
      footer={
        <>
          Hisobingiz yo'qmi?{" "}
          <Link to={"/register" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")} className="font-semibold text-primary hover:underline">
            Ro'yxatdan o'tish
          </Link>
        </>
      }
    >
      <div className="space-y-5">
        <SecondaryButton type="button" className="h-12 w-full" onClick={handleGoogle} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-5 w-5" />}
          {loading ? "Kirilmoqda..." : "Google bilan davom etish"}
        </SecondaryButton>

        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          YOKI EMAIL ORQALI
          <span className="h-px flex-1 bg-border" />
        </div>

        {error && <div role="alert" className="border-l-2 border-destructive bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-semibold text-foreground">Email</label>
            <TextInput
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={handleEmailChange}
              icon={Mail}
              className="w-full"
              inputClassName="text-sm"
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="password" className="text-sm font-semibold text-foreground">Parol</label>
              <Link to="/forgot-password" className="text-xs font-semibold text-primary hover:underline">
                Parolni unutdingiz?
              </Link>
            </div>
            <TextInput
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Parolingizni kiriting"
              value={password}
              onChange={handlePasswordChange}
              icon={Lock}
              className="w-full"
              inputClassName="text-sm"
              required
            />
          </div>
          <PrimaryButton
            type="submit"
            className="mt-2 h-11 w-full rounded-lg text-sm font-semibold"
            disabled={loading}
          >
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Kirilmoqda...</> : "Kirish"}
          </PrimaryButton>
        </form>
      </div>
      <p className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
        Hisobingiz xavfsiz himoyalangan
      </p>
    </AuthLayout>
  );
}