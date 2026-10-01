import React from "react";
import { cn } from "@/lib/utils";

export default function VimiLogo({ showTagline = false, className = "" }) {
  return (
    <div className={cn("inline-flex flex-col leading-none", className)}>
      <span className="font-display text-2xl font-semibold tracking-tight text-foreground">Vimi</span>
      {showTagline && (
        <span className="mt-1 text-[11px] font-medium text-muted-foreground">by VireonSpes</span>
      )}
    </div>
  );
}