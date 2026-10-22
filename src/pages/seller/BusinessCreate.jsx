import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useBusiness } from "@/lib/BusinessContext";
import { generateUniqueStoreId } from "@/lib/storeId";
import { createBusiness as createBusinessSupabase, generateUniqueStoreIdSupabase } from "@/lib/supabaseCatalog";
import { Loader2 } from "lucide-react";
import PageHeader from "@/components/vimi/PageHeader";
import CategorySelect from "@/components/vimi/CategorySelect";
import LogoUpload from "@/components/vimi/LogoUpload";
import { TextInput } from "@/components/vimi/VimiInput";
import { PrimaryButton } from "@/components/vimi/VimiButton";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export default function BusinessCreate() {
  const navigate = useNavigate();
  const { refresh, selectBusiness } = useBusiness();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Biznes nomi majburiy"); return; }
    if (!categoryId) { setError("Kategoriya majburiy"); return; }
    setLoading(true);
    try {
      const useSupabase = import.meta.env.VITE_AUTH_PROVIDER === "supabase";
      const storeId = useSupabase ? await generateUniqueStoreIdSupabase(name) : await generateUniqueStoreId(base44, name);
      const payload = { name: name.trim(), description, logo_url: logoUrl, category_id: categoryId, category_name: categoryName, store_id: storeId, is_active: true };
      const business = useSupabase ? await createBusinessSupabase(payload) : await base44.entities.Business.create(payload);
      await refresh();
      selectBusiness(business.id);
      toast({ title: "Biznes yaratildi", description: `Store ID: ${storeId}` });
      navigate(`/seller/businesses/${business.id}`);
    } catch (err) {
      setError(err.message || "Biznes yaratilmadi");
    } finally { setLoading(false); }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Biznes yaratish" backTo="/seller" />
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2"><Label>Biznes nomi</Label><TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Masalan: Artel" autoFocus required /></div>
        <div className="space-y-2"><Label>Tavsif</Label><TextInput value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Biznes haqida qisqacha" /></div>
        <CategorySelect value={categoryId} onChange={(id, n) => { setCategoryId(id); setCategoryName(n); }} />
        <div className="space-y-2"><Label>Logo</Label><LogoUpload value={logoUrl} onChange={setLogoUrl} /></div>
        {error && <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        <PrimaryButton type="submit" className="h-12 w-full" disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Yaratilmoqda...</> : "Biznes yaratish"}
        </PrimaryButton>
      </form>
    </div>
  );
}