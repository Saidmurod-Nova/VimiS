import React from "react";
import { cn } from "@/lib/utils";

export default function StatusBadge({ active = true, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-success" : "bg-muted-foreground")} />
      {active ? "Faol" : "Faol emas"}
    </span>
  );
}