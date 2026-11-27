import React, { useEffect, useId, useState } from "react";
import { base44 } from "@/api/base44Client";
import { isSupabaseMode } from "@/lib/supabase";
import { listPublicCategories } from "@/lib/supabaseCatalog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function CategorySelect({ value, onChange, label = "Kategoriya" }) {
  const id = useId();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const categories = isSupabaseMode
          ? await listPublicCategories()
          : await base44.entities.Category.list();
        if (active) setItems((categories || []).filter((category) => !category.parent_id));
      } catch (loadError) {
        console.error("Kategoriyalarni yuklab bo‘lmadi.", loadError);
        if (active) setError(loadError?.message || "Kategoriyalarni yuklab bo‘lmadi.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [reloadKey]);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label} <span aria-hidden="true">*</span></Label>
      {error ? (
        <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
          <p role="alert">{error}</p>
          <button type="button" className="mt-2 font-medium underline" onClick={() => setReloadKey((key) => key + 1)}>
            Qayta urinish
          </button>
        </div>
      ) : (
        <Select
          value={value}
          disabled={loading || items.length === 0}
          onValueChange={(selectedId) => {
            const item = items.find((category) => category.id === selectedId);
            onChange(selectedId, item?.name || "");
          }}
        >
          <SelectTrigger id={id} aria-required="true" className="h-12 rounded-xl border-transparent bg-secondary/70">
            <SelectValue placeholder={loading ? "Yuklanmoqda..." : "Kategoriyani tanlang"} />
          </SelectTrigger>
          <SelectContent>
            {items.map((category) => (
              <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}