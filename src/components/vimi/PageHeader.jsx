import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "./VimiButton";

export default function PageHeader({ title, subtitle = "", action = null, backTo = null, className = "" }) {
  const navigate = useNavigate();
  return (
    <div className={cn("workspace-page-header", className)}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        {backTo && (
          <IconButton
            icon={ArrowLeft}
            label="Orqaga"
            onClick={() => navigate(backTo)}
            className="mt-0.5 h-9 w-9 shrink-0 rounded-lg border border-border bg-card hover:bg-secondary"
          />
        )}
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm leading-5 text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-2 sm:ml-auto">{action}</div>}
    </div>
  );
}