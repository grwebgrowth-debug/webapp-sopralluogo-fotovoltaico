import type { ReactNode } from "react";
import { AppHeader } from "./AppHeader";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <AppHeader />
      <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
    </main>
  );
}
