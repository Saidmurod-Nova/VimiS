import React from "react";
import { Image } from "@/components/ui/image";
import { ShoppingBag, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import Price from "./Price";

// Product result card for search. Shows base business price; branch-specific
// pricing/availability are resolved on the Product Details screen after the
// buyer selects a branch (multiple branches supported).
export default function SearchProductCard({ product, onView, className }) {
  return (
    <button type="button" onClick={onView} className={cn("group block w-full overflow-hidden rounded-2xl border border-border bg-card text-left", className)}>
      <div className="aspect-square overflow-hidden bg-gradient-to-br from-secondary to-muted">
        {product.image_url ? <Image src={product.image_url} alt={product.name} fittingType="fill" className="h-full w-full transition duration-300 group-hover:scale-105" /> : <div className="flex h-full w-full items-center justify-center"><ShoppingBag className="h-7 w-7 text-muted-foreground/50" /></div>}
      </div>
      <div className="p-3">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium text-foreground">{product.name}</h3>
        <Price value={product.price} size="sm" className="mt-1" />
        <p className="mt-1 inline-flex items-center gap-1 truncate text-xs text-muted-foreground">
          <Store className="h-3 w-3" />{product.business_name}
        </p>
      </div>
    </button>
  );
}