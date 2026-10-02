import React from "react";
import { useNavigate } from "react-router-dom";
import { Image } from "@/components/ui/image";
import { Package } from "lucide-react";
import { formatSoM } from "@/lib/inventory";
import { EmptyState } from "../States";
import { cn } from "@/lib/utils";

// Product performance from completed OrderItem snapshots: quantity sold,
// completed revenue, and current stock. Clicking opens the product detail.
export default function ProductPerformance({ products, businessId }) {
  const navigate = useNavigate();
  if (!products || products.length === 0) {
    return <EmptyState icon={Package} title="Sotuv yo'q" description="Tanlangan davrda sotilgan mahsulotlar yo'q." />;
  }
  return (
    <div className="space-y-2">
      {products.map((p, i) => (
        <button
          key={(p.productId || p.name) + i}
          type="button"
          onClick={() => p.productId && navigate(`/seller/products/${p.productId}`)}
          className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left transition active:scale-[0.99]"
        >
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary">
            {p.image_url ? (
              <Image src={p.image_url} alt={p.name} fittingType="fill" className="h-full w-full" />
            ) : (
              <Package className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-foreground">{p.name}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {p.quantitySold} dona sotildi
              {p.currentStock != null ? ` · zaxira: ${p.currentStock}` : ""}
            </span>
          </span>
          <span className="text-right">
            <span className="block font-display text-sm font-semibold tabular-nums">{formatSoM(p.revenue)}</span>
            <span className="block text-xs font-normal text-muted-foreground">so'm</span>
          </span>
        </button>
      ))}
    </div>
  );
}