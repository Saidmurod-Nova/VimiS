import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { listProductCategories } from "@/lib/supabaseCatalog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function ProductCategorySelect({ businessId, value, onChange, label = "Kategoriya" }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!businessId) { setItems([]); setLoading(false); return; }
    setLoading(true);
    (import.meta.env.VITE_AUTH_PROVIDER === "supabase"
      ? listProductCategories(businessId)
      : base44.entities.ProductCategory.filter({ business_id: businessId }))
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [businessId]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger className="h-12 rounded-xl border-transparent bg-secondary/70">
          {loading ? (
            <span className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Yuklanmoqda...</span>
          ) : (
            <SelectValue placeholder="Kategoriyani tanlang" />
          )}
        </SelectTrigger>
        <SelectContent>
          {items.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">Kategoriyalar yo'q</div>
          ) : (
            items.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)
          )}
        </SelectContent>
      </Select>
    </div>
  );
}