import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapPin, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import PageHeader from "@/components/vimi/PageHeader";
import { TextInput } from "@/components/vimi/VimiInput";
import { PrimaryButton } from "@/components/vimi/VimiButton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import MapPicker from "@/components/vimi/MapPicker";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

export default function AddressEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
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
        const a = await base44.entities.Address.get(id);
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
      await base44.functions.invoke("saveAddress", {
        address_id: id || undefined, title: t, address: a,
        latitude: lat, longitude: lng, is_default: isDefault
      });
      toast({ title: id ? "Manzil yangilandi" : "Manzil qo'shildi" });
      navigate("/addresses");
    } catch (err) {
      toast({ title: err?.response?.data?.error || "Saqlanmadi", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="space-y-4">
      <PageHeader title={id ? "Manzilni tahrirlash" : "Yangi manzil"} backTo="/addresses" />
      <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader title={id ? "Manzilni tahrirlash" : "Yangi manzil"} backTo="/addresses" />
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Sarlavha</Label>
          <TextInput placeholder="Uy, Ish..." value={title} onChange={(e) => setTitle(e.target.value)} maxLength={50} />
        </div>
        <div className="space-y-1.5">
          <Label>Manzil</Label>
          <Textarea placeholder="Viloyat, shahar, ko'cha, uy..." value={address} onChange={(e) => setAddress(e.target.value)} className="min-h-[90px] rounded-xl bg-secondary/70" />
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-3">
          <span className="text-sm font-medium">Asosiy manzil qilish</span>
          <Switch checked={isDefault} onCheckedChange={setIsDefault} />
        </div>
        <button type="button" onClick={() => setShowMap((s) => !s)} className="inline-flex items-center gap-1 text-sm font-medium text-primary">
          <MapPin className="h-4 w-4" />{showMap ? "Xaritani yashirish" : "Xaritadan tanlash (ixtiyoriy)"}
          {showMap ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showMap && <MapPicker value={coords} onChange={setCoords} />}
        {coords && <p className="text-xs text-muted-foreground">Tanlangan: {Number(coords.lat).toFixed(4)}, {Number(coords.lng).toFixed(4)}</p>}
        <PrimaryButton type="submit" disabled={saving} className="h-12 w-full gap-2">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Saqlanmoqda...</> : "Saqlash"}
        </PrimaryButton>
      </form>
    </div>
  );
}