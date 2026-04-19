import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { ProfiliClientiPage } from "@/features/profili/ProfiliClientiPage";

export default function ImpostazioniPage() {
  return (
    <AppShell>
      <Link
        className="mb-3 inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        href="/"
      >
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            d="M15 6l-6 6 6 6"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
          />
        </svg>
        Torna al sopralluogo
      </Link>
      <ProfiliClientiPage />
    </AppShell>
  );
}
