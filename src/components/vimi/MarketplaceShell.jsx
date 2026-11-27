import React, { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Bell, Home, LayoutGrid, Menu, Package, Search, ShoppingBag, ShoppingCart, Wrench } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useCart } from "@/lib/CartContext";
import { isSupabaseMode } from "@/lib/supabase";
import VimiLogo from "@/components/vimi/VimiLogo";
import NotificationBell from "@/components/vimi/NotificationBell";
import PlatformAccountMenu from "@/components/vimi/PlatformAccountMenu";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

const navigation = [
  { to: "/", label: "Bosh sahifa", icon: Home, end: true },
  { to: "/catalog", label: "Mahsulotlar", icon: Package },
  { to: "/services", label: "Xizmatlar", icon: Wrench },
  { to: "/categories", label: "Kategoriyalar", icon: LayoutGrid },
  { to: "/orders", label: "Buyurtmalarim", icon: ShoppingBag },
  { to: "/notifications", label: "Bildirishnomalar", icon: Bell },
];

function NavigationLink({ item, mobile = false, drawer = false, onClick }) {
  const Icon = item.icon;
  const shouldReduceMotion = useReducedMotion();

  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onClick}
      className={({ isActive }) => cn(
        "inline-flex items-center gap-2 text-sm font-medium transition",
        mobile
          ? "relative isolate min-h-12 flex-1 flex-col justify-center gap-1 rounded-full px-1 text-[10px] transition-colors"
          : drawer
            ? "min-h-11 w-full rounded-xl px-3"
            : "min-h-10 rounded-lg px-3",
        isActive
          ? mobile ? "text-primary-foreground" : "bg-primary/10 text-primary"
          : drawer
            ? "text-white/75 hover:bg-white/10 hover:text-white"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      {(navLink) => (
        <>
          {mobile && navLink.isActive && (
            <motion.span
              layoutId="marketplace-mobile-active-tab"
              className="absolute inset-0 z-0 rounded-full bg-primary"
              transition={{ type: "spring", stiffness: 420, damping: 34, duration: shouldReduceMotion ? 0 : undefined }}
              aria-hidden="true"
            />
          )}
          <Icon className={cn(mobile ? "h-5 w-5" : "h-4 w-4", mobile && "relative z-10")} aria-hidden="true" />
          <span className={mobile ? "relative z-10" : undefined}>{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function MarketplaceShell() {
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const submitSearch = (event) => {
    event.preventDefault();
    const search = query.trim();
    navigate(search ? `/search?q=${encodeURIComponent(search)}` : "/search");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="glass-nav sticky top-3 z-30 mx-auto mt-3 w-[calc(100%-1.5rem)] max-w-[1440px] rounded-full shadow-lg shadow-black/10">
        <div className="mx-auto flex min-h-16 w-full max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:gap-6">
          <button
            type="button"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 text-white/90 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={menuOpen ? "Navigatsiyani yopish" : "Navigatsiyani ochish"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Menu className="h-4 w-4" />
          </button>
          <Link to="/" aria-label="VireonSpes Marketplace" className="shrink-0">
            <VimiLogo />
          </Link>
          <form onSubmit={submitSearch} role="search" className="relative hidden min-w-0 max-w-xl flex-1 md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Mahsulot yoki do‘kon qidirish"
              placeholder="Mahsulot yoki do‘kon qidirish"
              className="h-10 w-full rounded-lg border border-white/15 bg-white/[0.07] pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/55 focus-visible:border-primary"
            />
          </form>
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <Link
              to="/search"
              aria-label="Qidirish"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-white/80 transition hover:bg-white/10 md:hidden"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/cart"
              aria-label={`Savat${totalItems ? `, ${totalItems} mahsulot` : ""}`}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 text-white/90 transition hover:bg-white/10"
            >
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </Link>
            {isSupabaseMode && <span className="hidden sm:inline-flex"><NotificationBell /></span>}
            <PlatformAccountMenu experience="marketplace" />
          </div>
        </div>
      </header>
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="left"
          overlayClassName="bg-black/45 backdrop-blur-[2px]"
          className="liquid-aside flex w-[min(20rem,85vw)] flex-col gap-0 border-r p-0 sm:max-w-sm"
        >
          <SheetHeader className="border-b border-white/10 px-5 pb-5 pt-6 text-left">
            <Link to="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 pr-8">
              <VimiLogo />
              <span className="h-9 w-px bg-border" aria-hidden="true" />
              <span className="min-w-0">
                <SheetTitle className="text-sm font-semibold !text-white">VireonSpes</SheetTitle>
                <SheetDescription className="mt-1 text-xs !text-white/65">Marketplace</SheetDescription>
              </span>
            </Link>
          </SheetHeader>
          <nav aria-label="Marketplace yon menyusi" className="flex-1 space-y-1 overflow-y-auto p-4">
            <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/45">Asosiy menyu</p>
            {navigation.map((item) => <NavigationLink key={item.to} item={item} drawer onClick={() => setMenuOpen(false)} />)}
            <Link
              to="/cart"
              onClick={() => setMenuOpen(false)}
              className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
              Savat{totalItems > 0 ? ` · ${totalItems} ta mahsulot` : ""}
            </Link>
          </nav>
          <div className="border-t border-white/10 px-5 py-4">
            <p className="text-xs text-white/55">VireonSpes Marketplace</p>
          </div>
        </SheetContent>
      </Sheet>
      <main className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-[1440px] px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
        <Outlet />
      </main>
      <nav aria-label="Marketplace mobil navigatsiyasi" className="fixed inset-x-0 bottom-0 z-20 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-2 lg:hidden">
        <div className="mx-auto flex max-w-xl items-stretch justify-around rounded-full border border-border bg-card/95 px-2 py-1.5 shadow-lg shadow-black/5 backdrop-blur">
          {[navigation[0], navigation[1], navigation[3], navigation[4]].map((item) => (
            <NavigationLink key={item.to} item={item} mobile />
          ))}
        </div>
      </nav>
    </div>
  );
}
