import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { requireSupabase } from "@/lib/supabase";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function CategorySelect({ value, onChange, label = "Kategoriya" }) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    if (import.meta.env.VITE_AUTH_PROVIDER === "supabase") {
      const client = requireSupabase();
      client.from('categories').select('id,name').order('name').then(({ data, error }) => {
        if (!error) setItems(data || []);
        else console.error('Kategoriyalarni yuklab bo‘lmadi', error);
      });
    } else {
      base44.entities.Category.list().then(setItems).catch(() => {});
    }
  }, []);
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={(id) => {
        const item = items.find((c) => c.id === id);
        onChange(id, item?.name || "");
      }}>
        <SelectTrigger className="h-12 rounded-xl border-transparent bg-secondary/70">
          <SelectValue placeholder="Kategoriyani tanlang" />
        </SelectTrigger>
        <SelectContent>
          {items.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}