"use client";

import { formattaWatt } from "@/lib/formatters/units";
import { calcolaLayoutModuliPreliminare } from "@/lib/geometry/moduleLayout";
import { creaOstacoloGeometrico } from "@/lib/geometry/obstacles";
import {
  creaPoligonoFalda,
  getPoligonoBounds,
  type Box2D,
  type PoligonoFalda,
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
    );
    actions.impostaLayoutPreliminare(nextLayout);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Layout moduli preliminare</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Calcolo indicativo a griglia sulle falde compilate. Il sistema prova
          orientamento verticale e orizzontale e sceglie la soluzione con più
          moduli. Non è ancora una progettazione esecutiva.
        </p>
      </div>

      {panelErrors.length > 0 && (
        <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-5">
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
        <section className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-5">
          <h3 className="text-lg font-semibold">Falde mancanti</h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Inserisci almeno una falda prima di calcolare il layout.
          </p>
        </section>
      )}

      <section className="rounded-lg border border-[var(--border)] bg-white p-5">
        <h3 className="text-lg font-semibold">Dati usati per il calcolo</h3>
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
        <button
          className="mt-5 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canCalculate}
          type="button"
          onClick={handleCalculate}
        >
          Calcola layout preliminare
        </button>
      </section>

      {layout ? (
        <LayoutResultView layout={layout} surfaces={state.roof.surfaces} />
      ) : (
        <section className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-5 text-sm leading-6 text-[var(--muted)]">
          Nessun layout calcolato. Completa i dati pannello e premi “Calcola
          layout preliminare”.
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
    <div className="space-y-6">
      <section className="rounded-lg border border-[var(--border)] bg-white p-5">
        <h3 className="text-lg font-semibold">Riepilogo complessivo</h3>
        <dl className="mt-4 grid gap-3 text-sm md:grid-cols-3">
          <SummaryItem label="Moduli totali" value={String(layout.total_modules)} />
          <SummaryItem
            label="Potenza totale"
            value={formattaWatt(layout.total_power_w)}
          />
          <SummaryItem
            label="Falde calcolate"
            value={String(layout.surfaces.length)}
          />
        </dl>
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
          <section
            key={surfaceLayout.surface_id}
            className="rounded-lg border border-[var(--border)] bg-white p-5"
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold">
                {surfaceLayout.surface_name}
              </h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Orientamento scelto: {surfaceLayout.selected_orientation}.
                Moduli: {surfaceLayout.module_count}. Potenza:{" "}
                {formattaWatt(surfaceLayout.total_power_w)}.
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Superficie utile approssimativa:{" "}
                {Math.round(surfaceLayout.useful_area_cm2 / 10000)} m².
                Superficie occupata:{" "}
                {Math.round(surfaceLayout.occupied_area_cm2 / 10000)} m².
              </p>
            </div>

            <LayoutPreviewSvg surface={surface} surfaceLayout={surfaceLayout} />

            {surfaceLayout.messages.length > 0 && (
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
                {surfaceLayout.messages.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            )}
          </section>
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
        fill="#eef3f1"
        points={faldaPoints}
        stroke="#0f766e"
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
      fill="#dbeafe"
      height={Math.abs(bottomRight.y_cm - topLeft.y_cm)}
      stroke="#1d4ed8"
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
        fill="#fee2e2"
        fillOpacity="0.85"
        points={points}
        stroke="#b91c1c"
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
      fill="#fee2e2"
      fillOpacity="0.85"
      r={Math.abs(radiusPoint.x_cm - center.x_cm)}
      stroke="#b91c1c"
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
