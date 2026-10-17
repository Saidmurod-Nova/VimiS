import React from "react";
import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import Badge from "./Badge";

export default function OrderCard({ number, status, total, date, items, onClick, className }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={(event) => {
        onClick?.(event);
        navigate(`/orders/${number}`);
      }}
      className={cn("flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition active:scale-[0.99]", className)}
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-foreground">#{number}</span>
          <Badge variant="secondary" className="font-normal">{status}</Badge>
        </span>
        <span className="mt-1 block truncate text-xs text-muted-foreground">{items} · {date}</span>
      </span>
      <span className="flex items-center gap-2">
        <span className="font-display font-semibold tabular-nums">{total}</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
      </span>
    </button>
  );
}