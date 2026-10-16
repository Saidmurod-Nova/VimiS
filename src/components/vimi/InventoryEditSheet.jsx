import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { PrimaryButton } from "@/components/vimi/VimiButton";
import Price from "@/components/vimi/Price";
import { parsePrice } from "@/lib/inventory";
import { upsertInventoryForBranch } from "@/lib/supabaseCatalog";

export default function InventoryEditSheet({ open, onOpenChange, branch, product, inventory, onSaved }) {
  const [stock, setStock] = useState("0");
  const [override, setOverride] = useState("");
  const [available, setAvailable] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setStock(String(inventory?.stock ?? 0));
      setOverride(inventory?.price_override != null ? String(inventory.price_override) : "");
      setAvailable(inventory ? inventory.is_available !== false : true);
      setError("");
    }
  }, [open, inventory]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const s = parsePrice(stock);
    if (s === null || s < 0) { setError("Stock noto'g'ri"); return; }
    const ov = override.trim() === "" ? null : parsePrice(override);
    if (ov !== null && ov < 0) { setError("Narx noto'g'ri"); return; }
    setSaving(true);
    try {
      let savedInventory;
      if (import.meta.env.VITE_AUTH_PROVIDER === "supabase") {
        savedInventory = await upsertInventoryForBranch({ branchId: branch.id, productId: product.id, stock: s, priceOverride: ov, isAvailable: available });
      } else {
        const res = await base44.functions.invoke("upsertInventory", {
          branch_id: branch.id,
          product_id: product.id,
          stock: s,
          price_override: ov,
          is_available: available
        });
        savedInventory = res.data.inventory;
      }
      onSaved?.(savedInventory);
      onOpenChange(false);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Stockni yangilab bo'lmadi");
    } finally { setSaving(false); }
  };

  if (!branch || !product) return null;
  const effective = override.trim() !== "" && parsePrice(override) !== null ? parsePrice(override) : product.price;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Stockni yangilash</DialogTitle>
          <DialogDescription>{product.name} · {branch.name}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Stock (dona)</Label>
            <Input type="number" min="0" inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} className="h-12 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Narx (ixtiyoriy — so'm)</Label>
            <Input type="number" min="0" inputMode="numeric" value={override} onChange={(e) => setOverride(e.target.value)} placeholder={`${product.price} (standart narx)`} className="h-12 rounded-xl" />
            <p className="text-xs text-muted-foreground">Bo'sh qoldirsangiz, biznes narxidan foydalaniladi.</p>
            <div className="rounded-xl bg-secondary/60 p-2.5"><span className="text-xs text-muted-foreground">Mijoz ko'radi: </span><Price value={effective} size="sm" className="inline-flex" /></div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <div><p className="text-sm font-medium">Sotuvda mavjud</p><p className="text-xs text-muted-foreground">Filialda sotishni yoqish/o'chirish</p></div>
            <Switch checked={available} onCheckedChange={setAvailable} />
          </div>
          {error && <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          <DialogFooter>
            <PrimaryButton type="submit" className="h-11 w-full" disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saqlanmoqda...</> : "Saqlash"}
            </PrimaryButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}