"use client";

import { StepCard } from "@/components/ui/StepCard";
import { WIZARD_STEPS } from "./wizardSteps";

export function WizardShell() {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          Stato attuale
        </p>
        <h2 className="mb-3 text-2xl font-semibold">Base strutturale V1 pronta</h2>
        <p className="max-w-3xl text-sm leading-7 text-[var(--muted)]">
          La struttura è allineata agli step definitivi. La logica completa del
          wizard, della geometria e dell’integrazione n8n resta separata e verrà
          completata nei passaggi successivi.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {WIZARD_STEPS.map((step) => (
            <StepCard
              key={step.numero}
              numero={step.numero}
              titolo={step.titolo}
              descrizione={step.descrizione}
            />
          ))}
        </div>
      </div>

      <aside className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          Vincoli fissi
        </p>
        <ul className="space-y-3 text-sm leading-6 text-[var(--muted)]">
          <li>UI interamente in italiano</li>
          <li>Misure in centimetri</li>
          <li>Nessun database nella V1</li>
          <li>Google Sheet come catalogo pannelli</li>
          <li>n8n come orchestratore</li>
          <li>Revisione finale obbligatoria prima dell’invio</li>
          <li>Geometria deterministica, non affidata a un agente</li>
        </ul>

        <div className="mt-6 rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm text-[var(--muted)]">
          Prossimo passo: implementare lo stato del wizard mantenendo i dati già
          inseriti quando si torna indietro.
        </div>
      </aside>
    </section>
  );
}
