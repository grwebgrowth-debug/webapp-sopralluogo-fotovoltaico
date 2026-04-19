"use client";

import Link from "next/link";
import { useClientProfiles } from "@/lib/clientProfiles";

export function AppHeader() {
  const { activeProfile } = useClientProfiles();

  return (
    <header className="border-b border-[var(--border)] bg-[color:rgba(16,32,29,0.94)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
            {activeProfile?.company_name || "Profilo non impostato"}
          </p>
          <h1 className="truncate text-base font-semibold text-[var(--foreground)] sm:text-lg">
            Sopralluogo fotovoltaico
          </h1>
        </div>
        <nav className="flex shrink-0 items-center">
          <Link
            aria-label="Impostazioni"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] text-lg leading-none text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--foreground)]"
            href="/impostazioni"
          >
            ⚙
          </Link>
        </nav>
      </div>
    </header>
  );
}
