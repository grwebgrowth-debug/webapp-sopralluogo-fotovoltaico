export function AppHeader() {
  return (
    <header className="border-b border-[var(--border)] bg-[color:rgba(16,32,29,0.92)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Web app V1
          </p>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">
            Sopralluogo fotovoltaico
          </h1>
        </div>
        <div className="w-fit rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1 text-sm text-[var(--muted)]">
          Misure in centimetri
        </div>
      </div>
    </header>
  );
}
