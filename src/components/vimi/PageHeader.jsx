import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { IconButton } from "./VimiButton";

export default function PageHeader({ title, subtitle, action, backTo, className }) {
  const navigate = useNavigate();
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <IconButton icon={ArrowLeft} label="Orqaga" onClick={() => (backTo ? navigate(backTo) : navigate(-1))} />
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-display text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}