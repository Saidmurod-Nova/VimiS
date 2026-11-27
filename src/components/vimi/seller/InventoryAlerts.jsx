import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, PackageX, Boxes, ChevronRight } from "lucide-react";
import { Image } from "@/components/ui/image";
import { EmptyState } from "../States";
import { cn } from "@/lib/utils";

// Inventory alert summary for the selected branch scope. Distinguishes
// out-of-stock, low-stock, and available counts. Alert rows open the branch
// inventory management screen.
export default function InventoryAlerts({ inventory, businessId, branchId }) {
  const navigate = useNavigate();
  const { outOfStock, lowStock, totalAvailable, threshold, trackedCount, items } = inventory || {};

  const summary = [
    { key: "out", label: "Tugagan", value: outOfStock || 0, icon: PackageX, tone: "text-destructive", bg: "bg-destructive/10" },
    { key: "low", label: "Kam qoldi", value: lowStock || 0, icon: AlertTriangle, tone: "text-warning", bg: "bg-warning/10" },
    { key: "avail", label: "Mavjud", value: totalAvailable || 0, icon: Boxes, tone: "text-foreground", bg: "bg-secondary" },
  ];

  const goInventory = () => {
    if (branchId && branchId !== "all") {
      navigate(`/business/${businessId}/branches/${branchId}/inventory`);
    } else {
      navigate(`/business/${businessId}/products`);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {summary.map((s) => (
          <div key={s.key} className="rounded-lg border border-border bg-card p-3">
            <span className={cn("inline-flex h-8 w-8 items-center justify-center rounded-full", s.bg, s.tone)}>
              <s.icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="mt-2 font-display text-xl font-semibold tabular-nums">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
      {(!items || items.length === 0) ? (
        <EmptyState
          title={trackedCount ? "Kam zaxira yo‘q" : "Zaxira ma’lumoti yo‘q"}
          description={trackedCount ? `Barcha kuzatilayotgan mahsulotlar belgilangan ${threshold} donalik chegaradan yuqori.` : "Filiallarda hali mahsulot zaxirasi kiritilmagan."}
        />
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <button
              key={`${it.branch_id}:${it.product_id}`}
              type="button"
              onClick={goInventory}
              className="flex w-full items-center gap-3 border-b border-border bg-card px-3 py-3 text-left transition last:border-b-0 hover:bg-secondary/40"
            >
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary">
                {it.image_url ? (
                  <Image src={it.image_url} alt={it.name} fittingType="fill" className="h-full w-full" />
                ) : (
                  <PackageX className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">{it.name}</span>
                {it.branch_name && <span className="block truncate text-xs text-muted-foreground">{it.branch_name}</span>}
                <span className={cn("block text-xs font-medium", it.stock === 0 ? "text-destructive" : "text-warning")}>
                  {it.stock === 0 ? "Tugagan" : `Kam qoldi · ${it.stock} dona`}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}