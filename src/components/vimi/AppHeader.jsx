import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronRight, LogOut, Moon, PanelLeftClose, PanelLeftOpen, Plus, RefreshCw, Search, ShoppingCart, Sun, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { useCart } from "@/lib/CartContext";
import { useTheme } from "@/lib/ThemeContext";
import { useBusiness } from "@/lib/BusinessContext";
import { base44 } from "@/api/base44Client";
import { isSupabaseMode, supabase } from "@/lib/supabase";
import Avatar from "./Avatar";
import VimiLogo from "./VimiLogo";
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

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const Icon = theme === "dark" ? Sun : Moon;
  const label = theme === "dark" ? "Yorug‘ mavzuga o‘tish" : "Qorong‘i mavzuga o‘tish";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground transition hover:bg-secondary"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

export default function AppHeader({ isSeller, isSidebarOpen, onToggleSidebar }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const {
    businesses,
    selectedBusiness,
    selectBusiness,
    selectedBranchId,
    selectBranch,
  } = useBusiness();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState(false);
  const [branchesRetry, setBranchesRetry] = useState(0);
  const searchValue = searchParams.get("q") || "";
  const profilePath = isSeller ? "/seller/profile" : "/profile";
  const ordersPath = isSeller ? "/seller/orders" : "/orders";
  const homePath = isSeller ? "/seller" : "/";
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
    selectBusiness(id);
    if (id !== selectedBusiness?.id) navigate("/seller");
  };

  const addBranch = () => {
    if (selectedBusiness?.id) {
      navigate(`/seller/businesses/${selectedBusiness.id}/branches/new`);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex min-h-16 max-w-3xl flex-wrap items-center gap-2 px-4 py-2 sm:gap-3 sm:px-6 sm:py-0">
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
        <Link to={homePath} aria-label="VimiS bosh sahifasi" className="shrink-0">
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
          <nav aria-label="Biznes va filial" className="order-last flex min-w-0 basis-full items-center gap-1 sm:order-none sm:basis-auto sm:flex-1 sm:gap-2">
            <BusinessSelectorSheet
              businesses={businesses}
              selectedBusiness={selectedBusiness}
              onSelect={handleBusinessSelect}
              triggerClassName="max-w-[36vw] flex-1 sm:max-w-[220px]"
            />
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <BranchSelectorSheet
              branches={branches}
              selectedId={selectedBranchId}
              onSelect={selectBranch}
              disabled={!selectedBusiness || branchesLoading}
              triggerClassName="max-w-[32vw] flex-1 sm:max-w-[180px]"
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
            <button
              type="button"
              onClick={addBranch}
              disabled={!selectedBusiness}
              aria-label="Filial qo‘shish"
              title="Filial qo‘shish"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-3"
            >
              <Plus className="h-4 w-4 sm:mr-1" aria-hidden="true" />
              <span className="hidden text-sm font-medium sm:inline">Filial</span>
            </button>
          </nav>
        )}

        <div className={`ml-auto flex shrink-0 items-center gap-2 ${!isSeller ? "sm:ml-0" : "order-1 sm:order-none"}`}>
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

          <ThemeToggle />

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
              <DropdownMenuItem onSelect={() => navigate(isSeller ? "/" : "/seller")}>
                <RefreshCw aria-hidden="true" />
                {isSeller ? "Xaridorga o‘tish" : "Sotuvchiga o‘tish"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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
