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
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        {children}
      </div>
    </main>
  );
}
