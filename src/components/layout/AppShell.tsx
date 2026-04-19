import type { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { ProfileThemeBridge } from "@/features/profili/ProfileThemeBridge";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <ProfileThemeBridge />
      <AppHeader />
      <div className="mx-auto max-w-7xl px-3 py-3 sm:px-5 lg:py-5">
        {children}
      </div>
    </main>
  );
}
