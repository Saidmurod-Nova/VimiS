import React from "react";
import { cn } from "@/lib/utils";
import { Check, X, Pause } from "lucide-react";

// Distinguishes the three availability states (spec §17).
export default function AvailabilityBadge({ available, disabled, hasInventory = true, className }) {
  let Icon = Check, tone = "text-success", label = "Mavjud";
  if (!hasInventory) { Icon = X; tone = "text-muted-foreground"; label = "Mavjud emas"; }
  else if (disabled) { Icon = Pause; tone = "text-warning"; label = "Hozir sotuvda emas"; }
  else if (!available) { Icon = X; tone = "text-muted-foreground"; label = "Mavjud emas"; }
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm font-medium", tone, className)}>
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
    </span>
  );
}