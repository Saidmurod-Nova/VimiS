import React from "react";
import { cn } from "@/lib/utils";

// Consistent order status badge with Uzbek labels and semantic colors.
// Colors are only used where they communicate meaningful status.
const STATUS = {
  pending: { label: "Kutilmoqda", cls: "bg-warning/15 text-warning" },
  accepted: { label: "Qabul qilingan", cls: "bg-primary/10 text-primary" },
  preparing: { label: "Tayyorlanmoqda", cls: "bg-primary/10 text-primary" },
  completed: { label: "Yakunlandi", cls: "bg-success/15 text-success" },
  cancelled: { label: "Bekor qilindi", cls: "bg-destructive/10 text-destructive" },
};

export function statusLabel(status) {
  return (STATUS[status] && STATUS[status].label) || status || "—";
}

export default function OrderStatusBadge({ status, className }) {
  const s = STATUS[status] || { label: status || "—", cls: "bg-secondary text-muted-foreground" };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", s.cls, className)}>
      {s.label}
    </span>
  );
}