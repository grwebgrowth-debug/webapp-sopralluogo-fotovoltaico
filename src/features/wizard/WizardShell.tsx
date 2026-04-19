"use client";

import type { ReactNode } from "react";
import { ClienteStep } from "@/features/cliente/ClienteStep";
import { FotoStep } from "@/features/foto/FotoStep";
import { OstacoliStep } from "@/features/ostacoli/OstacoliStep";
import { PannelloStep } from "@/features/pannelli/PannelloStep";
import { RevisioneStep } from "@/features/revisione/RevisioneStep";
import { TettoStep } from "@/features/tetto/TettoStep";
import type { WizardStepId } from "@/types/domain";
import { LayoutModuliStep } from "./LayoutModuliStep";
import { WizardProvider, useWizard } from "./WizardProvider";
import { validateWizardStep } from "./wizardValidation";
import { WIZARD_STEPS } from "./wizardSteps";
import type { WizardSummary } from "./wizardState";

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
    <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 pb-28 shadow-2xl shadow-black/20 sm:p-6 sm:pb-6">
        <div className="mb-5 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
            Step {currentStepNumber} di {WIZARD_STEPS.length}
          </p>
          <h2 className="mt-1 text-xl font-semibold">
            {currentStep?.titolo ?? "Sopralluogo"}
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
            {currentStep?.descrizione ?? "Compila i dati del sopralluogo."}
          </p>
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

        <div className="fixed inset-x-0 bottom-0 z-20 flex gap-3 border-t border-[var(--border)] bg-[color:rgba(16,32,29,0.96)] p-4 shadow-2xl shadow-black/40 backdrop-blur sm:static sm:mt-8 sm:flex-wrap sm:border-t sm:bg-transparent sm:p-0 sm:pt-5 sm:shadow-none">
          <button
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:py-2"
            disabled={!canGoBack}
            type="button"
            onClick={actions.vaiIndietro}
          >
            Indietro
          </button>
          <button
            className="flex-1 rounded-lg bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:py-2"
            disabled={!canGoForward || !stepValidation.valid}
            type="button"
            onClick={handleGoForward}
          >
            {canGoForward ? "Continua" : "Completato"}
          </button>
        </div>
      </div>

      <aside className="space-y-5">
        <div className="hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 lg:block">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
              Percorso
            </p>
            <p className="text-xs text-[var(--muted)]">
              {currentStepNumber}/{WIZARD_STEPS.length}
            </p>
          </div>
          <div className="space-y-2">
            {WIZARD_STEPS.map((step) => {
              const active = step.id === state.currentStepId;
              const pastStep = step.numero < currentStepNumber;
              const completedStep = state.completedStepIds.includes(step.id);
              const selectable = active || pastStep || completedStep;
              const statusLabel = active
                ? "Corrente"
                : pastStep || completedStep
                  ? "Completato"
                  : "Da fare";

              return (
                <button
                  key={step.id}
                  className={`w-full rounded-lg border px-3 py-3 text-left text-sm transition ${
                    active
                      ? "border-[var(--accent)] bg-[color:rgba(20,184,166,0.12)]"
                      : pastStep || completedStep
                        ? "border-[var(--border)] bg-[var(--surface-elevated)] hover:border-[var(--accent)]"
                        : "border-[var(--border)] bg-[var(--surface-soft)]"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                  disabled={!selectable}
                  type="button"
                  onClick={() => actions.cambiaStep(step.id)}
                >
                  <span className="flex items-center gap-3">
                    <span
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                        active
                          ? "border-[var(--accent)] text-[var(--accent)]"
                          : pastStep || completedStep
                            ? "border-[var(--success)] text-[var(--success)]"
                            : "border-[var(--border)] text-[var(--muted)]"
                      }`}
                    >
                      {step.numero}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">
                        {step.titolo}
                      </span>
                      <span className="mt-0.5 block text-xs text-[var(--muted)]">
                        {statusLabel}
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <details className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 lg:hidden">
          <summary className="cursor-pointer text-sm font-semibold">
            Sintesi sopralluogo
          </summary>
          <SummaryGrid payloadReady={payloadResult.ok} summary={summary} />
        </details>

        <div className="hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 lg:block">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
            Sintesi
          </p>
          <SummaryGrid payloadReady={payloadResult.ok} summary={summary} />
        </div>
      </aside>
    </section>
  );
}

const STEP_RENDERERS: Record<WizardStepId, () => ReactNode> = {
  cliente: () => <ClienteStep />,
  tetto: () => <TettoStep />,
  ostacoli: () => <OstacoliStep />,
  pannello: () => <PannelloStep />,
  layout_moduli: () => <LayoutModuliStep />,
  foto: () => <FotoStep />,
  revisione: () => <RevisioneStep />,
};

function renderCurrentStep(stepId: WizardStepId) {
  return STEP_RENDERERS[stepId]();
}

type SummaryGridProps = {
  payloadReady: boolean;
  summary: WizardSummary;
};

function SummaryGrid({ payloadReady, summary }: SummaryGridProps) {
  return (
    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
      <SummaryTile
        label="Cliente"
        value={summary.customer_full_name || "Da completare"}
      />
      <SummaryTile label="Falde" value={String(summary.surfaces_count)} />
      <SummaryTile label="Ostacoli" value={String(summary.obstacles_count)} />
      <SummaryTile label="Moduli" value={String(summary.layout_modules_count)} />
      <SummaryTile label="Foto" value={String(summary.photos_count)} />
      <SummaryTile label="Invio" value={payloadReady ? "Pronto" : "In attesa"} />
    </dl>
  );
}

type SummaryTileProps = {
  label: string;
  value: string;
};

function SummaryTile({ label, value }: SummaryTileProps) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-3">
      <dt className="text-xs text-[var(--muted)]">{label}</dt>
      <dd className="mt-1 truncate text-sm font-semibold">{value}</dd>
    </div>
  );
}
