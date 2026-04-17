import { AppHeader } from "@/components/layout/AppHeader";
import { WizardShell } from "@/features/wizard/WizardShell";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <AppHeader />
      <div className="mx-auto max-w-7xl px-6 py-8">
        <WizardShell />
      </div>
    </main>
  );
}
