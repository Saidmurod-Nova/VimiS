import React from "react";
import { cn } from "@/lib/utils";
import { formatSoM, isLowStock } from "@/lib/inventory";

// Compact stock display with restrained low-stock emphasis.
export default function StockBadge({ stock = 0, className }) {
  const low = isLowStock(stock);
  const out = stock === 0;
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1 text-sm font-medium tabular-nums",
        low ? "text-warning" : out ? "text-muted-foreground" : "text-foreground",
        className
      )}
    >
      {low && <span className="text-xs font-normal text-warning">Kam qoldi ·</span>}
      {out && <span className="text-xs font-normal text-muted-foreground">Tugagan ·</span>}
      {formatSoM(stock)} dona
    </span>
  );
}