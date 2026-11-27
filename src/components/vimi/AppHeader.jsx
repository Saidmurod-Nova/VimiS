import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronRight, LogOut, Menu, Moon, PanelLeftClose, PanelLeftOpen, Plus, RefreshCw, Search, Settings, ShoppingCart, Store, Sun, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { useCart } from "@/lib/CartContext";
import { useTheme } from "@/lib/ThemeContext";
import { useBusiness } from "@/lib/BusinessContext";
import { base44 } from "@/api/base44Client";
import { isSupabaseMode, supabase } from "@/lib/supabase";
import Avatar from "./Avatar";
import VimiLogo from "./VimiLogo";
import NotificationBell from "./NotificationBell";
import BusinessSelectorSheet from "./seller/BusinessSelectorSheet";
import BranchSelectorSheet from "./seller/BranchSelectorSheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AppHeader({ isSeller, isSidebarOpen, onToggleSidebar, onToggleMobileNav, isMobileNavOpen, showBusinessSelector = true }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { theme, toggleTheme } = useTheme();
  const {
    businesses,
    selectedBusiness,
    selectedBranchId,
    selectBranch,
  } = useBusiness();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState(false);
  const [branchesRetry, setBranchesRetry] = useState(0);
  const searchValue = searchParams.get("q") || "";
  const businessBase = selectedBusiness?.id ? `/business/${selectedBusiness.id}` : "/business";
  const profilePath = isSeller ? `${businessBase}/settings` : "/profile";
  const ordersPath = isSeller ? `${businessBase}/orders` : "/orders";
  const homePath = isSeller ? businessBase : "/";
  const displayName = user?.full_name || user?.email || "Profil";

  useEffect(() => {
    setQuery(searchValue);
  }, [searchValue]);

  useEffect(() => {
    if (!isSeller || !selectedBusiness?.id) {
      setBranches([]);
      setBranchesLoading(false);
      setBranchesError(false);
      return undefined;
    }

    let cancelled = false;
    const loadBranches = async () => {
      setBranchesLoading(true);
      setBranchesError(false);
      try {
        let list;
        if (isSupabaseMode) {
          if (!supabase) throw new Error("Supabase client is not configured");
          const { data, error } = await supabase
            .from("branches")
            .select("*")
            .eq("business_id", selectedBusiness.id);
          if (error) throw error;
          list = data || [];
        } else {
          list = await base44.entities.Branch.filter({ business_id: selectedBusiness.id }, "name", 100);
        }
        if (!cancelled) setBranches(list);
      } catch (error) {
        if (!cancelled) {
          setBranches([]);
          setBranchesError(true);
          toast.error(error?.message || "Filiallarni yuklab bo‘lmadi.");
        }
      } finally {
        if (!cancelled) setBranchesLoading(false);
      }
    };

    loadBranches();
    return () => { cancelled = true; };
  }, [isSeller, selectedBusiness?.id, branchesRetry]);

  const submitSearch = (event) => {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? `/search?q=${encodeURIComponent(value)}` : "/search");
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      toast.error(error?.message || "Hisobdan chiqib bo‘lmadi. Qayta urinib ko‘ring.");
    }
  };

  const handleBusinessSelect = (id) => {
    if (id !== selectedBusiness?.id) navigate(`/business/${id}`);
  };

  return (
    <header className={`sticky top-2 z-30 mx-2 mt-2 border shadow-lg shadow-black/5 sm:top-3 sm:mx-3 sm:mt-3 ${isSeller ? "rounded-[1.25rem] business-glass-nav sm:rounded-[1.75rem] lg:rounded-full" : "rounded-full border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80"}`}>
      <div className="mx-auto flex min-h-[64px] w-full max-w-[1600px] flex-wrap items-center gap-2 px-3 py-2 sm:min-h-[72px] sm:flex-nowrap sm:gap-3 sm:px-5 sm:py-0 lg:px-8">
        <button
          type="button"
          onClick={onToggleMobileNav}
          aria-label={isMobileNavOpen ? "Navigatsiyani yopish" : "Navigatsiyani ochish"}
          aria-expanded={isMobileNavOpen}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground transition hover:bg-secondary lg:hidden"
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? "Yon panelni yopish" : "Yon panelni ochish"}
          aria-expanded={isSidebarOpen}
          className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground transition hover:bg-secondary lg:inline-flex"
        >
          {isSidebarOpen
            ? <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
            : <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />}
        </button>
        <Link to={homePath} aria-label="VireonSpes platformasi bosh sahifasi" className="shrink-0">
          <VimiLogo />
        </Link>
        {!isSeller && (
          <>
            <form onSubmit={submitSearch} role="search" className="relative hidden min-w-0 max-w-lg flex-1 sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Do‘kon yoki mahsulot qidirish"
                placeholder="Do‘kon yoki mahsulot qidirish"
                className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none transition focus-visible:border-primary"
              />
            </form>
            <button
              type="button"
              onClick={() => navigate("/search")}
              aria-label="Qidirish"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground transition hover:bg-secondary sm:hidden"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </button>
          </>
        )}

        {isSeller && (
          <nav aria-label="Biznes va filial" className="order-3 flex w-full min-w-0 basis-full items-center gap-2 border-t border-border/60 pt-2 sm:order-none sm:w-auto sm:basis-auto sm:flex-1 sm:border-t-0 sm:pt-0">
            {showBusinessSelector && (
              <>
                <BusinessSelectorSheet
                  businesses={businesses}
                  selectedBusiness={selectedBusiness}
                  onSelect={handleBusinessSelect}
                  triggerClassName="h-10 max-w-none min-w-0 flex-[1.15] sm:max-w-[220px] sm:flex-1"
                />
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </>
            )}
            <BranchSelectorSheet
              branches={branches}
              selectedId={selectedBranchId}
              onSelect={selectBranch}
              onAddBranch={() => navigate(`${businessBase}/branches/new`)}
              disabled={!selectedBusiness || branchesLoading}
              triggerClassName="h-10 max-w-none min-w-0 flex-1 sm:max-w-[180px]"
            />
            {branchesError && (
              <button
                type="button"
                onClick={() => setBranchesRetry((retry) => retry + 1)}
                aria-label="Filiallarni qayta yuklash"
                title="Filiallarni qayta yuklash"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition hover:bg-secondary"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </nav>
        )}

        <div className={`ml-auto flex shrink-0 items-center gap-2 ${!isSeller ? "sm:ml-0" : "order-1 sm:order-none"}`}>
          {isSupabaseMode && <NotificationBell key={user?.id || "anonymous"} />}

          {!isSeller && (
            <Link
              to="/cart"
              aria-label={`Savat${totalItems > 0 ? `, ${totalItems} ta mahsulot` : ""}`}
              className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground transition hover:bg-secondary"
            >
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </Link>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Profil menyusini ochish"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full focus-visible:outline-none"
              >
                <Avatar src={user?.avatar} name={displayName} size={38} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate">{displayName}</DropdownMenuLabel>
              {user?.email && user.full_name && (
                <p className="truncate px-2 pb-1 text-xs text-muted-foreground">{user.email}</p>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={profilePath}>
                  <User aria-hidden="true" />
                  Profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={ordersPath}>
                  <ShoppingCart aria-hidden="true" />
                  Buyurtmalar
                </Link>
              </DropdownMenuItem>
              {!isSeller && (
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <Settings aria-hidden="true" />
                    Sozlamalar
                  </Link>
                </DropdownMenuItem>
              )}
              {!isSeller && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/business">
                      <Store aria-hidden="true" />
                      Bizneslarim
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/business/new">
                      <Plus aria-hidden="true" />
                      Biznes yaratish
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              {businesses.length > 0 && !isSeller && (
                <DropdownMenuItem asChild>
                  <Link to="/business">
                    <Store aria-hidden="true" />Business Console’ga o‘tish
                  </Link>
                </DropdownMenuItem>
              )}
              {isSeller && (
                <DropdownMenuItem onSelect={() => navigate("/")}>
                  <Store aria-hidden="true" />Marketplace’ga o‘tish
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={toggleTheme}>
                {theme === "dark"
                  ? <Sun aria-hidden="true" />
                  : <Moon aria-hidden="true" />}
                {theme === "dark" ? "Yorug‘ mavzuga o‘tish" : "Qorong‘i mavzuga o‘tish"}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handleLogout}>
                <LogOut aria-hidden="true" />
                Hisobdan chiqish
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
