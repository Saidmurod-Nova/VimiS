import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Construction } from "lucide-react";

export default function PlatformPlaceholder({ title, description, linkTo, linkLabel }) {
  return (
    <section className="mx-auto flex min-h-[55vh] max-w-2xl flex-col items-center justify-center px-4 py-12 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Construction className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">VireonSpes</p>
      <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">{description}</p>
      <Link
        to={linkTo}
        className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
      >
        {linkLabel}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </section>
  );
}
