"use client";

import { useEffect, useState } from "react";
import type { SurfaceShape } from "@/types/domain";
import type { SurfaceData } from "@/types/survey";
import { useWizard } from "@/features/wizard/WizardProvider";
import {
  createDefaultDimensions,
  createDefaultSurface,
} from "./surfaceFactory";

const SHAPE_OPTIONS: Array<{ value: SurfaceShape; label: string }> = [
  { value: "rectangular", label: "Rettangolare" },
  { value: "trapezoid", label: "Trapezio" },
  { value: "triangle", label: "Triangolo" },
  { value: "guided_quad", label: "Irregolare" },
];

const inputClassName =
  "mt-1.5 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]";
const labelClassName = "text-sm font-medium";

type FaldeStepProps = {
  embedded?: boolean;
};

export function FaldeStep({ embedded = false }: FaldeStepProps) {
  const { actions, state } = useWizard();
  const surfaces = state.roof.surfaces;
  const [openSurfaceId, setOpenSurfaceId] = useState(
    surfaces[0]?.surface_id ?? "",
  );

  useEffect(() => {
    if (surfaces.length === 0) {
      setOpenSurfaceId("");
      return;
    }

    if (!surfaces.some((surface) => surface.surface_id === openSurfaceId)) {
      setOpenSurfaceId(surfaces[0].surface_id);
    }
  }, [openSurfaceId, surfaces]);

  function replaceSurface(surfaceId: string, nextSurface: SurfaceData) {
    actions.sostituisciFalde(
      surfaces.map((surface) =>
        surface.surface_id === surfaceId ? nextSurface : surface,
      ),
    );
  }

  function updateSurface(
    surfaceId: string,
    updater: (surface: SurfaceData) => SurfaceData,
  ) {
    actions.sostituisciFalde(
      surfaces.map((surface) =>
        surface.surface_id === surfaceId ? updater(surface) : surface,
      ),
    );
  }

  function addSurface() {
    const nextSurface = createDefaultSurface(surfaces.length + 1);
    actions.sostituisciFalde([...surfaces, nextSurface]);
    setOpenSurfaceId(nextSurface.surface_id);
  }

  function removeSurface(surfaceId: string) {
    actions.sostituisciFalde(
      surfaces.filter((surface) => surface.surface_id !== surfaceId),
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      {!embedded && (
        <div>
          <h2 className="text-2xl font-semibold">Falde</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            Inserisci forma, orientamento e misure principali.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Falde del tetto</p>
          <p className="text-sm text-[var(--muted)]">
            {surfaces.length} {surfaces.length === 1 ? "falda" : "falde"}
          </p>
        </div>
        <button
          className="shrink-0 rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-semibold text-slate-950"
          type="button"
          onClick={addSurface}
        >
          Aggiungi falda
        </button>
      </div>

      {surfaces.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-5 text-sm text-[var(--muted)]">
          Seleziona un tipo di tetto o aggiungi una falda manualmente.
        </div>
      ) : (
        <div className="space-y-3">
          {surfaces.map((surface, index) => {
            const isOpen = surface.surface_id === openSurfaceId;

            return (
              <section
                key={surface.surface_id}
                className="min-w-0 rounded-lg border border-[var(--border)] bg-white p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    className="min-w-0 flex-1 text-left"
                    type="button"
                    onClick={() => setOpenSurfaceId(surface.surface_id)}
                  >
                    <span className="block text-sm font-semibold">
                      Falda {index + 1}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-[var(--muted)]">
                      {getSurfacePreview(surface)}
                    </span>
                  </button>
                  <div className="flex shrink-0 gap-2">
                    <button
                      className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs md:hidden"
                      type="button"
                      onClick={() => setOpenSurfaceId(surface.surface_id)}
                    >
                      {isOpen ? "Aperta" : "Apri"}
                    </button>
                    {surfaces.length > 1 && (
                      <button
                        className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--danger)]"
                        type="button"
                        onClick={() => removeSurface(surface.surface_id)}
                      >
                        Elimina
                      </button>
                    )}
                  </div>
                </div>

                <div className={`mt-3 ${isOpen ? "block" : "hidden"} md:block`}>
                  <div className="grid min-w-0 gap-3 md:grid-cols-2">
                    <label className={labelClassName}>
                      Nome falda *
                      <input
                        className={inputClassName}
                        value={surface.name}
                        onChange={(event) =>
                          updateSurface(surface.surface_id, (currentSurface) => ({
                            ...currentSurface,
                            name: event.target.value,
                          }))
                        }
                      />
                    </label>

                    <label className={labelClassName}>
                      Forma *
                      <select
                        className={inputClassName}
                        value={surface.shape}
                        onChange={(event) => {
                          const nextShape = event.target.value as SurfaceShape;
                          replaceSurface(
                            surface.surface_id,
                            changeSurfaceShape(surface, nextShape),
                          );
                        }}
                      >
                        {SHAPE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className={labelClassName}>
                      Orientamento *
                      <input
                        className={inputClassName}
                        placeholder="Esempio: Sud"
                        value={surface.orientation}
                        onChange={(event) =>
                          updateSurface(surface.surface_id, (currentSurface) => ({
                            ...currentSurface,
                            orientation: event.target.value,
                          }))
                        }
                      />
                    </label>

                    {renderDimensionFields(surface, updateSurface)}
                  </div>

                  <details className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-3">
                    <summary className="cursor-pointer text-sm font-semibold">
                      Dettagli falda
                    </summary>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <label className={labelClassName}>
                        Inclinazione
                        <input
                          className={inputClassName}
                          min={0}
                          placeholder="Esempio: 20"
                          type="number"
                          value={formatNumberInput(surface.tilt_deg)}
                          onChange={(event) =>
                            updateSurface(
                              surface.surface_id,
                              (currentSurface) => ({
                                ...currentSurface,
                                tilt_deg: readNonNegativeNumber(
                                  event.target.value,
                                ),
                              }),
                            )
                          }
                        />
                      </label>

                      <label className={labelClassName}>
                        Distanza bordo posa
                        <input
                          className={inputClassName}
                          min={0}
                          placeholder="Esempio: 30"
                          type="number"
                          value={formatNumberInput(surface.edge_clearance_cm)}
                          onChange={(event) =>
                            updateSurface(
                              surface.surface_id,
                              (currentSurface) => ({
                                ...currentSurface,
                                edge_clearance_cm: readNonNegativeNumber(
                                  event.target.value,
                                ),
                              }),
                            )
                          }
                        />
                      </label>

                      <label className={`${labelClassName} md:col-span-2`}>
                        Note
                        <textarea
                          className={`${inputClassName} min-h-20 resize-y`}
                          value={surface.notes}
                          onChange={(event) =>
                            updateSurface(
                              surface.surface_id,
                              (currentSurface) => ({
                                ...currentSurface,
                                notes: event.target.value,
                              }),
                            )
                          }
                        />
                      </label>
                    </div>
                  </details>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function renderDimensionFields(
  surface: SurfaceData,
  updateSurface: (
    surfaceId: string,
    updater: (surface: SurfaceData) => SurfaceData,
  ) => void,
) {
  switch (surface.shape) {
    case "rectangular":
      return (
        <>
          {renderNumberField("Larghezza", surface.dimensions.width_cm, (value) =>
            updateDimension(surface, updateSurface, "width_cm", value),
          )}
          {renderNumberField("Altezza", surface.dimensions.height_cm, (value) =>
            updateDimension(surface, updateSurface, "height_cm", value),
          )}
        </>
      );
    case "trapezoid":
      return (
        <>
          {renderNumberField(
            "Base inferiore",
            surface.dimensions.base_bottom_cm,
            (value) => updateDimension(surface, updateSurface, "base_bottom_cm", value),
          )}
          {renderNumberField(
            "Base superiore",
            surface.dimensions.base_top_cm,
            (value) => updateDimension(surface, updateSurface, "base_top_cm", value),
          )}
          {renderNumberField("Altezza", surface.dimensions.height_cm, (value) =>
            updateDimension(surface, updateSurface, "height_cm", value),
          )}
        </>
      );
    case "triangle":
      return (
        <>
          {renderNumberField("Base", surface.dimensions.base_cm, (value) =>
            updateDimension(surface, updateSurface, "base_cm", value),
          )}
          {renderNumberField("Altezza", surface.dimensions.height_cm, (value) =>
            updateDimension(surface, updateSurface, "height_cm", value),
          )}
        </>
      );
    case "guided_quad":
      return (
        <>
          {renderNumberField(
            "Base inferiore",
            surface.dimensions.base_bottom_cm,
            (value) => updateDimension(surface, updateSurface, "base_bottom_cm", value),
          )}
          {renderNumberField(
            "Lato sinistro",
            surface.dimensions.left_height_cm,
            (value) => updateDimension(surface, updateSurface, "left_height_cm", value),
          )}
          {renderNumberField(
            "Lato destro",
            surface.dimensions.right_height_cm,
            (value) => updateDimension(surface, updateSurface, "right_height_cm", value),
          )}
          {renderNumberField(
            "Larghezza superiore",
            surface.dimensions.top_width_cm,
            (value) => updateDimension(surface, updateSurface, "top_width_cm", value),
          )}
        </>
      );
  }
}

function renderNumberField(
  label: string,
  value: number,
  onChange: (value: number) => void,
) {
  return (
    <label className={labelClassName}>
      {label} (cm) *
      <input
        className={inputClassName}
        min={0}
        placeholder="Misura in cm"
        type="number"
        value={formatNumberInput(value)}
        onChange={(event) => onChange(readNonNegativeNumber(event.target.value))}
      />
    </label>
  );
}

function updateDimension(
  surface: SurfaceData,
  updateSurface: (
    surfaceId: string,
    updater: (surface: SurfaceData) => SurfaceData,
  ) => void,
  key: string,
  value: number,
) {
  updateSurface(surface.surface_id, (currentSurface) => ({
    ...currentSurface,
    dimensions: {
      ...currentSurface.dimensions,
      [key]: value,
    },
  }) as SurfaceData);
}

function changeSurfaceShape(
  surface: SurfaceData,
  nextShape: SurfaceShape,
): SurfaceData {
  return {
    ...surface,
    shape: nextShape,
    dimensions: createDefaultDimensions(nextShape),
  } as SurfaceData;
}

function getSurfacePreview(surface: SurfaceData): string {
  const shapeLabel =
    SHAPE_OPTIONS.find((option) => option.value === surface.shape)?.label ??
    "Forma";
  const orientation = surface.orientation || "orientamento da indicare";
  const obstaclesLabel =
    surface.obstacles.length === 1 ? "1 ostacolo" : `${surface.obstacles.length} ostacoli`;

  return `${surface.name || "Falda"} - ${shapeLabel} - ${orientation} - ${obstaclesLabel}`;
}

function readNonNegativeNumber(value: string): number {
  if (value.trim() === "") {
    return 0;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return 0;
  }

  return numericValue;
}

function formatNumberInput(value: number): string {
  return value > 0 ? String(value) : "";
}
