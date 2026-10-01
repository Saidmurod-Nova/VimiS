import React from "react";
import { Badge as UIBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Badge({ children, className, ...props }) {
  return (
    <UIBadge className={cn("rounded-full font-medium", className)} {...props}>
      {children}
    </UIBadge>
  );
}