"use client";

import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { ObstacleShape, ObstacleType } from "@/types/domain";
import type {
  CircleObstacleDimensions,
  ObstacleData,
  ObstaclePosition,
  RectObstacleDimensions,
  SurfaceData,
} from "@/types/survey";
import { useWizard } from "@/features/wizard/WizardProvider";
import { creaOstacoloGeometrico } from "@/lib/geometry/obstacles";
import {
  creaPoligonoFalda,
  getPoligonoBounds,
  type Box2D,
  type PoligonoFalda,
  type Punto2D,
} from "@/lib/geometry/roof";
import { validaOstacoloDentroFalda } from "@/lib/geometry/validation";

type ObstacleDraft = {
  obstacle_id: string;
  type: ObstacleType;
  shape: ObstacleShape;
  safety_margin_cm: number;
  width_cm: number;
  height_cm: number;
  diameter_cm: number;
  distance_from_base_cm: number;
  distance_from_left_cm: number;
  distance_from_base_right_corner_cm: number;
  height_from_base_cm: number;
};

type ObstacleFormErrors = {
  errors: string[];
};

const OBSTACLE_TYPE_OPTIONS: Array<{ value: ObstacleType; label: string }> = [
  { value: "camino", label: "Camino" },
  { value: "lucernario", label: "Lucernario" },
  { value: "sfiato", label: "Sfiato" },
  { value: "antenna_palo", label: "Antenna / palo" },
  { value: "area_non_utilizzabile", label: "Area non utilizzabile" },
  { value: "altro_ostacolo", label: "Altro ostacolo" },
];

const OBSTACLE_SHAPE_OPTIONS: Array<{ value: ObstacleShape; label: string }> = [
  { value: "rect", label: "Rettangolare" },
  { value: "circle", label: "Circolare" },
];

const inputClassName =
  "mt-2 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]";
const labelClassName = "text-sm font-medium";

