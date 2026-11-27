import React from "react";
import { Image } from "@/components/ui/image";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import Price from "./Price";
import StockBadge from "./StockBadge";

export default function ProductListItem({ product, stockSummary, onClick, className = "" }) {
  const summary = stockSummary || { totalStock: 0, branchCount: 0 };
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 bg-card p-3 text-left transition hover:bg-secondary/50 focus-visible:bg-secondary/40 md:grid md:grid-cols-[40px_minmax(0,2fr)_minmax(120px,1fr)_minmax(140px,1fr)_minmax(100px,.7fr)] md:gap-4 md:px-5 md:py-3.5",
        className
      )}
    >
      <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-secondary md:h-10 md:w-10">
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} fittingType="fill" className="h-full w-full" />
        ) : (
          <span className="flex h-full w-full items-center justify-center"><Package className="h-5 w-5 text-muted-foreground/50" aria-hidden="true" /></span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-foreground">{product.name}</span>
        {product.category_name && <span className="block truncate text-xs text-muted-foreground">{product.category_name}</span>}
        <span className="mt-1 block md:hidden"><Price value={product.price} size="sm" /></span>
      </span>
      <span className="hidden md:block"><Price value={product.price} size="sm" /></span>
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
      <span className="hidden md:block">
        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${product.is_active ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"}`}>
          {product.is_active ? "Faol" : "Nofaol"}
        </span>
      </span>
    </button>
  );
}