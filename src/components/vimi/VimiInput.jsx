import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function TextInput({ icon: Icon, className, inputClassName, ...props }) {
  return (
    <div className={cn("relative", className)}>
      {Icon && (
        <Icon className="absolute left-3.5 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      )}
      <Input
        className={cn(
          "h-12 rounded-xl border-transparent bg-secondary/70 focus-visible:bg-background",
          Icon && "pl-11",
          inputClassName
        )}
        {...props}
      />
    </div>
  );
}

export function SearchBar({ className, ...props }) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3.5 top-1/2 w-4 h-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input className="h-12 rounded-xl border-transparent bg-secondary/70 pl-11" {...props} />
    </div>
  );
}