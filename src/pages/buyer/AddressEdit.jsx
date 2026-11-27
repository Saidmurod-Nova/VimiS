import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { MapPin, Loader2, ChevronDown, ChevronUp, Home, MapPinned, Star } from "lucide-react";
import PageHeader from "@/components/vimi/PageHeader";
import { TextInput } from "@/components/vimi/VimiInput";
import { PrimaryButton } from "@/components/vimi/VimiButton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import MapPicker from "@/components/vimi/MapPicker";
import { base44 } from "@/api/base44Client";
import { isSupabaseMode } from "@/lib/supabase";
import { getAddress, saveAddress } from "@/lib/supabaseRelations";
import { useToast } from "@/components/ui/use-toast";

export default function AddressEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const returnTo = location.state?.returnTo === "/checkout" ? "/checkout" : "/addresses";
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState(null);
  const [isDefault, setIsDefault] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const a = isSupabaseMode ? await getAddress(id) : await base44.entities.Address.get(id);
        if (!a) throw new Error("Manzil topilmadi");
        setTitle(a.title || "");
        setAddress(a.address || "");
        setCoords(a.latitude != null && a.longitude != null ? { lat: a.latitude, lng: a.longitude } : null);
        setIsDefault(!!a.is_default);
        if (a.latitude != null && a.longitude != null) setShowMap(true);
      } catch (e) {
        toast({ title: e?.response?.data?.error || "Manzil topilmadi", variant: "destructive" });
        navigate("/addresses");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const t = title.trim();
    const a = address.trim();
    if (!t || !a) { toast({ title: "Sarlavha va manzil majburiy", variant: "destructive" }); return; }
    let lat = null, lng = null;
    if (coords) {
      lat = Number(coords.lat);
      lng = Number(coords.lng);
      if (Number.isNaN(lat) || lat < -90 || lat > 90 || Number.isNaN(lng) || lng < -180 || lng > 180) {
        toast({ title: "Koordinatalar noto'g'ri", variant: "destructive" });
        return;
      }
    }
    setSaving(true);
    try {
      const saved = isSupabaseMode
        ? await saveAddress({ addressId: id, title: t, address: a, latitude: lat, longitude: lng, isDefault })
        : (await base44.functions.invoke("saveAddress", {
          address_id: id || undefined, title: t, address: a,
          latitude: lat, longitude: lng, is_default: isDefault
        })).data?.address;
      toast({ title: id ? "Manzil yangilandi" : "Manzil qo'shildi" });
      navigate(returnTo, {
        replace: true,
        state: returnTo === "/checkout" ? { selectedAddressId: saved?.id } : undefined
      });
    } catch (err) {
      toast({ title: err?.response?.data?.error || err?.message || "Manzil saqlanmadi", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="space-y-4">
      <PageHeader title={id ? "Manzilni tahrirlash" : "Yangi manzil"} backTo={returnTo} />
      <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-3xl animate-fade-in space-y-5">
      <PageHeader title={id ? "Manzilni tahrirlash" : "Yangi manzil"} backTo={returnTo} />
      <form onSubmit={onSubmit} className="space-y-4">
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Home className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display font-semibold">Manzil ma’lumotlari</h2>
              <p className="mt-1 text-sm text-muted-foreground">Yetkazib berishda tanib olishingiz uchun nom va to‘liq manzilni kiriting.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="address-title">Manzil nomi</Label>
              <TextInput
                id="address-title"
                icon={Home}
                placeholder="Masalan: Uy, Ish yoki Ota-onam"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={50}
                autoComplete="address-line1"
                required
              />
              <p className="text-right text-xs text-muted-foreground">{title.length}/50</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="delivery-address">To‘liq manzil</Label>
              <Textarea
                id="delivery-address"
                placeholder="Viloyat, shahar yoki tuman, ko‘cha, uy va xonadon"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="min-h-24 rounded-xl bg-background"
                maxLength={500}
                autoComplete="street-address"
                required
              />
              <p className="text-xs text-muted-foreground">Kuryer manzilni aniq topishi uchun mo‘ljalni ham yozishingiz mumkin.</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MapPinned className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-display font-semibold">Xaritadagi nuqta</h2>
              <p className="mt-1 text-sm text-muted-foreground">Ixtiyoriy. Nuqta kuryerga manzilni aniqroq topishga yordam beradi.</p>
              {coords && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  Nuqta tanlangan
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowMap((shown) => !shown)}
              aria-expanded={showMap}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-border bg-secondary/60 px-3 text-sm font-medium transition hover:bg-secondary"
            >
              {showMap ? "Yopish" : coords ? "O‘zgartirish" : "Xaritadan tanlash"}
              {showMap ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
          {showMap && <div className="mt-4 border-t border-border pt-4"><MapPicker value={coords} onChange={setCoords} /></div>}
        </section>

        <section className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <span className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground">
              <Star className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold">Asosiy manzil</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">Buyurtmada avtomatik tanlanadi</span>
            </span>
          </span>
          <Switch checked={isDefault} onCheckedChange={setIsDefault} aria-label="Asosiy manzil qilib belgilash" />
        </section>

        <PrimaryButton type="submit" disabled={saving} className="h-12 w-full gap-2">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Saqlanmoqda...</> : "Saqlash"}
        </PrimaryButton>
      </form>
    </div>
  );
}