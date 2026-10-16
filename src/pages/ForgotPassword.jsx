import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const useSupabaseAuth = import.meta.env.VITE_AUTH_PROVIDER === "supabase";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (useSupabaseAuth) {
        if (!isSupabaseConfigured) throw new Error("Supabase konfiguratsiyasi topilmadi.");
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (resetError) throw resetError;
      } else {
        await base44.auth.resetPasswordRequest(email);
      }
      setSent(true);
    } catch (err) {
        setError(getAuthErrorMessage(err, "Tiklash xatini yuborib bo‘lmadi. Emailni tekshiring va qayta urinib ko‘ring."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={Mail}
      title="Parolni yangilash"
      subtitle="Emailingizga tiklash havolasini yuboramiz"
      footer={
        <Link to="/login" className="text-primary font-medium hover:underline">
          <ArrowLeft className="w-3 h-3 inline mr-1" />Kirish sahifasiga qaytish
        </Link>
      }
    >
      {error && <div className="mb-4 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      {sent ? (
        <p className="text-sm text-foreground text-center">
          Hisob mavjud bo‘lsa, emailingizga tiklash havolasi yuboriladi.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Yuborilmoqda...
              </>
            ) : (
              "Havola yuborish"
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
