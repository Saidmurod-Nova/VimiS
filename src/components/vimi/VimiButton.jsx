import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const base = "rounded-lg font-medium transition-all duration-200 active:scale-[0.98]";

export function PrimaryButton({ className, ...props }) {
  return <Button className={cn(base, className)} {...props} />;
}

export function SecondaryButton({ className, ...props }) {
  return <Button variant="secondary" className={cn(base, className)} {...props} />;
}

export function GhostButton({ className, ...props }) {
  return <Button variant="ghost" className={cn(base, className)} {...props} />;
}

export function IconButton({ icon: Icon, label, className, ...props }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      className={cn("h-10 w-10 rounded-full", base, className)}
      {...props}
    >
      <Icon className="w-5 h-5" aria-hidden="true" />
    </Button>
  );
}