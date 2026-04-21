"use client";

import { useEffect, useState } from "react";
import type { RoofType } from "@/types/domain";
import { FaldeStep } from "@/features/falde/FaldeStep";
import { ensureSurfaceCount } from "@/features/falde/surfaceFactory";
import { useWizard } from "@/features/wizard/WizardProvider";

const ROOF_TYPE_OPTIONS: Array<{
  value: RoofType;
  label: string;
  description: string;
  defaultSurfaceCount: number;
}> = [
  {
    value: "falda_unica",
    label: "Falda unica",
    description: "Una superficie principale.",
    defaultSurfaceCount: 1,
  },
  {
    value: "due_falde",
    label: "Due falde",
    description: "Due superfici principali.",
    defaultSurfaceCount: 2,
  },
  {
    value: "due_falde_asimmetriche",
    label: "Due falde asimmetriche",
    description: "Due superfici con misure diverse.",
    defaultSurfaceCount: 2,
  },
  {
    value: "quattro_falde_padiglione",
    label: "Quattro falde",
    description: "Copertura a padiglione.",
    defaultSurfaceCount: 4,
  },
  {
    value: "tetto_a_l",
    label: "Tetto a L",
    description: "Copertura con impronta a L.",
    defaultSurfaceCount: 4,
  },
  {
    value: "shed",
    label: "Shed",
    description: "Falde ripetute.",
    defaultSurfaceCount: 3,
  },
  {
    value: "piu_falde_personalizzato",
    label: "Personalizzato",
    description: "Numero falde libero.",
    defaultSurfaceCount: 3,
  },
];

export function TettoStep() {
  const { actions, state } = useWizard();
  const selectedRoofType = state.roof.roof_type;
  const [roofTypeOpen, setRoofTypeOpen] = useState(!selectedRoofType);
  const selectedOption = ROOF_TYPE_OPTIONS.find(
    (option) => option.value === selectedRoofType,
  );
  const customSurfaceCount = state.roof.custom_surface_count;
  const plannedSurfaceCount =
    selectedRoofType === "piu_falde_personalizzato"
      ? customSurfaceCount ?? 0
      : selectedOption?.defaultSurfaceCount ?? 0;

  useEffect(() => {
    if (!selectedRoofType) {
      setRoofTypeOpen(true);
    }
  }, [selectedRoofType]);

  function handleSelectRoofType(option: (typeof ROOF_TYPE_OPTIONS)[number]) {
    actions.impostaTipoTetto(option.value);
    setRoofTypeOpen(false);

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
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">Tetto e falde</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Scegli il tipo di tetto e compila le falde principali.
        </p>
      </div>

      <details
        className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-3"
        open={roofTypeOpen}
        onToggle={(event) => setRoofTypeOpen(event.currentTarget.open)}
      >
        <summary className="cursor-pointer list-none">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Tipo di tetto</p>
              <p className="mt-0.5 truncate text-sm text-[var(--muted)]">
                {selectedOption
                  ? `Tipo tetto: ${selectedOption.label}`
                  : "Scegli il tipo di tetto"}
              </p>
            </div>
            <span className="shrink-0 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)]">
              {roofTypeOpen ? "Chiudi" : "Cambia"}
            </span>
          </div>
        </summary>

        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {ROOF_TYPE_OPTIONS.map((option) => {
            const selected = selectedRoofType === option.value;

            return (
              <button
                key={option.value}
                className={`rounded-lg border p-3 text-left transition ${
                  selected
                    ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                    : "border-[var(--border)] bg-white hover:border-[var(--accent)]"
                }`}
                type="button"
                onClick={() => handleSelectRoofType(option)}
              >
                <span className="block text-sm font-semibold">
                  {option.label}
                </span>
                <span className="mt-1 block text-xs text-[var(--muted)]">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>

        {selectedRoofType === "piu_falde_personalizzato" && (
          <label className="mt-4 block max-w-xs text-sm font-medium">
            Numero falde
            <input
              className="mt-2 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              min={1}
              max={12}
              placeholder="Esempio: 3"
              type="number"
              value={customSurfaceCount ? String(customSurfaceCount) : ""}
              onChange={(event) =>
                actions.impostaNumeroFaldePersonalizzato(
                  readSurfaceCount(event.target.value),
                )
              }
            />
          </label>
        )}
      </details>

      {selectedRoofType && (
        <div className="flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Struttura falde</p>
            <p className="text-sm text-[var(--muted)]">
              Falde presenti:{" "}
              <strong className="text-[var(--foreground)]">
                {state.roof.surfaces.length}
              </strong>
            </p>
          </div>
          <button
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-foreground)] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!selectedRoofType || !plannedSurfaceCount}
            type="button"
            onClick={handlePrepareSurfaces}
          >
            Aggiorna falde
          </button>
        </div>
      )}

      {(selectedRoofType || state.roof.surfaces.length > 0) && (
        <FaldeStep embedded />
      )}
    </div>
  );
}

function readSurfaceCount(value: string): number | null {
  if (value.trim() === "") {
    return null;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  return Math.min(12, Math.max(1, Math.floor(numericValue)));
}
