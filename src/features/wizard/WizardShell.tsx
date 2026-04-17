"use client";

import { ClienteStep } from "@/features/cliente/ClienteStep";
import { FaldeStep } from "@/features/falde/FaldeStep";
import { OstacoliStep } from "@/features/ostacoli/OstacoliStep";
import { PannelloStep } from "@/features/pannelli/PannelloStep";
import { RevisioneStep } from "@/features/revisione/RevisioneStep";
import { TettoStep } from "@/features/tetto/TettoStep";
import { LayoutModuliStep } from "./LayoutModuliStep";
import { WizardProvider, useWizard } from "./WizardProvider";
import { validateWizardStep } from "./wizardValidation";
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
  const stepValidation = validateWizardStep(state, state.currentStepId);

  function handleGoForward() {
    if (!stepValidation.valid) {
      return;
    }

    actions.vaiAvanti();
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="mb-6">
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Wizard sopralluogo
          </p>
          <h1 className="text-2xl font-semibold">
            {currentStep?.titolo ?? "Dati cliente e sopralluogo"}
          </h1>
        </div>

        {renderCurrentStep(state.currentStepId)}

        {stepValidation.errors.length > 0 && (
          <div className="mt-6 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <p className="text-sm font-semibold">
              Controlla questi dati prima di continuare:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
              {stepValidation.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
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
            disabled={!canGoForward || !stepValidation.valid}
            type="button"
            onClick={handleGoForward}
          >
            Continua
          </button>
        </div>
      </div>

      <aside className="space-y-6">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Step
          </p>
          <div className="space-y-2">
            {WIZARD_STEPS.map((step) => {
              const active = step.id === state.currentStepId;
              const pastStep = step.numero < currentStepNumber;
              const completedStep = state.completedStepIds.includes(step.id);
              const selectable = active || pastStep || completedStep;

              return (
                <button
                  key={step.id}
                  className={`w-full rounded-lg border px-3 py-3 text-left text-sm ${
                    active
                      ? "border-[var(--accent)] bg-[var(--surface-soft)]"
                      : "border-[var(--border)] bg-white"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                  disabled={!selectable}
                  type="button"
                  onClick={() => actions.cambiaStep(step.id)}
                >
                  <span className="block font-semibold">
                    {step.numero}. {step.titolo}
                  </span>
                  <span className="mt-1 block text-xs text-[var(--muted)]">
                    {active
                      ? "Step corrente"
                      : pastStep || completedStep
                        ? "Modifica dati"
                        : "Disponibile più avanti"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            Riepilogo bozza
          </p>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-[var(--muted)]">Cliente</dt>
              <dd className="font-medium">
                {summary.customer_full_name || "Non indicato"}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Falde inserite</dt>
              <dd className="font-medium">{summary.surfaces_count}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Ostacoli inseriti</dt>
              <dd className="font-medium">{summary.obstacles_count}</dd>
            </div>
            <div>
              <dt className="text-[var(--muted)]">Payload finale</dt>
              <dd className="font-medium">
                {payloadResult.ok
                  ? "Costruibile"
                  : "In attesa dei dati obbligatori"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-5 text-sm leading-6 text-[var(--muted)]">
          La bozza viene salvata nel browser. Ricaricando la pagina, i dati
          compilati restano disponibili senza usare database o backend.
        </div>
      </aside>
    </section>
  );
}

function renderCurrentStep(stepId: string) {
  switch (stepId) {
    case "cliente":
      return <ClienteStep />;
    case "tetto":
      return <TettoStep />;
    case "falde":
      return <FaldeStep />;
    case "ostacoli":
      return <OstacoliStep />;
    case "pannello":
      return <PannelloStep />;
    case "layout_moduli":
      return <LayoutModuliStep />;
    case "revisione":
      return <RevisioneStep />;
    case "invio":
      return (
        <StepPlaceholder
          title="Invio a n8n"
          description="L’invio reale non è ancora implementato in questa fase."
        />
      );
    default:
      return null;
  }
}

type StepPlaceholderProps = {
  title: string;
  description: string;
};

function StepPlaceholder({ title, description }: StepPlaceholderProps) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-5">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        {description}
      </p>
    </div>
  );
}
