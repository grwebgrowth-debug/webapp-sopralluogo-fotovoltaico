"use client";

import type { ReactNode } from "react";
import { ClienteStep } from "@/features/cliente/ClienteStep";
import { ComponentiImpiantoStep } from "@/features/componenti-impianto/ComponentiImpiantoStep";
import { FotoStep } from "@/features/foto/FotoStep";
import { OstacoliStep } from "@/features/ostacoli/OstacoliStep";
import { PannelloStep } from "@/features/pannelli/PannelloStep";
import { RevisioneStep } from "@/features/revisione/RevisioneStep";
import { TettoStep } from "@/features/tetto/TettoStep";
import type { WizardStepId } from "@/types/domain";
import { LayoutModuliStep } from "./LayoutModuliStep";
import { useWizard } from "./WizardProvider";
import { validateWizardStep } from "./wizardValidation";
import { WIZARD_STEPS } from "./wizardSteps";
import type { WizardSummary } from "./wizardState";

export function WizardShell() {
  return <WizardShellContent />;
}

function WizardShellContent() {
  const { actions, payloadResult, state, summary } = useWizard();
  const currentStep = WIZARD_STEPS.find((step) => step.id === state.currentStepId);
  const currentStepNumber = currentStep?.numero ?? 1;
  const canGoBack = currentStepNumber > 1;
  const canGoForward = currentStepNumber < WIZARD_STEPS.length;
  const stepValidation = validateWizardStep(state, state.currentStepId);
  const isLayoutStep = state.currentStepId === "layout_moduli";
  const layoutAlreadyCalculated = Boolean(state.preliminary_layout);
  const canCalculateLayout =
    state.panel_technical_data.width_cm > 0 &&
    state.panel_technical_data.height_cm > 0 &&
    state.panel_technical_data.power_w > 0 &&
    state.roof.surfaces.length > 0;
  const primaryLabel =
    isLayoutStep && !layoutAlreadyCalculated
      ? "Calcola layout"
      : canGoForward
        ? "Continua"
        : "Completato";
  const primaryDisabled =
    isLayoutStep && !layoutAlreadyCalculated
      ? !canCalculateLayout
      : !canGoForward || !stepValidation.valid;

  function handleGoForward() {
    if (!stepValidation.valid) {
      return;
    }

    actions.vaiAvanti();
  }

  function handlePrimaryAction() {
    if (isLayoutStep && !layoutAlreadyCalculated) {
      window.dispatchEvent(new CustomEvent("wizard:calculate-layout"));
      return;
    }

    handleGoForward();
  }

  return (
    <section className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 pb-14 shadow-2xl shadow-black/20 sm:p-5 sm:pb-5">
        <StepProgress
          actions={actions}
          completedStepIds={state.completedStepIds}
          currentStepId={state.currentStepId}
          currentStepNumber={currentStepNumber}
        />

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

        <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2.5 shadow-2xl shadow-black/40 backdrop-blur sm:static sm:mt-6 sm:flex-wrap sm:border-t sm:bg-transparent sm:p-0 sm:pt-4 sm:shadow-none">
          <button
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            disabled={!canGoBack}
            type="button"
            onClick={actions.vaiIndietro}
          >
            Indietro
          </button>
          <button
            className="flex-1 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-[var(--accent-foreground)] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            disabled={primaryDisabled}
            type="button"
            onClick={handlePrimaryAction}
          >
            {primaryLabel}
          </button>
        </div>
      </div>

      <aside className="min-w-0 space-y-4">
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

type StepProgressProps = {
  actions: ReturnType<typeof useWizard>["actions"];
  completedStepIds: WizardStepId[];
  currentStepId: WizardStepId;
  currentStepNumber: number;
};

function StepProgress({
  actions,
  completedStepIds,
  currentStepId,
  currentStepNumber,
}: StepProgressProps) {
  const currentStep = WIZARD_STEPS.find((step) => step.id === currentStepId);

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate text-sm font-semibold">
          Step {currentStepNumber} di {WIZARD_STEPS.length} -{" "}
          {currentStep?.titolo ?? "Sopralluogo"}
        </p>
      </div>
      <div
        className="mt-3 grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${WIZARD_STEPS.length}, minmax(0, 1fr))` }}
      >
        {WIZARD_STEPS.map((step) => {
          const active = step.id === currentStepId;
          const pastStep = step.numero < currentStepNumber;
          const completedStep = completedStepIds.includes(step.id);
          const selectable = active || pastStep || completedStep;

          return (
            <button
              key={step.id}
              aria-label={`Vai a ${step.titolo}`}
              className={`h-2.5 rounded-full transition ${
                active
                  ? "bg-[var(--accent)]"
                  : pastStep || completedStep
                    ? "bg-[var(--success)]"
                    : "bg-[var(--border)]"
              } disabled:cursor-not-allowed disabled:opacity-60`}
              disabled={!selectable}
              title={step.titolo}
              type="button"
              onClick={() => actions.cambiaStep(step.id)}
            />
          );
        })}
      </div>
    </div>
  );
}

const STEP_RENDERERS: Record<WizardStepId, () => ReactNode> = {
  cliente: () => <ClienteStep />,
  tetto: () => <TettoStep />,
  ostacoli: () => <OstacoliStep />,
  pannello: () => <PannelloStep />,
  layout_moduli: () => <LayoutModuliStep />,
  componenti_impianto: () => <ComponentiImpiantoStep />,
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
