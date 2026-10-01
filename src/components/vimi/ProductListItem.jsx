import React from "react";
import { Image } from "@/components/ui/image";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import Price from "./Price";
import StockBadge from "./StockBadge";
import { formatSoM } from "@/lib/inventory";

export default function ProductListItem({ product, stockSummary, onClick, className }) {
  const summary = stockSummary || { totalStock: 0, branchCount: 0 };
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-3 text-left transition active:scale-[0.99]", className)}
    >
      <span className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-secondary">
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} fittingType="fill" className="h-full w-full" />
        ) : (
          <span className="flex h-full w-full items-center justify-center"><Package className="h-5 w-5 text-muted-foreground/50" aria-hidden="true" /></span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">{product.name}</span>
        {product.category_name && <span className="block truncate text-xs text-muted-foreground">{product.category_name}</span>}
        <span className="mt-1 block"><Price value={product.price} size="sm" /></span>
      </span>
      <span className="shrink-0 text-right">
        {product.is_active ? (
          <>
            <span className="block text-xs text-muted-foreground">{summary.branchCount} filial</span>
            <StockBadge stock={summary.totalStock} />
          </>
        ) : (
          <span className="text-xs font-medium text-muted-foreground">Faol emas</span>
        )}
      </span>
    </button>
  );
}