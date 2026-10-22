import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-10 text-center", className)}>
      {Icon && (
        <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <Icon className="w-5 h-5" aria-hidden="true" />
        </span>
      )}
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      {description && <p className="mt-1 max-w-xs text-xs text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = "Nimadir xato ketdi", description = "Qayta urinib ko'ring.", onRetry, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-10 text-center", className)}>
      <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="w-5 h-5" aria-hidden="true" />
      </span>
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-medium transition active:scale-95">
          <RefreshCw className="w-4 h-4" aria-hidden="true" />Qayta urinish
        </button>
      )}
    </div>
  );
}

export function LoadingState({ className }) {
  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className="h-12 w-full rounded-xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-20 w-full rounded-2xl" />
    </div>
  );
}

export function CardSkeleton({ className }) {
  return <Skeleton className={cn("h-40 w-full rounded-2xl", className)} />;
}