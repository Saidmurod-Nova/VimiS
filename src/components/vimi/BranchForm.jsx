import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import GeoSelect from "./GeoSelect";
import MapPicker from "./MapPicker";
import { TextInput } from "./VimiInput";
import { PrimaryButton } from "./VimiButton";
import { Label } from "@/components/ui/label";

export default function BranchForm({ initial, loading, onSubmit, submitLabel }) {
  const [name, setName] = useState(initial?.name || "");
  const [geo, setGeo] = useState(null);
  const [address, setAddress] = useState(initial?.address || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [workingHours, setWorkingHours] = useState(initial?.working_hours || "09:00 — 22:00");
  const [coords, setCoords] = useState(initial?.latitude ? { lat: initial.latitude, lng: initial.longitude } : null);
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) { setError("Filial nomi majburiy"); return; }
    if (!coords) { setError("Joylashuvni tanlang"); return; }
    setError("");
    onSubmit({ name: name.trim(), geo, address, phone, working_hours: workingHours, latitude: coords.lat, longitude: coords.lng });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2"><Label>Filial nomi</Label><TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Masalan: Artel Registon" autoFocus required /></div>
      <GeoSelect onChange={setGeo} />
      <div className="space-y-2"><Label>Manzil</Label><TextInput value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Ko'cha, uy" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2"><Label>Telefon</Label><TextInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 ..." /></div>
        <div className="space-y-2"><Label>Ish vaqti</Label><TextInput value={workingHours} onChange={(e) => setWorkingHours(e.target.value)} placeholder="09:00 — 22:00" /></div>
      </div>
      <div className="space-y-2"><Label>Joylashuv</Label><MapPicker value={coords} onChange={setCoords} /><p className="text-xs text-muted-foreground">Xaritada bosib yoki pinni sudrab tanlang.</p></div>
      {error && <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <PrimaryButton type="submit" className="h-12 w-full" disabled={loading}>
        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saqlanmoqda...</> : submitLabel}
      </PrimaryButton>
    </form>
  );
}