import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getAuthErrorMessage, isSupabaseConfigured, supabase } from "@/lib/supabase";
import { signInWithGoogleSupabase } from "@/lib/supabaseOAuth";
import { Label } from "@/components/ui/label";
import { User, Phone, Mail, Lock, Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";
import { safeReturnTo } from "@/lib/authReturnTo";
import { PrimaryButton, SecondaryButton } from "@/components/vimi/VimiButton";
import { TextInput } from "@/components/vimi/VimiInput";
import { formatUzbekPhone, isValidUzbekPhone, normalizeUzbekPhone } from "@/lib/phone";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const useSupabaseAuth = import.meta.env.VITE_AUTH_PROVIDER === "supabase";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Parollar mos kelmadi");
      return;
    }
    if (!isValidUzbekPhone(phone)) {
      setError("Telefon raqamini +998 formatida to‘liq kiriting.");
      return;
    }
    setLoading(true);
    try {
      if (useSupabaseAuth) {
        if (!isSupabaseConfigured) throw new Error("Supabase konfiguratsiyasi topilmadi.");
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, phone: normalizeUzbekPhone(phone) } },
        });
        if (signUpError) throw signUpError;
        if (data.session) {
            const { error: profileError } = await supabase.from('profiles')
              .update({ full_name: fullName.trim(), phone: normalizeUzbekPhone(phone) })
              .eq('id', data.user.id);
            if (profileError) throw profileError;
          window.location.assign(safeReturnTo());
        } else {
          setShowOtp(true);
        }
      } else {
        await base44.auth.register({ email, password });
        setShowOtp(true);
      }
    } catch (err) {
        setError(getAuthErrorMessage(err, "Ro‘yxatdan o‘tish amalga oshmadi. Ma’lumotlarni tekshirib qayta urinib ko‘ring."));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      if (useSupabaseAuth) {
        const { data, error: verifyError } = await supabase.auth.verifyOtp({ email, token: otpCode, type: 'signup' });
        if (verifyError) throw verifyError;
        if (data.user) {
          const { error: profileError } = await supabase.from('profiles')
            .update({ full_name: fullName.trim(), phone: normalizeUzbekPhone(phone) })
            .eq('id', data.user.id);
          if (profileError) throw profileError;
        }
        window.location.assign(safeReturnTo());
      } else {
        const result = await base44.auth.verifyOtp({ email, otpCode });
        if (result?.access_token) base44.auth.setToken(result.access_token);
        try { await base44.auth.updateMe({ full_name: fullName, phone: normalizeUzbekPhone(phone) }); } catch (_) {}
        window.location.href = safeReturnTo();
      }
    } catch (err) {
        setError(getAuthErrorMessage(err, "Tasdiqlash kodi noto‘g‘ri yoki muddati tugagan."));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      if (useSupabaseAuth) {
        const { error: resendError } = await supabase.auth.resend({ type: 'signup', email });
        if (resendError) throw resendError;
      } else {
        await base44.auth.resendOtp(email);
      }
      toast({ title: "Kod yuborildi", description: "Emailingizni tekshiring." });
    } catch (err) {
        setError(getAuthErrorMessage(err, "Kodni qayta yuborib bo‘lmadi. Birozdan keyin qayta urinib ko‘ring."));
    }
  };

  const handleGoogle = async () => {
    setError("");
    try {
      if (useSupabaseAuth) await signInWithGoogleSupabase(safeReturnTo());
      else base44.auth.loginWithProvider("google", safeReturnTo());
    } catch (err) {
      setError(err?.message || "Google orqali kirish amalga oshmadi");
    }
  };

  if (showOtp) {
    return (
      <AuthLayout title="Emailni tasdiqlang" subtitle={`Biz ${email} ga kod yubordik`}>
        {error && <div className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        <div className="mb-6 flex justify-center">
          <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <PrimaryButton className="h-12 w-full" onClick={handleVerify} disabled={loading || otpCode.length < 6}>
          {loading ? (
            <>
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              Tasdiqlanmoqda...
            </>
          ) : (
            "Tasdiqlash"
          )}
        </PrimaryButton>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Kod kelmadi?{" "}
          <button onClick={handleResend} className="font-medium text-primary hover:underline">
            Qayta yuborish
          </button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Hisob yaratish"
      subtitle="Boshlash uchun ro'yxatdan o'ting"
      footer={
        <>
          Hisobingiz bormi?{" "}
          <Link
            to={"/login" + (safeReturnTo() !== "/" ? "?returnTo=" + encodeURIComponent(safeReturnTo()) : "")}
            className="font-medium text-primary hover:underline"
          >
            Kirish
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
          <Label htmlFor="fullName">To'liq ism</Label>
          <TextInput
            id="fullName"
            autoComplete="name"
            autoFocus
            placeholder="Ism Familiya"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            icon={User}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefon raqam</Label>
          <TextInput
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+998 90 123 45 67"
            value={phone}
            onChange={(e) => setPhone(formatUzbekPhone(e.target.value))}
            icon={Phone}
            maxLength={17}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <TextInput
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={Mail}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Parol</Label>
          <TextInput
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={Lock}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Parolni tasdiqlang</Label>
          <TextInput
            id="confirm"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={Lock}
            required
          />
        </div>
        <PrimaryButton type="submit" className="h-12 w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              Yaratilmoqda...
            </>
          ) : (
            "Ro'yxatdan o'tish"
          )}
        </PrimaryButton>
      </form>
    </AuthLayout>
  );
}