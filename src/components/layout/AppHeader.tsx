"use client";

import Link from "next/link";
import { useClientProfiles } from "@/lib/clientProfiles";

export function AppHeader() {
  const { activeProfile } = useClientProfiles();

  return (
    <header className="border-b border-[var(--border)] bg-[color:rgba(16,32,29,0.92)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            {activeProfile?.company_name || "Web app V1"}
          </p>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            Sopralluogo fotovoltaico
          </h1>
        </div>
        <nav className="flex flex-wrap items-center gap-2">
          <Link
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-sm text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--foreground)]"
            href="/"
          >
            Wizard
          </Link>
          <Link
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-sm text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--foreground)]"
            href="/impostazioni"
          >
            Impostazioni
          </Link>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-sm text-[var(--muted)]">
            Misure in centimetri
          </div>
        </nav>
      </div>
    </header>
  );
}
