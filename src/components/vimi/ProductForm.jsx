import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import PageHeader from "@/components/vimi/PageHeader";
import ProductImageUpload from "@/components/vimi/ProductImageUpload";
import ProductCategorySelect from "@/components/vimi/ProductCategorySelect";
import { TextInput } from "@/components/vimi/VimiInput";
import { PrimaryButton } from "@/components/vimi/VimiButton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import Price from "@/components/vimi/Price";
import { parsePrice } from "@/lib/inventory";

// Shared create/edit form. Handles name, description, image, category, price.
// Stock and active status are managed elsewhere (inventory + archive action).
export default function ProductForm({ businessId, initial, onSubmit, submitLabel = "Mahsulot yaratish", backTo }) {
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [categoryId, setCategoryId] = useState(initial?.category_id || "");
  const [imageUrl, setImageUrl] = useState(initial?.image_url || "");
  const [price, setPrice] = useState(initial?.price != null ? String(initial.price) : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const previewPrice = parsePrice(price);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Mahsulot nomi majburiy"); return; }
    const numPrice = parsePrice(price);
    if (numPrice === null || numPrice < 0) { setError("Narx noto'g'ri"); return; }
    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        category_id: categoryId || null,
        image_url: imageUrl || null,
        price: numPrice
      });
    } catch (err) {
      setError(err.message || "Ma'lumotlarni tekshirib qayta urinib ko'ring");
    } finally { setLoading(false); }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title={submitLabel} backTo={backTo} />
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2"><Label>Mahsulot rasmi</Label><ProductImageUpload value={imageUrl} onChange={setImageUrl} /></div>
        <div className="space-y-2"><Label>Mahsulot nomi</Label><TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Masalan: iPhone 17 Pro" autoFocus required /></div>
        <div className="space-y-2"><Label>Tavsif</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mahsulot haqida qisqacha" rows={3} className="rounded-xl" /></div>
        <ProductCategorySelect businessId={businessId} value={categoryId} onChange={setCategoryId} />
        <div className="space-y-2">
          <Label>Narx (so'm)</Label>
          <Input type="number" min="0" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" className="h-12 rounded-xl" required />
          {previewPrice !== null && <div className="text-sm text-muted-foreground">Ko'rinish: <Price value={previewPrice} size="sm" className="inline-flex" /></div>}
        </div>
        {error && <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
        <PrimaryButton type="submit" className="h-12 w-full" disabled={loading}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saqlanmoqda...</> : submitLabel}
        </PrimaryButton>
      </form>
    </div>
  );
}