import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Package } from "lucide-react";
import OrderStatusBadge from "../OrderStatusBadge";
import Price from "../Price";
import { EmptyState } from "../States";

// Recent orders list on the dashboard. Newest first; selecting opens the
// seller Order Details screen. Shows order number, buyer snapshot, branch,
// time, total, and current status.
function timeAgo(iso) {
  if (!iso) return "Sana ko‘rsatilmagan";
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff)) return "Sana ko‘rsatilmagan";
  const m = Math.floor(diff / 60000);
  if (m < 1) return "hozir";
  if (m < 60) return `${m} daq oldin`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} soat oldin`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} kun oldin`;
  return new Date(iso).toLocaleDateString("uz-UZ");
}

export default function RecentOrders({ orders, businessId, onSeeAll }) {
  const navigate = useNavigate();
  if (!orders || orders.length === 0) {
    return <EmptyState icon={Package} title="Buyurtmalar yo'q" description="Yangi buyurtmalar shu yerda paydo bo'ladi." />;
  }
  return (
    <div className="space-y-2">
      {orders.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => navigate(`/business/${businessId}/orders/${o.id}`)}
          className="flex w-full items-center gap-3 border-b border-border bg-card px-4 py-3 text-left transition last:border-b-0 hover:bg-secondary/40"
        >
          <span className="min-w-0 flex-1">
            <span className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium text-foreground">#{o.order_number}</span>
              <OrderStatusBadge status={o.status} />
            </span>
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
              {o.buyer_name_snapshot || "Xaridor"} · {o.branch_name || "Filial"}
            </span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              {o.item_count} ta mahsulot · {timeAgo(o.created_at || o.created_date)}
            </span>
          </span>
          <span className="flex items-center gap-2">
            <Price value={o.total_amount ?? o.total} size="sm" />
            <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </span>
        </button>
      ))}
      {onSeeAll && (
        <button
          type="button"
          onClick={onSeeAll}
          className="w-full rounded-2xl border border-border bg-card py-3 text-sm font-medium text-primary transition active:scale-[0.99]"
        >
          Barcha buyurtmalarni ko‘rish
        </button>
      )}
    </div>
  );
}