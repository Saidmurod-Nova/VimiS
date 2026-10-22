import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export default function BottomSheet({ open, onOpenChange, title, children, className }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className={cn("rounded-t-3xl border-t border-border p-0", className)}>
        <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-border" />
        {title && (
          <SheetHeader className="px-5 pt-3">
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
        )}
        <div className="px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-2">{children}</div>
      </SheetContent>
    </Sheet>
  );
}