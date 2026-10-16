import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");
  const useSupabaseAuth = import.meta.env.VITE_AUTH_PROVIDER === "supabase";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Parollar mos kelmadi.");
      return;
    }
    setLoading(true);
    try {
      if (useSupabaseAuth) {
        if (!isSupabaseConfigured) throw new Error("Supabase konfiguratsiyasi topilmadi.");
        const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
        if (updateError) throw updateError;
        await supabase.auth.signOut();
        window.location.assign("/login");
      } else {
        await base44.auth.resetPassword({ resetToken, newPassword });
        window.location.href = "/login";
      }
    } catch (err) {
        setError(getAuthErrorMessage(err, "Parol yangilanmadi. Tiklash havolasini tekshirib, qayta urinib ko‘ring."));
    } finally {
      setLoading(false);
    }
  };

  if (!useSupabaseAuth && !resetToken) {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title="Noto‘g‘ri tiklash havolasi"
        subtitle="Havola yetishmayapti yoki yaroqsiz"
        footer={
          <Link to="/forgot-password" className="text-primary font-medium hover:underline">
            Yangi havola so‘rash
          </Link>
        }
      >
        <p className="text-sm text-foreground text-center">
          Foydalanilgan havola to‘liq emas. Yangi parol tiklash uchun email so‘rang.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={Lock}
      title="Yangi parol"
      subtitle="Yangi parolingizni kiriting"
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Yangi parol</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              autoFocus
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Parolni tasdiqlang</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Yangilanmoqda...
            </>
          ) : (
            "Parolni yangilash"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
