import { AppShell } from "@/components/layout/AppShell";
import { WizardShell } from "@/features/wizard/WizardShell";
import { WizardProvider } from "@/features/wizard/WizardProvider";

export default function HomePage() {
  return (
    <WizardProvider>
      <AppShell>
        <WizardShell />
      </AppShell>
    </WizardProvider>
  );
}
