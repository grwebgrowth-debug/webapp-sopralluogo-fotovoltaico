export function AppHeader() {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Base V1
          </p>
          <h1 className="text-xl font-semibold">Sopralluogo fotovoltaico</h1>
        </div>
        <div className="rounded-lg border border-[var(--border)] px-3 py-1 text-sm text-[var(--muted)]">
          Misure in centimetri
        </div>
      </div>
    </header>
  );
}
