import React from "react";
import { Link, Outlet } from "react-router-dom";
import PlatformAccountMenu from "@/components/vimi/PlatformAccountMenu";
import VimiLogo from "@/components/vimi/VimiLogo";

export default function BusinessSelectionShell() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex min-h-16 w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/business" aria-label="VireonSpes Business Console">
            <VimiLogo />
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Marketplace
            </Link>
            <PlatformAccountMenu experience="business" />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
        <Outlet />
      </main>
    </div>
  );
}
