import React from "react";
import { cn } from "@/lib/utils";

export default function Price({ value, currency = "so'm", size = "md", className = "" }) {
  const formatted = new Intl.NumberFormat("en-US").format(Math.round(Number(value) || 0)).replace(/,/g, " ");
  const sizes = { sm: "text-base", md: "text-lg", lg: "text-2xl" };
  return (
    <div className={cn("flex items-baseline gap-1 font-display font-semibold tabular-nums", className)}>
      <span className={sizes[size]}>{formatted}</span>
      <span className="text-xs font-normal text-muted-foreground">{currency}</span>
    </div>
  );
}