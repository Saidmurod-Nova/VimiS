import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { isSupabaseMode } from "@/lib/supabase";
import { upsertInventoryForBranch } from "@/lib/supabaseCatalog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { PrimaryButton } from "@/components/vimi/VimiButton";

// Assign a product to selected branches (creates inventory with stock 0).
export default function BranchAssignSheet({ open, onOpenChange, product, branches, inventoryByBranch = {}, onAssigned }) {
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const submit = async (e) => {
    e.preventDefault();
    if (selected.length === 0) { setError("Kamida bitta filial tanlang"); return; }
    setError("");
    setSaving(true);
    try {
      for (const branchId of selected) {
        if (isSupabaseMode) await upsertInventoryForBranch({ branchId, productId: product.id, stock: 0, isAvailable: true });
        else await base44.functions.invoke("upsertInventory", {
          branch_id: branchId, product_id: product.id, stock: 0, is_available: true
        });
      }
      onAssigned?.();
      onOpenChange(false);
      setSelected([]);
    } catch (err) {
      setError(err.response?.data?.error || "Filiallarga qo'shilmadi");
    } finally { setSaving(false); }
  };

  if (!product) return null;
  const available = (branches || []).filter((b) => b.is_active && !inventoryByBranch[b.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Mahsulotni filiallarga qo'shish</DialogTitle>
          <DialogDescription>{product.name}</DialogDescription>
        </DialogHeader>
        {available.length === 0 ? (
          <p className="rounded-xl bg-secondary/60 p-4 text-sm text-muted-foreground">Barcha faol filiallarda allaqachon qo'shilgan.</p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              {available.map((b) => (
                <label key={b.id} className="flex items-center gap-3 rounded-xl border border-border p-3 cursor-pointer">
                  <Checkbox checked={selected.includes(b.id)} onCheckedChange={() => toggle(b.id)} />
                  <span className="text-sm font-medium">{b.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{b.city}</span>
                </label>
              ))}
            </div>
            {error && <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
            <DialogFooter>
              <PrimaryButton type="submit" className="h-11 w-full" disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Qo'shilmoqda...</> : "Saqlash"}
              </PrimaryButton>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}