export function OstacoliStep() {
  const { actions, state } = useWizard();
  const surfaces = state.roof.surfaces;
  const [selectedSurfaceId, setSelectedSurfaceId] = useState(
    surfaces[0]?.surface_id ?? "",
  );
  const selectedSurface = useMemo(
    () =>
      surfaces.find((surface) => surface.surface_id === selectedSurfaceId) ??
      surfaces[0] ??
      null,
    [selectedSurfaceId, surfaces],
  );
  const [editingObstacleId, setEditingObstacleId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ObstacleDraft>(() =>
    createEmptyObstacleDraft(),
  );
  const formValidation = selectedSurface
    ? validateObstacleDraft(draft, selectedSurface)
    : { errors: [], baseFieldsValid: false };
  const draftObstacle =
    selectedSurface && formValidation.baseFieldsValid
      ? createObstacleFromDraft(draft, selectedSurface)
      : null;
  const geometryValidation =
    selectedSurface && draftObstacle
      ? validaOstacoloDentroFalda(selectedSurface, draftObstacle)
      : null;
  const validationErrors = [
    ...formValidation.errors,
    ...(geometryValidation && !geometryValidation.valido
      ? [geometryValidation.errore]
      : []),
  ];

  useEffect(() => {
    if (!selectedSurface && surfaces[0]) {
      setSelectedSurfaceId(surfaces[0].surface_id);
      return;
    }

    if (
      selectedSurface &&
      !surfaces.some((surface) => surface.surface_id === selectedSurfaceId)
    ) {
      setSelectedSurfaceId(selectedSurface.surface_id);
    }
  }, [selectedSurface, selectedSurfaceId, surfaces]);

  function startNewObstacle() {
    setEditingObstacleId(null);
    setDraft(createEmptyObstacleDraft());
  }

  function startEditObstacle(obstacle: ObstacleData) {
    setEditingObstacleId(obstacle.obstacle_id);
    setDraft(createDraftFromObstacle(obstacle));
  }

  function saveObstacle() {
    if (!selectedSurface || validationErrors.length > 0) {
      return;
    }

    const obstacle = createObstacleFromDraft(draft, selectedSurface);

    if (editingObstacleId) {
      actions.aggiornaOstacolo(
        selectedSurface.surface_id,
        editingObstacleId,
        obstacle,
      );
    } else {
      actions.aggiungiOstacolo(selectedSurface.surface_id, obstacle);
    }

    setEditingObstacleId(null);
    setDraft(createEmptyObstacleDraft());
  }

  function deleteObstacle(obstacleId: string) {
    if (!selectedSurface) {
      return;
    }

    actions.eliminaOstacolo(selectedSurface.surface_id, obstacleId);

    if (editingObstacleId === obstacleId) {
      startNewObstacle();
    }
  }

  if (surfaces.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-5">
        <h2 className="text-xl font-semibold">Ostacoli</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Prima di inserire gli ostacoli devi creare almeno una falda nello step
          “Falde”.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Ostacoli</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Inserisci gli ostacoli per ogni falda. Le misure sono in centimetri.
          In questa fase la preview è tecnica e non geometrica avanzata.
        </p>
      </div>

      <label className="block text-sm font-medium">
        Falda su cui lavorare
        <select
          className={inputClassName}
          value={selectedSurface?.surface_id ?? ""}
          onChange={(event) => {
            setSelectedSurfaceId(event.target.value);
            setEditingObstacleId(null);
            setDraft(createEmptyObstacleDraft());
          }}
        >
          {surfaces.map((surface) => (
            <option key={surface.surface_id} value={surface.surface_id}>
              {surface.name || surface.surface_id}
            </option>
          ))}
        </select>
      </label>

      {selectedSurface && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="rounded-lg border border-[var(--border)] bg-white p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {editingObstacleId ? "Modifica ostacolo" : "Nuovo ostacolo"}
                </h3>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Falda selezionata: {selectedSurface.name}. Riferimenti
                  posizione: {getPositionModeLabel(selectedSurface)}.
                </p>
              </div>
              {editingObstacleId && (
                <button
                  className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                  type="button"
                  onClick={startNewObstacle}
                >
                  Annulla modifica
                </button>
              )}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className={labelClassName}>
                Nome ostacolo *
                <input
                  className={inputClassName}
                  value={draft.obstacle_id}
                  onChange={(event) =>
                    setDraft((currentDraft) => ({
                      ...currentDraft,
                      obstacle_id: event.target.value,
                    }))
                  }
                />
              </label>

              <label className={labelClassName}>
                Tipo ostacolo *
                <select
                  className={inputClassName}
                  value={draft.type}
                  onChange={(event) =>
                    setDraft((currentDraft) => ({
                      ...currentDraft,
                      type: event.target.value as ObstacleType,
                    }))
                  }
                >
                  {OBSTACLE_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={labelClassName}>
                Forma ostacolo *
                <select
                  className={inputClassName}
                  value={draft.shape}
                  onChange={(event) =>
                    setDraft((currentDraft) => ({
                      ...currentDraft,
                      shape: event.target.value as ObstacleShape,
                    }))
                  }
                >
                  {OBSTACLE_SHAPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={labelClassName}>
                Margine di sicurezza (cm) *
                <input
                  className={inputClassName}
                  min={0}
                  type="number"
                  value={draft.safety_margin_cm}
                  onChange={(event) =>
                    updateDraftNumber(
                      setDraft,
                      "safety_margin_cm",
                      event.target.valueAsNumber,
                    )
                  }
                />
              </label>

              {draft.shape === "rect" ? (
                <>
                  <NumberField
                    label="Larghezza ostacolo"
                    value={draft.width_cm}
                    onChange={(value) =>
                      updateDraftNumber(setDraft, "width_cm", value)
                    }
                  />
                  <NumberField
                    label="Altezza ostacolo"
                    value={draft.height_cm}
                    onChange={(value) =>
                      updateDraftNumber(setDraft, "height_cm", value)
                    }
                  />
                </>
              ) : (
                <NumberField
                  label="Diametro ostacolo"
                  value={draft.diameter_cm}
                  onChange={(value) =>
                    updateDraftNumber(setDraft, "diameter_cm", value)
                  }
                />
              )}

              {selectedSurface.shape === "triangle" ? (
                <>
                  <NumberField
                    label="Distanza dall’angolo destro della base"
                    value={draft.distance_from_base_right_corner_cm}
                    onChange={(value) =>
                      updateDraftNumber(
                        setDraft,
                        "distance_from_base_right_corner_cm",
                        value,
                      )
                    }
                  />
                  <NumberField
                    label="Altezza dalla base (H)"
                    value={draft.height_from_base_cm}
                    onChange={(value) =>
                      updateDraftNumber(setDraft, "height_from_base_cm", value)
                    }
                  />
                </>
              ) : (
                <>
                  <NumberField
                    label="Distanza dalla base"
                    value={draft.distance_from_base_cm}
                    onChange={(value) =>
                      updateDraftNumber(setDraft, "distance_from_base_cm", value)
                    }
                  />
                  <NumberField
                    label="Distanza dal lato sinistro"
                    value={draft.distance_from_left_cm}
                    onChange={(value) =>
                      updateDraftNumber(setDraft, "distance_from_left_cm", value)
                    }
                  />
                </>
              )}
            </div>

            {validationErrors.length > 0 && (
              <div className="mt-5 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-4">
                <p className="text-sm font-semibold">
                  Controlla i dati dell’ostacolo:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
                  {validationErrors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                disabled={validationErrors.length > 0}
                type="button"
                onClick={saveObstacle}
              >
                {editingObstacleId ? "Salva modifica" : "Aggiungi ostacolo"}
              </button>
              <button
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm"
                type="button"
                onClick={startNewObstacle}
              >
                Nuovo ostacolo
              </button>
            </div>
          </section>

          <aside className="space-y-4">
            <ObstaclePreview
              draft={draft}
              draftObstacle={draftObstacle}
              geometryValid={geometryValidation?.valido ?? false}
              savedObstacles={selectedSurface.obstacles}
              surface={selectedSurface}
              title="Preview geometrica"
            />

            <section className="rounded-lg border border-[var(--border)] bg-white p-5">
              <h3 className="text-lg font-semibold">Ostacoli inseriti</h3>
              {selectedSurface.obstacles.length === 0 ? (
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  Nessun ostacolo inserito su questa falda.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {selectedSurface.obstacles.map((obstacle) => (
                    <div
                      key={obstacle.obstacle_id}
                      className="rounded-lg border border-[var(--border)] p-3 text-sm"
                    >
                      <p className="font-semibold">{obstacle.obstacle_id}</p>
                      <p className="mt-1 text-[var(--muted)]">
                        {getObstacleTypeLabel(obstacle.type)} -{" "}
                        {getObstacleShapeLabel(obstacle.shape)}
                      </p>
                      <p className="mt-1 text-[var(--muted)]">
                        {getObstaclePositionSummary(obstacle, selectedSurface)}
                      </p>
                      <p
                        className={`mt-2 text-xs font-semibold ${
                          validaOstacoloDentroFalda(selectedSurface, obstacle)
                            .valido
                            ? "text-emerald-700"
                            : "text-red-700"
                        }`}
                      >
                        {validaOstacoloDentroFalda(selectedSurface, obstacle)
                          .valido
                          ? "Dentro la falda"
                          : "Fuori area o margine non valido"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs"
                          type="button"
                          onClick={() => startEditObstacle(obstacle)}
                        >
                          Modifica
                        </button>
                        <button
                          className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs"
                          type="button"
                          onClick={() => deleteObstacle(obstacle.obstacle_id)}
                        >
                          Elimina
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}

type NumberFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
};

function NumberField({ label, value, onChange }: NumberFieldProps) {
  return (
    <label className={labelClassName}>
      {label} (cm) *
      <input
        className={inputClassName}
        min={0}
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.valueAsNumber)}
      />
    </label>
  );
}

type ObstaclePreviewProps = {
  draft: ObstacleDraft;
  draftObstacle: ObstacleData | null;
  geometryValid: boolean;
  savedObstacles: ObstacleData[];
  surface: SurfaceData;
  title: string;
};

function ObstaclePreview({
  draft,
  draftObstacle,
  geometryValid,
  savedObstacles,
  surface,
  title,
}: ObstaclePreviewProps) {
  const falda = creaPoligonoFalda(surface);
  const bounds = getPoligonoBounds(falda);

  return (
    <section className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Rappresentazione proporzionata in centimetri.
          </p>
        </div>
        <span
          className={`rounded-lg px-2 py-1 text-xs font-semibold ${
            geometryValid
              ? "bg-emerald-100 text-emerald-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {geometryValid ? "Valido" : "Da correggere"}
        </span>
      </div>

      <GeometryPreviewSvg
        bounds={bounds}
        draftObstacle={draftObstacle}
        falda={falda}
        savedObstacles={savedObstacles}
        surface={surface}
      />

      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-[var(--muted)]">Falda</dt>
          <dd className="font-medium">{surface.name}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">Riferimento posizione</dt>
          <dd className="font-medium">{getPositionModeLabel(surface)}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">Ostacolo</dt>
          <dd className="font-medium">
            {draft.obstacle_id || "Nome non indicato"} -{" "}
            {getObstacleShapeLabel(draft.shape)}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">Misure</dt>
          <dd className="font-medium">{getDraftDimensionsSummary(draft)}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">Posizione</dt>
          <dd className="font-medium">{getDraftPositionSummary(draft, surface)}</dd>
        </div>
      </dl>
    </section>
  );
}

type GeometryPreviewSvgProps = {
  bounds: Box2D;
  draftObstacle: ObstacleData | null;
  falda: PoligonoFalda;
  savedObstacles: ObstacleData[];
  surface: SurfaceData;
};

function GeometryPreviewSvg({
  bounds,
  draftObstacle,
  falda,
  savedObstacles,
  surface,
}: GeometryPreviewSvgProps) {
  const viewBoxWidth = 320;
  const viewBoxHeight = 240;
  const padding = 20;
  const mapPoint = createSvgPointMapper(bounds, viewBoxWidth, viewBoxHeight, padding);
  const faldaPoints = falda.map(mapPoint).map(toSvgPoint).join(" ");

  return (
    <svg
      aria-label="Preview geometrica falda e ostacoli"
      className="mt-4 h-auto w-full rounded-lg border border-[var(--border)] bg-white"
      role="img"
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
    >
      <polygon
        fill="#eef3f1"
        points={faldaPoints}
        stroke="#0f766e"
        strokeWidth="2"
      />

      {savedObstacles.map((obstacle) => (
        <ObstacleSvg
          key={obstacle.obstacle_id}
          mapPoint={mapPoint}
          obstacle={obstacle}
          surface={surface}
          tone="saved"
        />
      ))}

      {draftObstacle && (
        <ObstacleSvg
          mapPoint={mapPoint}
          obstacle={draftObstacle}
          surface={surface}
          tone={
            validaOstacoloDentroFalda(surface, draftObstacle).valido
              ? "valid"
              : "invalid"
          }
        />
      )}
    </svg>
  );
}

type ObstacleSvgProps = {
  mapPoint: (point: Punto2D) => Punto2D;
  obstacle: ObstacleData;
  surface: SurfaceData;
  tone: "saved" | "valid" | "invalid";
};

function ObstacleSvg({ mapPoint, obstacle, surface, tone }: ObstacleSvgProps) {
  const geometry = creaOstacoloGeometrico(obstacle, surface);
  const strokeColor =
    tone === "invalid" ? "#b91c1c" : tone === "valid" ? "#15803d" : "#334155";
  const fillColor =
    tone === "invalid" ? "#fee2e2" : tone === "valid" ? "#dcfce7" : "#dbeafe";

  if (geometry.shape === "rect") {
    const points = geometry.vertices.map(mapPoint).map(toSvgPoint).join(" ");
    const expandedPoints = geometry.expanded_vertices
      .map(mapPoint)
      .map(toSvgPoint)
      .join(" ");

    return (
      <g>
        <polygon
          fill="none"
          points={expandedPoints}
          stroke={strokeColor}
          strokeDasharray="4 3"
          strokeWidth="1.5"
        />
        <polygon
          fill={fillColor}
          fillOpacity="0.85"
          points={points}
          stroke={strokeColor}
          strokeWidth="2"
        />
      </g>
    );
  }

  const center = mapPoint(geometry.center);
  const radiusPoint = mapPoint({
    x_cm: geometry.center.x_cm + geometry.radius_cm,
    y_cm: geometry.center.y_cm,
  });
  const expandedRadiusPoint = mapPoint({
    x_cm: geometry.center.x_cm + geometry.expanded_radius_cm,
    y_cm: geometry.center.y_cm,
  });
  const radius = Math.abs(radiusPoint.x_cm - center.x_cm);
  const expandedRadius = Math.abs(expandedRadiusPoint.x_cm - center.x_cm);

  return (
    <g>
      <circle
        cx={center.x_cm}
        cy={center.y_cm}
        fill="none"
        r={expandedRadius}
        stroke={strokeColor}
        strokeDasharray="4 3"
        strokeWidth="1.5"
      />
      <circle
        cx={center.x_cm}
        cy={center.y_cm}
        fill={fillColor}
        fillOpacity="0.85"
        r={radius}
        stroke={strokeColor}
        strokeWidth="2"
      />
    </g>
  );
}

function createEmptyObstacleDraft(): ObstacleDraft {
  return {
    obstacle_id: `ostacolo_${Date.now()}`,
    type: "camino",
    shape: "rect",
    safety_margin_cm: 30,
    width_cm: 0,
    height_cm: 0,
    diameter_cm: 0,
    distance_from_base_cm: 0,
    distance_from_left_cm: 0,
    distance_from_base_right_corner_cm: 0,
    height_from_base_cm: 0,
  };
}

function createDraftFromObstacle(obstacle: ObstacleData): ObstacleDraft {
  const baseDraft = createEmptyObstacleDraft();

  return {
    ...baseDraft,
    obstacle_id: obstacle.obstacle_id,
    type: obstacle.type,
    shape: obstacle.shape,
    safety_margin_cm: obstacle.safety_margin_cm,
    ...(obstacle.shape === "rect"
      ? {
          width_cm: obstacle.dimensions.width_cm,
          height_cm: obstacle.dimensions.height_cm,
        }
      : {
          diameter_cm: obstacle.dimensions.diameter_cm,
        }),
    ...obstacle.position,
  };
}

function createObstacleFromDraft(
  draft: ObstacleDraft,
  surface: SurfaceData,
): ObstacleData {
  const position = createPositionFromDraft(draft, surface);

  if (draft.shape === "rect") {
    return {
      obstacle_id: draft.obstacle_id.trim(),
      type: draft.type,
      shape: "rect",
      safety_margin_cm: draft.safety_margin_cm,
      position,
      dimensions: {
        width_cm: draft.width_cm,
        height_cm: draft.height_cm,
      },
    };
  }

  return {
    obstacle_id: draft.obstacle_id.trim(),
    type: draft.type,
    shape: "circle",
    safety_margin_cm: draft.safety_margin_cm,
    position,
    dimensions: {
      diameter_cm: draft.diameter_cm,
    },
  };
}

function createPositionFromDraft(
  draft: ObstacleDraft,
  surface: SurfaceData,
): ObstaclePosition {
  if (surface.shape === "triangle") {
    return {
      distance_from_base_right_corner_cm:
        draft.distance_from_base_right_corner_cm,
      height_from_base_cm: draft.height_from_base_cm,
    };
  }

  return {
    distance_from_base_cm: draft.distance_from_base_cm,
    distance_from_left_cm: draft.distance_from_left_cm,
  };
}

function validateObstacleDraft(
  draft: ObstacleDraft,
  surface: SurfaceData,
): ObstacleFormErrors & { baseFieldsValid: boolean } {
  const errors: string[] = [];

  if (!draft.obstacle_id.trim()) {
    errors.push("Nome ostacolo obbligatorio.");
  }

  if (draft.safety_margin_cm <= 0) {
    errors.push("Margine di sicurezza obbligatorio e maggiore di zero.");
  }

  if (draft.shape === "rect") {
    if (draft.width_cm <= 0) {
      errors.push("Larghezza ostacolo obbligatoria e maggiore di zero.");
    }

    if (draft.height_cm <= 0) {
      errors.push("Altezza ostacolo obbligatoria e maggiore di zero.");
    }
  }

  if (draft.shape === "circle" && draft.diameter_cm <= 0) {
    errors.push("Diametro ostacolo obbligatorio e maggiore di zero.");
  }

  if (surface.shape === "triangle") {
    if (draft.distance_from_base_right_corner_cm <= 0) {
      errors.push(
        "Distanza dall’angolo destro della base obbligatoria e maggiore di zero.",
      );
    }

    if (draft.height_from_base_cm <= 0) {
      errors.push("Altezza dalla base (H) obbligatoria e maggiore di zero.");
    }
  } else {
    if (draft.distance_from_base_cm <= 0) {
      errors.push("Distanza dalla base obbligatoria e maggiore di zero.");
    }

    if (draft.distance_from_left_cm <= 0) {
      errors.push("Distanza dal lato sinistro obbligatoria e maggiore di zero.");
    }
  }

  return { errors, baseFieldsValid: errors.length === 0 };
}

function updateDraftNumber(
  setDraft: Dispatch<SetStateAction<ObstacleDraft>>,
  key: keyof ObstacleDraft,
  value: number,
) {
  setDraft((currentDraft) => ({
    ...currentDraft,
    [key]: readNonNegativeNumber(value),
  }));
}

function readNonNegativeNumber(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return value;
}

function getPositionModeLabel(surface: SurfaceData): string {
  if (surface.shape === "triangle") {
    return "Distanza dall’angolo destro della base + altezza dalla base (H)";
  }

  return "Distanza dalla base + distanza dal lato sinistro";
}

function getObstacleTypeLabel(type: ObstacleType): string {
  return (
    OBSTACLE_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type
  );
}

function getObstacleShapeLabel(shape: ObstacleShape): string {
  return shape === "rect" ? "Rettangolare" : "Circolare";
}

function getDraftDimensionsSummary(draft: ObstacleDraft): string {
  if (draft.shape === "rect") {
    return `${draft.width_cm} x ${draft.height_cm} cm, margine ${draft.safety_margin_cm} cm`;
  }

  return `Diametro ${draft.diameter_cm} cm, margine ${draft.safety_margin_cm} cm`;
}

function getDraftPositionSummary(
  draft: ObstacleDraft,
  surface: SurfaceData,
): string {
  if (surface.shape === "triangle") {
    return `Distanza dall’angolo destro ${draft.distance_from_base_right_corner_cm} cm, altezza H ${draft.height_from_base_cm} cm`;
  }

  return `Distanza dalla base ${draft.distance_from_base_cm} cm, distanza dal lato sinistro ${draft.distance_from_left_cm} cm`;
}

function getObstaclePositionSummary(
  obstacle: ObstacleData,
  surface: SurfaceData,
): string {
  if (surface.shape === "triangle") {
    const position = obstacle.position;

    if ("distance_from_base_right_corner_cm" in position) {
      return `Angolo destro base ${position.distance_from_base_right_corner_cm} cm, altezza H ${position.height_from_base_cm} cm`;
    }

    return "Posizione triangolare da verificare.";
  }

  const position = obstacle.position;

  if ("distance_from_base_cm" in position) {
    return `Base ${position.distance_from_base_cm} cm, lato sinistro ${position.distance_from_left_cm} cm`;
  }

  return "Posizione da verificare.";
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
