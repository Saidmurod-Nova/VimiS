import React from "react";
import { cn } from "@/lib/utils";

export default function StatCard({ label, value, icon: Icon, hint, className }) {
  return (
    <div className={cn("surface-card min-w-0 p-4", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {Icon && (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="w-4 h-4" aria-hidden="true" />
          </span>
        )}
      </div>
      <div className="mt-3 font-display text-[1.65rem] font-semibold tracking-tight tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs leading-5 text-muted-foreground">{hint}</div>}
    </div>
  );
}