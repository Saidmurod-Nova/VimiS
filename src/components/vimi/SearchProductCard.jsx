import React from "react";
import { Image } from "@/components/ui/image";
import { ShoppingBag, Store, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import Price from "./Price";

// Product result card for search. Shows base business price; branch-specific
// pricing/availability are resolved on the Product Details screen after the
// buyer selects a branch (multiple branches supported).
export default function SearchProductCard({ product, onView, className }) {
  return (
    <button type="button" onClick={onView} className={cn("group block w-full overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md", className)}>
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-secondary to-muted">
        {product.image_url ? <Image src={product.image_url} alt={product.name} fittingType="fill" className="h-full w-full transition duration-300 group-hover:scale-105" /> : <div className="flex h-full w-full items-center justify-center"><ShoppingBag className="h-7 w-7 text-muted-foreground/50" /></div>}
        {product.category_name && <span className="absolute left-2.5 top-2.5 max-w-[calc(100%-1.25rem)] truncate rounded-full border border-white/30 bg-background/90 px-2.5 py-1 text-[10px] font-semibold text-foreground shadow-sm backdrop-blur"><Tag className="mr-1 inline h-3 w-3" />{product.category_name}</span>}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium text-foreground">{product.name}</h3>
        {product.description && (
          <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-xs leading-5 text-muted-foreground">{product.description}</p>
        )}
        <p className="mt-2 inline-flex max-w-full items-center gap-1.5 truncate text-xs text-muted-foreground">
          <Store className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /><span className="truncate">{product.business_name || "Do'kon"}</span>
        </p>
        <div className="mt-2.5 border-t border-border/70 pt-2.5"><Price value={product.price} size="sm" /></div>
      </div>
    </button>
  );
}
