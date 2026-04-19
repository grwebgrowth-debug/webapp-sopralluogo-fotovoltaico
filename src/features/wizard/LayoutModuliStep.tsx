"use client";

import { useEffect, useRef } from "react";
import { formattaKilowattPicco, formattaWatt } from "@/lib/formatters/units";
import { calcolaLayoutModuliPreliminare } from "@/lib/geometry/moduleLayout";
import { creaOstacoloGeometrico } from "@/lib/geometry/obstacles";
import {
  creaPoligonoFalda,
  getPoligonoBounds,
  type Box2D,
  type Punto2D,
} from "@/lib/geometry/roof";
import type {
  PositionedModule,
  PreliminaryModuleLayout,
  SurfaceModuleLayout,
} from "@/types/layout";
import type { SurfaceData } from "@/types/survey";
import { useWizard } from "./WizardProvider";

export function LayoutModuliStep() {
  const { actions, state } = useWizard();
  const resultRef = useRef<HTMLDivElement | null>(null);
  const panelErrors = getPanelTechnicalErrors(state.panel_technical_data);
  const canCalculate =
    panelErrors.length === 0 && state.roof.surfaces.length > 0;
  const layout = state.preliminary_layout;

  function handleCalculate() {
    if (!canCalculate) {
      return;
    }

    const nextLayout = calcolaLayoutModuliPreliminare(
      state.roof.surfaces,
      state.panel_technical_data,
      state.layout_config,
    );
    actions.impostaLayoutPreliminare(nextLayout);
  }

  useEffect(() => {
    function handleExternalCalculate() {
      handleCalculate();
    }

    window.addEventListener("wizard:calculate-layout", handleExternalCalculate);
    return () => {
      window.removeEventListener(
        "wizard:calculate-layout",
        handleExternalCalculate,
      );
    };
  });

  useEffect(() => {
    if (layout) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [layout]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">Layout preliminare</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Calcola una stima dei moduli inseribili sulle falde.
        </p>
      </div>

      <section className="rounded-lg border border-[var(--border)] bg-white p-4">
        <h3 className="text-lg font-semibold">Sintesi layout</h3>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <SummaryItem
            label="Modalita"
            value={getLayoutModeLabel(state.layout_config.mode)}
          />
          <SummaryItem
            label="Target"
            value={
              state.layout_config.target_power_w
                ? formattaKilowattPicco(state.layout_config.target_power_w)
                : "Massimo moduli"
            }
          />
          <SummaryItem
            label="Moduli inseriti"
            value={layout ? String(layout.total_modules) : "Da calcolare"}
          />
          <SummaryItem
            label="Potenza totale"
            value={
              layout ? formattaKilowattPicco(layout.total_power_w) : "Da calcolare"
            }
          />
        </dl>
        <button
          className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canCalculate}
          type="button"
          onClick={handleCalculate}
        >
          Calcola layout
        </button>
      </section>

      {panelErrors.length > 0 && (
        <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4">
          <h3 className="text-lg font-semibold">Dati pannello mancanti</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
            {panelErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
          <button
            className="mt-4 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm"
            type="button"
            onClick={() => actions.cambiaStep("pannello")}
          >
            Modifica pannello
          </button>
        </section>
      )}

      {state.roof.surfaces.length === 0 && (
        <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4">
          <h3 className="text-lg font-semibold">Falde mancanti</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Inserisci almeno una falda prima di calcolare il layout.
          </p>
        </section>
      )}

      <details className="rounded-lg border border-[var(--border)] bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold">
          Dati usati
        </summary>
        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-4">
          <SummaryItem
            label="Larghezza pannello"
            value={`${state.panel_technical_data.width_cm} cm`}
          />
          <SummaryItem
            label="Altezza pannello"
            value={`${state.panel_technical_data.height_cm} cm`}
          />
          <SummaryItem
            label="Potenza pannello"
            value={formattaWatt(state.panel_technical_data.power_w)}
          />
          <SummaryItem
            label="Origine dati"
            value={
              state.panel_technical_data.source === "catalogo"
                ? "Catalogo"
                : state.panel_technical_data.source === "manuale"
                  ? "Manuale"
                  : "Non indicata"
            }
          />
        </dl>
      </details>

      {layout ? (
        <div ref={resultRef}>
          <LayoutResultView layout={layout} surfaces={state.roof.surfaces} />
        </div>
      ) : (
        <section className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-4 text-sm leading-6 text-[var(--muted)]">
          Nessun layout calcolato.
        </section>
      )}
    </div>
  );
}

type LayoutResultViewProps = {
  layout: PreliminaryModuleLayout;
  surfaces: SurfaceData[];
};

function LayoutResultView({ layout, surfaces }: LayoutResultViewProps) {
  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-[var(--border)] bg-white p-4">
        <h3 className="text-lg font-semibold">Risultato layout</h3>
        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-3">
          <SummaryItem label="Modalita" value={getLayoutModeLabel(layout.layout_mode)} />
          <SummaryItem
            label="Moduli target"
            value={
              layout.target_module_count !== null
                ? String(layout.target_module_count)
                : "Non impostato"
            }
          />
          <SummaryItem
            label="Potenza target"
            value={
              layout.target_power_w !== null
                ? formattaKilowattPicco(layout.target_power_w)
                : "Non impostata"
            }
          />
          <SummaryItem label="Moduli" value={String(layout.total_modules)} />
          <SummaryItem
            label="Potenza"
            value={formattaKilowattPicco(layout.total_power_w)}
          />
          <SummaryItem
            label="Falde usate"
            value={String(getUsedSurfacesCount(layout))}
          />
        </dl>
        {layout.layout_mode === "target_power" && (
          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
            Disponibilita calcolata: {layout.available_modules} moduli,{" "}
            {formattaKilowattPicco(layout.available_power_w)}.{" "}
            {layout.target_reached
              ? "Target raggiunto."
              : "Target non raggiunto: il layout usa il massimo inseribile."}
          </p>
        )}
        {layout.messages.length > 0 && (
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
            {layout.messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        )}
      </section>

      {layout.surfaces.map((surfaceLayout) => {
        const surface = surfaces.find(
          (currentSurface) =>
            currentSurface.surface_id === surfaceLayout.surface_id,
        );

        if (!surface) {
          return null;
        }

        return (
          <details
            key={surfaceLayout.surface_id}
            className="rounded-lg border border-[var(--border)] bg-white p-4"
            open={surfaceLayout.module_count > 0}
          >
            <summary className="cursor-pointer text-base font-semibold">
              {surfaceLayout.surface_name} · {surfaceLayout.module_count} moduli ·{" "}
              {formattaKilowattPicco(surfaceLayout.total_power_w)}
            </summary>

            <div className="mt-4">
              <LayoutPreviewSvg surface={surface} surfaceLayout={surfaceLayout} />
            </div>

            {surfaceLayout.messages.length > 0 && (
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
                {surfaceLayout.messages.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            )}
          </details>
        );
      })}
    </div>
  );
}

type LayoutPreviewSvgProps = {
  surface: SurfaceData;
  surfaceLayout: SurfaceModuleLayout;
};

function LayoutPreviewSvg({ surface, surfaceLayout }: LayoutPreviewSvgProps) {
  const falda = creaPoligonoFalda(surface);
  const bounds = getPoligonoBounds(falda);
  const mapPoint = createSvgPointMapper(bounds, 560, 360, 24);
  const faldaPoints = falda.map(mapPoint).map(toSvgPoint).join(" ");

  return (
    <svg
      aria-label={`Preview layout moduli ${surface.name}`}
      className="h-auto w-full rounded-lg border border-[var(--border)] bg-white"
      role="img"
      viewBox="0 0 560 360"
    >
      <polygon
        fill="#10201d"
        points={faldaPoints}
        stroke="#14b8a6"
        strokeWidth="2"
      />

      {surface.obstacles.map((obstacle) => (
        <ObstacleSvg
          key={obstacle.obstacle_id}
          mapPoint={mapPoint}
          obstacle={creaOstacoloGeometrico(obstacle, surface)}
        />
      ))}

      {surfaceLayout.modules.map((module) => (
        <ModuleSvg key={module.module_id} mapPoint={mapPoint} module={module} />
      ))}
    </svg>
  );
}

type ModuleSvgProps = {
  mapPoint: (point: Punto2D) => Punto2D;
  module: PositionedModule;
};

function ModuleSvg({ mapPoint, module }: ModuleSvgProps) {
  const topLeft = mapPoint({
    x_cm: module.x_cm,
    y_cm: module.y_cm + module.height_cm,
  });
  const bottomRight = mapPoint({
    x_cm: module.x_cm + module.width_cm,
    y_cm: module.y_cm,
  });

  return (
    <rect
      fill="#93c5fd"
      fillOpacity="0.78"
      height={Math.abs(bottomRight.y_cm - topLeft.y_cm)}
      stroke="#bfdbfe"
      strokeWidth="1"
      width={Math.abs(bottomRight.x_cm - topLeft.x_cm)}
      x={topLeft.x_cm}
      y={topLeft.y_cm}
    />
  );
}

type ObstacleSvgProps = {
  mapPoint: (point: Punto2D) => Punto2D;
  obstacle: ReturnType<typeof creaOstacoloGeometrico>;
};

function ObstacleSvg({ mapPoint, obstacle }: ObstacleSvgProps) {
  if (obstacle.shape === "rect") {
    const points = obstacle.expanded_vertices.map(mapPoint).map(toSvgPoint).join(" ");

    return (
      <polygon
        fill="#fca5a5"
        fillOpacity="0.85"
        points={points}
        stroke="#fecaca"
        strokeDasharray="4 3"
        strokeWidth="1.5"
      />
    );
  }

  const center = mapPoint(obstacle.center);
  const radiusPoint = mapPoint({
    x_cm: obstacle.center.x_cm + obstacle.expanded_radius_cm,
    y_cm: obstacle.center.y_cm,
  });

  return (
    <circle
      cx={center.x_cm}
      cy={center.y_cm}
      fill="#fca5a5"
      fillOpacity="0.85"
      r={Math.abs(radiusPoint.x_cm - center.x_cm)}
      stroke="#fecaca"
      strokeDasharray="4 3"
      strokeWidth="1.5"
    />
  );
}

type SummaryItemProps = {
  label: string;
  value: string;
};

function SummaryItem({ label, value }: SummaryItemProps) {
  return (
    <div>
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function getLayoutModeLabel(mode: PreliminaryModuleLayout["layout_mode"]): string {
  return mode === "target_power" ? "Target impianto" : "Massimo moduli";
}

function getUsedSurfacesCount(layout: PreliminaryModuleLayout): number {
  return layout.surfaces.filter((surfaceLayout) => surfaceLayout.module_count > 0)
    .length;
}

function getPanelTechnicalErrors(panel: {
  height_cm: number;
  power_w: number;
  width_cm: number;
}): string[] {
  const errors: string[] = [];

  if (panel.width_cm <= 0) {
    errors.push("Larghezza pannello mancante.");
  }

  if (panel.height_cm <= 0) {
    errors.push("Altezza pannello mancante.");
  }

  if (panel.power_w <= 0) {
    errors.push("Potenza pannello mancante.");
  }

  return errors;
}

function createSvgPointMapper(
  bounds: Box2D,
  viewBoxWidth: number,
  viewBoxHeight: number,
  padding: number,
): (point: Punto2D) => Punto2D {
  const widthCm = Math.max(1, bounds.max_x_cm - bounds.min_x_cm);
  const heightCm = Math.max(1, bounds.max_y_cm - bounds.min_y_cm);
  const scale = Math.min(
    (viewBoxWidth - padding * 2) / widthCm,
    (viewBoxHeight - padding * 2) / heightCm,
  );
  const offsetX =
    padding + (viewBoxWidth - padding * 2 - widthCm * scale) / 2;
  const offsetY =
    padding + (viewBoxHeight - padding * 2 - heightCm * scale) / 2;

  return (point) => ({
    x_cm: offsetX + (point.x_cm - bounds.min_x_cm) * scale,
    y_cm: offsetY + (bounds.max_y_cm - point.y_cm) * scale,
  });
}

function toSvgPoint(point: Punto2D): string {
  return `${point.x_cm},${point.y_cm}`;
}
