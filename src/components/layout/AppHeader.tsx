export function AppHeader() {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--card)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            V1 Base Progetto
          </p>
          <h1 className="text-xl font-semibold">
            Web App Sopralluogo Fotovoltaico
          </h1>
        </div>
        <div className="rounded-full border border-[var(--border)] px-3 py-1 text-sm text-[var(--muted)]">
          Next.js + TypeScript
        </div>
      </div>
    </header>
  );
}
