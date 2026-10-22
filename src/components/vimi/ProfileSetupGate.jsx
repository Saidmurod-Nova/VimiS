import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { MapPin, Phone, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { useBuyer } from "@/lib/BuyerContext";
import { formatUzbekPhone, isValidUzbekPhone, normalizeUzbekPhone } from "@/lib/phone";
import { PrimaryButton } from "@/components/vimi/VimiButton";
import { TextInput } from "@/components/vimi/VimiInput";
import { Label } from "@/components/ui/label";
import LocationSheet from "@/components/vimi/LocationSheet";

export default function ProfileSetupGate() {
  const { user, updateUser } = useAuth();
  const { setLocation } = useBuyer();
  const [phone, setPhone] = useState(() => formatUzbekPhone(user?.phone || ""));
  const [saving, setSaving] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [error, setError] = useState("");

  if (!user) return <Outlet />;

  const hasPhone = isValidUzbekPhone(user.phone);
  const hasLocation = Boolean(user.selected_location?.city || user.selected_location?.region || user.selected_location?.geo_area_id);
  if (hasPhone && hasLocation) return <Outlet />;

  const savePhone = async (event) => {
    event.preventDefault();
    setError("");
    if (!isValidUzbekPhone(phone)) {
      setError("Telefon raqamini +998 formatida to‘liq kiriting.");
      return;
    }
    setSaving(true);
    try {
      await updateUser({ phone: normalizeUzbekPhone(phone) });
    } catch (saveError) {
      setError(saveError?.message || "Telefon raqamini saqlab bo‘lmadi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <section className="w-full max-w-md animate-slide-up rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {hasPhone ? <MapPin className="h-5 w-5" aria-hidden="true" /> : <Phone className="h-5 w-5" aria-hidden="true" />}
        </span>
        <p className="text-xs font-semibold uppercase text-primary">Hisob sozlamalari</p>
        <h1 className="mt-2 font-display text-2xl font-bold">{hasPhone ? "Joylashuvingizni tanlang" : "Telefon raqamingizni kiriting"}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {hasPhone ? "Sizga yaqin do‘konlar va yetkazib berish manzillarini ko‘rsatish uchun hududingiz kerak." : "Buyurtmalar bo‘yicha bog‘lanish uchun telefon raqamingiz kerak."}
        </p>

        {!hasPhone ? (
          <form onSubmit={savePhone} className="mt-6 space-y-4">
            {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor="setup-phone">Telefon raqami</Label>
              <TextInput
                id="setup-phone"
                icon={Phone}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+998 90 123 45 67"
                value={phone}
                onChange={(event) => setPhone(formatUzbekPhone(event.target.value))}
                maxLength={17}
                autoFocus
                required
              />
            </div>
            <PrimaryButton type="submit" className="h-12 w-full" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Saqlanmoqda..." : "Davom etish"}
            </PrimaryButton>
          </form>
        ) : (
          <div className="mt-6 space-y-3">
            <PrimaryButton type="button" className="h-12 w-full" onClick={() => setLocationOpen(true)}>
              <MapPin className="h-4 w-4" />Joylashuvni aniqlash yoki tanlash
            </PrimaryButton>
            <p className="text-center text-xs text-muted-foreground">Joylashuv faqat siz tasdiqlaganidan keyin saqlanadi.</p>
          </div>
        )}
      </section>
      <LocationSheet open={locationOpen} onOpenChange={setLocationOpen} />
    </main>
  );
}