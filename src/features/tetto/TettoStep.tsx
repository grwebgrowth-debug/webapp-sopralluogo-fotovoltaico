"use client";

import type { RoofType } from "@/types/domain";
import { useWizard } from "@/features/wizard/WizardProvider";
import { ensureSurfaceCount } from "@/features/falde/surfaceFactory";

const ROOF_TYPE_OPTIONS: Array<{
  value: RoofType;
  label: string;
  description: string;
  defaultSurfaceCount: number;
}> = [
  {
    value: "falda_unica",
    label: "Falda unica",
    description: "Una sola superficie di posa principale.",
    defaultSurfaceCount: 1,
  },
  {
    value: "due_falde",
    label: "Due falde",
    description: "Due falde principali con dimensioni simili.",
    defaultSurfaceCount: 2,
  },
  {
    value: "due_falde_asimmetriche",
    label: "Due falde asimmetriche",
    description: "Due falde principali con geometrie diverse.",
    defaultSurfaceCount: 2,
  },
  {
    value: "quattro_falde_padiglione",
    label: "Quattro falde / padiglione",
    description: "Tetto composto da quattro falde.",
    defaultSurfaceCount: 4,
  },
  {
    value: "tetto_a_l",
    label: "Tetto a L",
    description: "Configurazione pratica per coperture con impronta a L.",
    defaultSurfaceCount: 4,
  },
  {
    value: "shed",
    label: "Shed",
    description: "Sequenza di falde ripetute, tipica di coperture produttive.",
    defaultSurfaceCount: 3,
  },
  {
    value: "piu_falde_personalizzato",
    label: "Più falde personalizzato",
    description: "Numero falde definito dal tecnico.",
    defaultSurfaceCount: 3,
  },
];

export function TettoStep() {
  const { actions, state } = useWizard();
  const selectedRoofType = state.roof.roof_type;
  const selectedOption = ROOF_TYPE_OPTIONS.find(
    (option) => option.value === selectedRoofType,
  );
  const customSurfaceCount = state.roof.custom_surface_count ?? 3;
  const plannedSurfaceCount =
    selectedRoofType === "piu_falde_personalizzato"
      ? customSurfaceCount
      : selectedOption?.defaultSurfaceCount ?? 0;

  function handleSelectRoofType(option: (typeof ROOF_TYPE_OPTIONS)[number]) {
    actions.impostaTipoTetto(option.value);

    if (state.roof.surfaces.length === 0) {
      actions.sostituisciFalde(
        ensureSurfaceCount(state.roof.surfaces, option.defaultSurfaceCount),
      );
    }
  }

  function handlePrepareSurfaces() {
    if (!plannedSurfaceCount) {
      return;
    }

    actions.sostituisciFalde(
      ensureSurfaceCount(state.roof.surfaces, plannedSurfaceCount),
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Tipo di tetto</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Scegli la configurazione più vicina al caso reale. Le falde preparate
          qui saranno compilate nello step successivo.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {ROOF_TYPE_OPTIONS.map((option) => {
          const selected = selectedRoofType === option.value;

          return (
            <button
              key={option.value}
              className={`rounded-lg border p-4 text-left transition ${
                selected
                  ? "border-[var(--accent)] bg-[var(--surface-soft)]"
                  : "border-[var(--border)] bg-white hover:border-[var(--accent)]"
              }`}
              type="button"
              onClick={() => handleSelectRoofType(option)}
            >
              <span className="block text-base font-semibold">
                {option.label}
              </span>
              <span className="mt-2 block text-sm leading-6 text-[var(--muted)]">
                {option.description}
              </span>
              <span className="mt-3 block text-xs text-[var(--muted)]">
                Falde iniziali: {option.defaultSurfaceCount}
              </span>
            </button>
          );
        })}
      </div>

      {selectedRoofType === "piu_falde_personalizzato" && (
        <label className="block max-w-xs text-sm font-medium">
          Numero falde
          <input
            className="mt-2 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            min={1}
            max={12}
            type="number"
            value={customSurfaceCount}
            onChange={(event) =>
              actions.impostaNumeroFaldePersonalizzato(
                clampSurfaceCount(event.target.valueAsNumber),
              )
            }
          />
        </label>
      )}

      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm">
        <p className="font-semibold">
          Falde attualmente presenti: {state.roof.surfaces.length}
        </p>
        <p className="mt-1 text-[var(--muted)]">
          Puoi preparare o riallineare l’elenco delle falde senza introdurre
          ancora logica geometrica automatica.
        </p>
        <button
          className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!selectedRoofType}
          type="button"
          onClick={handlePrepareSurfaces}
        >
          Prepara falde
        </button>
      </div>
    </div>
  );
}

function clampSurfaceCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.min(12, Math.max(1, Math.floor(value)));
}
