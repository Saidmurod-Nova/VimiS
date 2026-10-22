import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Save, UserRound, Phone, Mail, AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/vimi/PageHeader";
import { PrimaryButton } from "@/components/vimi/VimiButton";
import { TextInput } from "@/components/vimi/VimiInput";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { formatUzbekPhone, isValidUzbekPhone, normalizeUzbekPhone } from "@/lib/phone";

export default function ProfileEdit() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setFullName(user?.full_name || "");
    setPhone(user?.phone || "");
  }, [user?.full_name, user?.phone]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();
    if (cleanName.length < 2) {
      setError("Ism kamida 2 ta belgidan iborat bo‘lishi kerak.");
      return;
    }
    if (!isValidUzbekPhone(cleanPhone)) {
      setError("Telefon raqamini +998 formatida to‘liq kiriting.");
      return;
    }

    setSaving(true);
    try {
      await updateUser({ full_name: cleanName, phone: normalizeUzbekPhone(cleanPhone) });
      toast({ title: "Profil saqlandi", description: "Ma’lumotlaringiz yangilandi." });
      navigate("/profile");
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Profilni saqlab bo‘lmadi. Qayta urinib ko‘ring.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl animate-fade-in space-y-6">
      <PageHeader title="Profilni tahrirlash" subtitle="Ism va telefon raqamingizni yangilang." backTo="/profile" />
      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border bg-card p-4 sm:p-6">
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="profile-full-name">To‘liq ism</Label>
          <TextInput id="profile-full-name" icon={UserRound} autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-phone">Telefon raqami</Label>
          <TextInput id="profile-phone" icon={Phone} type="tel" inputMode="tel" autoComplete="tel" placeholder="+998 90 123 45 67" value={phone} onChange={(e) => setPhone(formatUzbekPhone(e.target.value))} maxLength={17} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-email">Email</Label>
          <TextInput id="profile-email" icon={Mail} value={user?.email || ""} readOnly disabled aria-describedby="profile-email-note" />
          <p id="profile-email-note" className="text-xs text-muted-foreground">Email ushbu sahifada o‘zgartirilmaydi.</p>
        </div>
        <PrimaryButton type="submit" className="h-12 w-full gap-2" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saqlanmoqda…" : "O‘zgarishlarni saqlash"}
        </PrimaryButton>
      </form>
    </div>
  );
}
