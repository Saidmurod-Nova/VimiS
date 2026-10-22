import React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function QuantitySelector({ value, onChange, min = 1, max = 99, size = "md" }) {
  const dims = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-secondary p-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="Kamaytirish"
        className={cn("inline-flex items-center justify-center rounded-full bg-background transition active:scale-95", dims)}
      >
        <Minus className="w-4 h-4" aria-hidden="true" />
      </button>
      <span className="min-w-6 text-center text-sm font-medium tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        aria-label="Ko'paytirish"
        className={cn("inline-flex items-center justify-center rounded-full bg-background transition active:scale-95", dims)}
      >
        <Plus className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}