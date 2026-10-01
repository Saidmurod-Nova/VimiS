import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import CategorySelect from "../CategorySelect";
import LogoUpload from "../LogoUpload";
import { TextInput } from "../VimiInput";
import { PrimaryButton, SecondaryButton } from "../VimiButton";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import ConfirmDialog from "../ConfirmDialog";

export default function SettingsTab({ business, onUpdated }) {
  const { toast } = useToast();
  const [name, setName] = useState(business.name);
  const [description, setDescription] = useState(business.description || "");
  const [categoryId, setCategoryId] = useState(business.category_id || "");
  const [categoryName, setCategoryName] = useState(business.category_name || "");
  const [logoUrl, setLogoUrl] = useState(business.logo_url || "");
  const [saving, setSaving] = useState(false);
  const [confirmActive, setConfirmActive] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await base44.entities.Business.update(business.id, {
        name: name.trim(), description, category_id: categoryId, category_name: categoryName, logo_url: logoUrl
      });
      onUpdated(updated);
      toast({ title: "Sozlamalar saqlandi" });
    } catch { toast({ title: "Saqlanmadi", variant: "destructive" }); } finally { setSaving(false); }
  };

  const toggleActive = async () => {
    setConfirmActive(false); setSaving(true);
    try {
      const updated = await base44.entities.Business.update(business.id, { is_active: !business.is_active });
      onUpdated(updated);
      toast({ title: updated.is_active ? "Biznes faollashtirildi" : "Biznes faolsizlantirildi" });
    } catch {} finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={save} className="space-y-4">
        <div className="space-y-2"><Label>Biznes nomi</Label><TextInput value={name} onChange={(e) => setName(e.target.value)} required /></div>
        <div className="space-y-2"><Label>Tavsif</Label><TextInput value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        <CategorySelect value={categoryId} onChange={(cid, cn) => { setCategoryId(cid); setCategoryName(cn); }} />
        <div className="space-y-2"><Label>Logo</Label><LogoUpload value={logoUrl} onChange={setLogoUrl} /></div>
        <PrimaryButton type="submit" className="h-12 w-full" disabled={saving}>{saving ? "Saqlanmoqda..." : "Sozlamalarni saqlash"}</PrimaryButton>
      </form>
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Biznes holati</p>
            <p className="text-xs text-muted-foreground">{business.is_active ? "Faol — xaridorlar buyurtma berishi mumkin" : "Faol emas — yangi buyurtmalar to'xtatilgan"}</p>
          </div>
          <SecondaryButton className="h-9" onClick={() => setConfirmActive(true)} disabled={saving}>{business.is_active ? "Faolsizlantirish" : "Faollashtirish"}</SecondaryButton>
        </div>
      </div>
      <ConfirmDialog open={confirmActive} onOpenChange={setConfirmActive} title={business.is_active ? "Biznesni faolsizlantirmoqchimisiz?" : "Biznesni faollashtirmoqchimisiz?"} description={business.is_active ? "Xaridorlar yangi buyurtma berolmaydi. Tarixiy ma'lumotlar saqlanadi." : "Biznes yana xaridorlarga ochiladi."} confirmText={business.is_active ? "Faolsizlantirish" : "Faollashtirish"} destructive={business.is_active} onConfirm={toggleActive} />
    </div>
  );
}