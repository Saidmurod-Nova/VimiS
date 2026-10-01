import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function CategorySelect({ value, onChange, label = "Kategoriya" }) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    base44.entities.Category.list().then(setItems).catch(() => {});
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