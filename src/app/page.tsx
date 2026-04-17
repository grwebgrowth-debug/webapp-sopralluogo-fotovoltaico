import { AppShell } from "@/components/layout/AppShell";
import { WizardShell } from "@/features/wizard/WizardShell";

export default function HomePage() {
  return (
    <AppShell>
      <WizardShell />
    </AppShell>
  );
}
