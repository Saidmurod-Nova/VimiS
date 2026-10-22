import React from "react";
import { Avatar as UIAvatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function Avatar({ src, name = "", size = 44, className }) {
  const initials = name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <UIAvatar className={cn("rounded-full border border-border", className)} style={{ width: size, height: size }}>
      {src ? <AvatarImage src={src} alt={name} /> : <AvatarFallback className="bg-secondary font-medium text-foreground">{initials || "V"}</AvatarFallback>}
    </UIAvatar>
  );
}