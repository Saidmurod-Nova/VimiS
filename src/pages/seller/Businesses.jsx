import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Plus, Search, Store } from "lucide-react";
import PageHeader from "@/components/vimi/PageHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/vimi/States";
import { useBusiness } from "@/lib/BusinessContext";

export default function Businesses() {
  const { businesses, loading, error, refresh } = useBusiness();
  const [search, setSearch] = useState("");
  const filteredBusinesses = businesses.filter((business) => {
    const query = search.trim().toLocaleLowerCase();
    return !query || [business.name, business.category_name, business.description]
      .filter(Boolean)
      .some((value) => value.toLocaleLowerCase().includes(query));
  });

  return (
    <div className="animate-fade-in space-y-5">
      <PageHeader
        title="My Businesses"
        subtitle="Choose a business to open its dedicated workspace, or create a new business."
        className=""
        action={
          <Link
            to="/business/new"
            aria-label="Biznes yaratish"
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Create Business</span>
          </Link>
        }
      />

      {loading ? (
        <LoadingState className="" />
      ) : error ? (
        <ErrorState title={error} onRetry={refresh} className="" />
      ) : businesses.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No businesses yet"
          description="Create your first business to start managing its products, branches, and orders."
          className=""
          action={
            <Link
              to="/business/new"
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Create Business
            </Link>
          }
        />
      ) : (
        <>
        <label className="relative block max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search businesses"
            aria-label="Search businesses"
            className="h-10 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus-visible:border-primary"
          />
        </label>
        {filteredBusinesses.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No businesses match your search.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filteredBusinesses.map((business) => (
              <article
                key={business.id}
                className="flex min-h-40 flex-col justify-between gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-primary/30"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-secondary">
                    {business.logo_url ? (
                      <img src={business.logo_url} alt={`${business.name} logosi`} className="h-full w-full object-cover" />
                    ) : (
                      <Store className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{business.name}</span>
                    <span className="mt-1 block truncate text-sm text-muted-foreground">
                      {business.category_name || "Uncategorized"}
                    </span>
                    <span className={`mt-2 inline-flex items-center gap-1.5 text-xs font-medium ${business.is_active ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${business.is_active ? "bg-emerald-500" : "bg-muted-foreground"}`} aria-hidden="true" />
                      {business.is_active ? "Active" : "Inactive"}
                    </span>
                  </span>
                </div>
                {business.description && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">{business.description}</p>
                )}
                <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                  {business.store_id ? (
                    <span className="truncate text-xs text-muted-foreground">ID: {business.store_id}</span>
                  ) : <span />}
                  <Link
                    to={`/business/${business.id}`}
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    Open Business
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
        </>
      )}
    </div>
  );
}
