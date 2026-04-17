"use client";

import { StepCard } from "@/components/ui/StepCard";
import { WizardProvider, useWizard } from "./WizardProvider";
import { WIZARD_STEPS } from "./wizardSteps";

export function WizardShell() {
  return (
    <WizardProvider>
      <WizardShellContent />
    </WizardProvider>
  );
}

function WizardShellContent() {
  const { actions, payloadResult, state, summary } = useWizard();
  const currentStep = WIZARD_STEPS.find((step) => step.id === state.currentStepId);
  const currentStepNumber = currentStep?.numero ?? 1;
  const canGoBack = currentStepNumber > 1;
  const canGoForward = currentStepNumber < WIZARD_STEPS.length;

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

        <div className="mt-5 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4">
          <p className="text-sm font-semibold">
            Step corrente: {currentStep?.titolo ?? "Dati cliente e sopralluogo"}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Bozza salvata nel browser. Falde inserite: {summary.surfaces_count}.
            Ostacoli inseriti: {summary.obstacles_count}.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canGoBack}
              type="button"
              onClick={actions.vaiIndietro}
            >
              Indietro
            </button>
            <button
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canGoForward}
              type="button"
              onClick={actions.vaiAvanti}
            >
              Continua
            </button>
          </div>
        </div>

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
          Stato wizard inizializzato, persistito nel browser e pronto per i form
          dei prossimi step. Payload finale:{" "}
          {payloadResult.ok ? "costruibile" : "in attesa dei dati obbligatori"}.
        </div>
      </aside>
    </section>
  );
}
