import React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SettingsList({ children, className }) {
  return <div className={cn("overflow-hidden rounded-2xl border border-border bg-card", className)}>{children}</div>;
}

export const SettingsRow = React.forwardRef(function SettingsRow({ icon: Icon, label, value, onClick, destructive, right, className }, ref) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      ref={ref}
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-secondary/60",
        destructive && "text-destructive",
        className
      )}
    >
      {Icon && (
        <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-xl bg-secondary", destructive && "bg-destructive/10")}>
          <Icon className="w-4 h-4" aria-hidden="true" />
        </span>
      )}
      <span className="flex-1 text-sm font-medium">{label}</span>
      {value && <span className="text-sm text-muted-foreground">{value}</span>}
      {right ?? (onClick && <ChevronRight className="w-4 h-4 text-muted-foreground" aria-hidden="true" />)}
    </Comp>
  );
});

SettingsRow.displayName = "SettingsRow";