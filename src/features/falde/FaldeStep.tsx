"use client";

import type { SurfaceShape } from "@/types/domain";
import type { SurfaceData } from "@/types/survey";
import { useWizard } from "@/features/wizard/WizardProvider";
import {
  createDefaultDimensions,
  createDefaultSurface,
} from "./surfaceFactory";

const SHAPE_OPTIONS: Array<{ value: SurfaceShape; label: string }> = [
  { value: "rectangular", label: "Rettangolare" },
  { value: "trapezoid", label: "Trapezoidale" },
  { value: "triangle", label: "Triangolare" },
  { value: "guided_quad", label: "Quadrilatero irregolare guidato" },
];

const inputClassName =
  "mt-2 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]";
const labelClassName = "text-sm font-medium";

export function FaldeStep() {
  const { actions, state } = useWizard();
  const surfaces = state.roof.surfaces;

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
    actions.sostituisciFalde([
      ...surfaces,
      createDefaultSurface(surfaces.length + 1),
    ]);
  }

  function removeSurface(surfaceId: string) {
    actions.sostituisciFalde(
      surfaces.filter((surface) => surface.surface_id !== surfaceId),
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Falde</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            Compila le quote principali di ogni falda. Tutte le misure sono in
            centimetri. La validazione geometrica reale arriverà nello step
            dedicato agli ostacoli.
          </p>
        </div>
        <button
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
          type="button"
          onClick={addSurface}
        >
          Aggiungi falda
        </button>
      </div>

      {surfaces.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-5 text-sm text-[var(--muted)]">
          Nessuna falda presente. Torna allo step “Tipo di tetto” oppure aggiungi
          una falda manualmente.
          <div>
            <button
              className="mt-4 rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)]"
              type="button"
              onClick={addSurface}
            >
              Aggiungi prima falda
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {surfaces.map((surface, index) => (
            <section
              key={surface.surface_id}
              className="rounded-lg border border-[var(--border)] bg-white p-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    Falda {index + 1}
                  </h3>
                  <p className="text-sm text-[var(--muted)]">
                    Ostacoli collegati: {surface.obstacles.length}
                  </p>
                </div>
                {surfaces.length > 1 && (
                  <button
                    className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                    type="button"
                    onClick={() => removeSurface(surface.surface_id)}
                  >
                    Elimina falda
                  </button>
                )}
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
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
                  Forma della falda *
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
                  Orientamento della falda *
                  <input
                    className={inputClassName}
                    placeholder="Esempio: Sud, Est, Ovest"
                    value={surface.orientation}
                    onChange={(event) =>
                      updateSurface(surface.surface_id, (currentSurface) => ({
                        ...currentSurface,
                        orientation: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className={labelClassName}>
                  Inclinazione del tetto (°)
                  <input
                    className={inputClassName}
                    min={0}
                    placeholder="Esempio: 20"
                    type="number"
                    value={formatNumberInput(surface.tilt_deg)}
                    onChange={(event) =>
                      updateSurface(surface.surface_id, (currentSurface) => ({
                        ...currentSurface,
                        tilt_deg: readNonNegativeNumber(
                          event.target.value,
                        ),
                      }))
                    }
                  />
                </label>

                <label className={labelClassName}>
                  Quota minima dal bordo per posa pannelli
                  <input
                    className={inputClassName}
                    min={0}
                    placeholder="Esempio: 30"
                    type="number"
                    value={formatNumberInput(surface.edge_clearance_cm)}
                    onChange={(event) =>
                      updateSurface(surface.surface_id, (currentSurface) => ({
                        ...currentSurface,
                        edge_clearance_cm: readNonNegativeNumber(
                          event.target.value,
                        ),
                      }))
                    }
                  />
                </label>

                {renderDimensionFields(surface, updateSurface)}

                <label className={`${labelClassName} md:col-span-2`}>
                  Note falda
                  <textarea
                    className={`${inputClassName} min-h-24 resize-y`}
                    value={surface.notes}
                    onChange={(event) =>
                      updateSurface(surface.surface_id, (currentSurface) => ({
                        ...currentSurface,
                        notes: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <div className="mt-5 rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm text-[var(--muted)]">
                Preview testuale: {getSurfacePreview(surface)}
              </div>
            </section>
          ))}
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
          {renderNumberField("Larghezza falda", surface.dimensions.width_cm, (value) =>
            updateDimension(surface, updateSurface, "width_cm", value),
          )}
          {renderNumberField("Altezza falda", surface.dimensions.height_cm, (value) =>
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
          {renderNumberField("Altezza falda", surface.dimensions.height_cm, (value) =>
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
          {renderNumberField("Altezza falda", surface.dimensions.height_cm, (value) =>
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
            "Altezza lato sinistro",
            surface.dimensions.left_height_cm,
            (value) => updateDimension(surface, updateSurface, "left_height_cm", value),
          )}
          {renderNumberField(
            "Altezza lato destro",
            surface.dimensions.right_height_cm,
            (value) => updateDimension(surface, updateSurface, "right_height_cm", value),
          )}
          {renderNumberField(
            "Larghezza parte superiore",
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
    "Forma non definita";

  return `${surface.name || "Falda senza nome"} - ${shapeLabel}, orientamento ${
    surface.orientation || "non indicato"
  }, inclinazione ${surface.tilt_deg}°, distanza bordo ${
    surface.edge_clearance_cm
  } cm.`;
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
