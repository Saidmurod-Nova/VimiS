import React from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  MapPin,
  Package,
  PackageCheck,
  Store,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import OrderStatusBadge from "./OrderStatusBadge";

const STATUS_ICON = {
  pending: Clock3,
  accepted: CheckCircle2,
  preparing: Package,
  completed: PackageCheck,
  cancelled: XCircle,
};

const STATUS_STYLE = {
  pending: "bg-warning/10 text-warning",
  accepted: "bg-primary/10 text-primary",
  preparing: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

export default function OrderCard({
  orderId,
  number,
  status,
  total,
  date,
  itemCount,
  businessName,
  branchName,
  address,
  paymentMethod,
  onClick,
  className,
}) {
  const navigate = useNavigate();
  const StatusIcon = STATUS_ICON[status] || Package;

  return (
    <button
      type="button"
      onClick={(event) => {
        onClick?.(event);
        navigate(`/orders/${orderId}`);
      }}
      aria-label={`Buyurtma ${number}, ${total}, ${status}`}
      className={cn(
        "group w-full rounded-2xl border border-border bg-card p-4 text-left transition hover:border-primary/40 hover:bg-card/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.995] sm:p-5",
        className
      )}
    >
      <span className="flex items-start gap-3 sm:gap-4">
        <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", STATUS_STYLE[status] || "bg-secondary text-muted-foreground")}>
          <StatusIcon className="h-5 w-5" aria-hidden="true" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-display text-sm font-semibold text-foreground sm:text-base">#{number}</span>
            <OrderStatusBadge status={status} />
          </span>

          <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {date}
            </span>
            <span className="inline-flex items-center gap-1">
              <Package className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {itemCount} ta mahsulot
            </span>
          </span>

          <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
            {businessName && (
              <span className="inline-flex min-w-0 items-center gap-1">
                <Store className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="max-w-52 truncate">{businessName}</span>
              </span>
            )}
            {branchName && <span className="truncate">{branchName}</span>}
            {paymentMethod && (
              <span className="inline-flex items-center gap-1">
                <CreditCard className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {paymentMethod}
              </span>
            )}
          </span>

          {address && (
            <span className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="line-clamp-1 break-words leading-4 sm:line-clamp-2">{address}</span>
            </span>
          )}
        </span>

        <span className="flex shrink-0 flex-col items-end gap-2 self-center">
          <span className="text-right font-display text-sm font-bold tabular-nums text-foreground sm:text-base">{total}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
        </span>
      </span>
    </button>
  );
}
