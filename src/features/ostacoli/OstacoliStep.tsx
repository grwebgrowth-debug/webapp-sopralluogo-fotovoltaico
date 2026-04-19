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
  ObstacleData,
  ObstaclePosition,
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

type NumberDraftValue = number | "";

type ObstacleDraft = {
  obstacle_id: string;
  type: ObstacleType;
  shape: ObstacleShape;
  safety_margin_cm: NumberDraftValue;
  width_cm: NumberDraftValue;
  height_cm: NumberDraftValue;
  diameter_cm: NumberDraftValue;
  distance_from_base_cm: NumberDraftValue;
  distance_from_left_cm: NumberDraftValue;
  distance_from_base_right_corner_cm: NumberDraftValue;
  height_from_base_cm: NumberDraftValue;
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
  "mt-1.5 w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]";
const labelClassName = "text-sm font-medium";

export function OstacoliStep() {
  const { actions, state } = useWizard();
  const surfaces = state.roof.surfaces;
  const [selectedSurfaceId, setSelectedSurfaceId] = useState(
    surfaces[0]?.surface_id ?? "",
  );
  const [editingObstacleId, setEditingObstacleId] = useState<string | null>(null);
  const [newObstacleMode, setNewObstacleMode] = useState(false);
  const [draft, setDraft] = useState<ObstacleDraft>(() =>
    createEmptyObstacleDraft(),
  );
  const selectedSurface = useMemo(
    () =>
      surfaces.find((surface) => surface.surface_id === selectedSurfaceId) ??
      surfaces[0] ??
      null,
    [selectedSurfaceId, surfaces],
  );
  const selectedSurfaceIndex = selectedSurface
    ? surfaces.findIndex(
        (surface) => surface.surface_id === selectedSurface.surface_id,
      )
    : -1;
  const selectedSurfaceLabel = selectedSurface
    ? getSurfaceLabel(selectedSurface, selectedSurfaceIndex)
    : "";
  const selectedSurfaceShortLabel =
    selectedSurfaceIndex >= 0 ? `Falda ${selectedSurfaceIndex + 1}` : "Falda";
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

    if (
      selectedSurface &&
      selectedSurface.obstacles.length > 0 &&
      !editingObstacleId &&
      !newObstacleMode &&
      isEmptyObstacleDraft(draft)
    ) {
      openObstacle(selectedSurface.obstacles[selectedSurface.obstacles.length - 1]);
    }
  }, [
    draft,
    editingObstacleId,
    newObstacleMode,
    selectedSurface,
    selectedSurfaceId,
    surfaces,
  ]);

  function resetDraft() {
    setEditingObstacleId(null);
    setNewObstacleMode(true);
    setDraft(createEmptyObstacleDraft());
  }

  function openObstacle(obstacle: ObstacleData) {
    setEditingObstacleId(obstacle.obstacle_id);
    setNewObstacleMode(false);
    setDraft(createDraftFromObstacle(obstacle));
  }

  function startEditObstacle(obstacle: ObstacleData) {
    openObstacle(obstacle);
  }

  function selectSurface(surface: SurfaceData) {
    setSelectedSurfaceId(surface.surface_id);

    const existingObstacle = surface.obstacles[surface.obstacles.length - 1];

    if (existingObstacle) {
      openObstacle(existingObstacle);
      return;
    }

    resetDraft();
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

    openObstacle(obstacle);
  }

  function deleteObstacle(obstacleId: string) {
    if (!selectedSurface) {
      return;
    }

    actions.eliminaOstacolo(selectedSurface.surface_id, obstacleId);

    if (editingObstacleId === obstacleId) {
      const remainingObstacles = selectedSurface.obstacles.filter(
        (obstacle) => obstacle.obstacle_id !== obstacleId,
      );
      const nextObstacle = remainingObstacles[remainingObstacles.length - 1];

      if (nextObstacle) {
        openObstacle(nextObstacle);
        return;
      }

      resetDraft();
    }
  }

  if (surfaces.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface-soft)] p-5">
        <h2 className="text-xl font-semibold">Ostacoli</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Crea almeno una falda nello step Tetto e falde.
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Ostacoli</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Seleziona una falda e aggiungi gli ostacoli principali.
        </p>
      </div>

      {selectedSurface && (
        <div className="grid min-w-0 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(340px,420px)]">
          <aside className="sticky top-0 z-30 order-1 self-start xl:order-2">
            <ObstaclePreview
              draftObstacle={draftObstacle}
              geometryValid={geometryValidation?.valido ?? false}
              savedObstacles={selectedSurface.obstacles}
              surface={selectedSurface}
              surfaceTitle={selectedSurfaceShortLabel}
              selectedSurfaceId={selectedSurface.surface_id}
              surfaces={surfaces}
              onSelect={selectSurface}
            />
          </aside>

          <div className="order-2 min-w-0 space-y-3 xl:order-1">
            <section className="rounded-lg border border-[var(--border)] bg-white p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {editingObstacleId ? "Modifica ostacolo" : "Nuovo ostacolo"}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {selectedSurfaceLabel}
                  </p>
                </div>
                {editingObstacleId && (
                  <button
                    className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
                    type="button"
                    onClick={resetDraft}
                  >
                    Annulla
                  </button>
                )}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className={labelClassName}>
                  Nome ostacolo
                  <input
                    className={inputClassName}
                    placeholder={getAutoObstacleName(draft.type, selectedSurface)}
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
                  Tipo *
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
                  Forma *
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
                  Margine (cm) *
                  <input
                    className={inputClassName}
                    min={0}
                    placeholder="Esempio: 30"
                    type="number"
                    value={draft.safety_margin_cm}
                    onChange={(event) =>
                      updateDraftNumber(
                        setDraft,
                        "safety_margin_cm",
                        event.target.value,
                      )
                    }
                  />
                </label>

                {draft.shape === "rect" ? (
                  <>
                    <NumberField
                      label="Larghezza"
                      value={draft.width_cm}
                      onChange={(value) =>
                        updateDraftNumber(setDraft, "width_cm", value)
                      }
                    />
                    <NumberField
                      label="Altezza"
                      value={draft.height_cm}
                      onChange={(value) =>
                        updateDraftNumber(setDraft, "height_cm", value)
                      }
                    />
                  </>
                ) : (
                  <NumberField
                    label="Diametro"
                    value={draft.diameter_cm}
                    onChange={(value) =>
                      updateDraftNumber(setDraft, "diameter_cm", value)
                    }
                  />
                )}

                {selectedSurface.shape === "triangle" ? (
                  <>
                    <NumberField
                      label="Angolo base destra"
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
                      label="Altezza H"
                      value={draft.height_from_base_cm}
                      onChange={(value) =>
                        updateDraftNumber(setDraft, "height_from_base_cm", value)
                      }
                    />
                  </>
                ) : (
                  <>
                    <NumberField
                      label="Base"
                      value={draft.distance_from_base_cm}
                      onChange={(value) =>
                        updateDraftNumber(setDraft, "distance_from_base_cm", value)
                      }
                    />
                    <NumberField
                      label="Lato sinistro"
                      value={draft.distance_from_left_cm}
                      onChange={(value) =>
                        updateDraftNumber(setDraft, "distance_from_left_cm", value)
                      }
                    />
                  </>
                )}
              </div>

              {validationErrors.length > 0 && (
                <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] p-3">
                  <p className="text-sm font-semibold">
                    Controlla i dati dell'ostacolo:
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
                    {validationErrors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={validationErrors.length > 0}
                  type="button"
                  onClick={saveObstacle}
                >
                  {editingObstacleId ? "Salva modifica" : "Aggiungi ostacolo"}
                </button>
                <button
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm"
                  type="button"
                  onClick={resetDraft}
                >
                  Nuovo
                </button>
              </div>
            </section>

            <section className="rounded-lg border border-[var(--border)] bg-white p-4">
              <h3 className="text-lg font-semibold">Ostacoli inseriti</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {selectedSurfaceLabel}
              </p>
              {selectedSurface.obstacles.length === 0 ? (
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                  Nessun ostacolo inserito su questa falda.
                </p>
              ) : (
                <div className="mt-4 space-y-2">
                  {selectedSurface.obstacles.map((obstacle, index) => (
                    <div
                      key={`${obstacle.obstacle_id}-${index}`}
                      className="rounded-lg border border-[var(--border)] p-3 text-sm"
                    >
                      <p className="font-semibold">
                        {getObstacleDisplayName(obstacle, index)}
                      </p>
                      <p className="mt-1 text-[var(--muted)]">
                        {getObstacleTypeLabel(obstacle.type)} -{" "}
                        {getObstacleShapeLabel(obstacle.shape)} -{" "}
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
                          : "Da verificare"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-slate-950"
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
          </div>
        </div>
      )}
    </div>
  );
}

type NumberFieldProps = {
  label: string;
  value: NumberDraftValue;
  onChange: (value: string) => void;
};

type SurfaceTabsProps = {
  onSelect: (surface: SurfaceData) => void;
  selectedSurfaceId: string;
  surfaces: SurfaceData[];
};

function SurfaceTabs({
  onSelect,
  selectedSurfaceId,
  surfaces,
}: SurfaceTabsProps) {
  return (
    <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
      {surfaces.map((surface, index) => {
        const selected = surface.surface_id === selectedSurfaceId;

        return (
          <button
            key={surface.surface_id}
            className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              selected
                ? "bg-[var(--accent)] text-slate-950"
                : "border border-[var(--border)] bg-white text-[var(--foreground)]"
            }`}
            type="button"
            onClick={() => onSelect(surface)}
          >
            Falda {index + 1}
            <span className="ml-1 font-normal opacity-80">
              {surface.obstacles.length}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function NumberField({ label, value, onChange }: NumberFieldProps) {
  return (
    <label className={labelClassName}>
      {label} (cm) *
      <input
        className={inputClassName}
        min={0}
        placeholder="Misura in cm"
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

type ObstaclePreviewProps = {
  draftObstacle: ObstacleData | null;
  geometryValid: boolean;
  onSelect: (surface: SurfaceData) => void;
  savedObstacles: ObstacleData[];
  selectedSurfaceId: string;
  surface: SurfaceData;
  surfaceTitle: string;
  surfaces: SurfaceData[];
};

function ObstaclePreview({
  draftObstacle,
  geometryValid,
  onSelect,
  savedObstacles,
  selectedSurfaceId,
  surface,
  surfaceTitle,
  surfaces,
}: ObstaclePreviewProps) {
  const falda = creaPoligonoFalda(surface);
  const bounds = getPoligonoBounds(falda);
  const hasDraft = Boolean(draftObstacle);
  const statusLabel = hasDraft
    ? geometryValid
      ? "Completa"
      : "Da correggere"
    : "Compila";
  const statusClassName = hasDraft
    ? geometryValid
      ? "bg-emerald-100 text-emerald-800"
      : "bg-red-100 text-red-800"
    : "bg-slate-200 text-slate-800";

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[color:rgba(12,27,24,0.98)] p-2.5 shadow-xl shadow-black/25">
      <div className="flex items-center justify-between gap-2">
        <SurfaceTabs
          selectedSurfaceId={selectedSurfaceId}
          surfaces={surfaces}
          onSelect={onSelect}
        />
        <span
          className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-semibold ${statusClassName}`}
        >
          {statusLabel}
        </span>
      </div>

      <h3 className="mt-2 truncate text-sm font-semibold">{surfaceTitle}</h3>

      <GeometryPreviewSvg
        bounds={bounds}
        draftObstacle={draftObstacle}
        falda={falda}
        savedObstacles={savedObstacles}
        surface={surface}
      />
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
  const viewBoxHeight = 190;
  const padding = 18;
  const mapPoint = createSvgPointMapper(bounds, viewBoxWidth, viewBoxHeight, padding);
  const faldaPoints = falda.map(mapPoint).map(toSvgPoint).join(" ");

  return (
    <svg
      aria-label="Falda e ostacoli"
      className="mt-1.5 h-auto max-h-[28vh] w-full rounded-lg border border-[var(--border)] bg-white xl:max-h-none"
      role="img"
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
    >
      <polygon
        fill="#10201d"
        points={faldaPoints}
        stroke="#14b8a6"
        strokeWidth="2"
      />

      {savedObstacles.map((obstacle, index) => (
        <ObstacleSvg
          key={`${obstacle.obstacle_id}-${index}`}
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
    tone === "invalid" ? "#fca5a5" : tone === "valid" ? "#6ee7b7" : "#93c5fd";
  const fillColor =
    tone === "invalid" ? "#7f1d1d" : tone === "valid" ? "#064e3b" : "#1e3a8a";

  if (geometry.shape === "rect") {
    const points = geometry.vertices.map(mapPoint).map(toSvgPoint).join(" ");
    const expandedPoints = geometry.expanded_vertices
      .map(mapPoint)
      .map(toSvgPoint)
      .join(" ");
    const center = mapPoint(geometry.center);

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
        <circle cx={center.x_cm} cy={center.y_cm} fill={strokeColor} r="3" />
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

  return (
    <g>
      <circle
        cx={center.x_cm}
        cy={center.y_cm}
        fill="none"
        r={Math.abs(expandedRadiusPoint.x_cm - center.x_cm)}
        stroke={strokeColor}
        strokeDasharray="4 3"
        strokeWidth="1.5"
      />
      <circle
        cx={center.x_cm}
        cy={center.y_cm}
        fill={fillColor}
        fillOpacity="0.85"
        r={Math.abs(radiusPoint.x_cm - center.x_cm)}
        stroke={strokeColor}
        strokeWidth="2"
      />
      <circle cx={center.x_cm} cy={center.y_cm} fill={strokeColor} r="3" />
    </g>
  );
}

function createEmptyObstacleDraft(): ObstacleDraft {
  return {
    obstacle_id: "",
    type: "camino",
    shape: "rect",
    safety_margin_cm: "",
    width_cm: "",
    height_cm: "",
    diameter_cm: "",
    distance_from_base_cm: "",
    distance_from_left_cm: "",
    distance_from_base_right_corner_cm: "",
    height_from_base_cm: "",
  };
}

function isEmptyObstacleDraft(draft: ObstacleDraft): boolean {
  return (
    !draft.obstacle_id &&
    draft.safety_margin_cm === "" &&
    draft.width_cm === "" &&
    draft.height_cm === "" &&
    draft.diameter_cm === "" &&
    draft.distance_from_base_cm === "" &&
    draft.distance_from_left_cm === "" &&
    draft.distance_from_base_right_corner_cm === "" &&
    draft.height_from_base_cm === ""
  );
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
  const obstacleId =
    draft.obstacle_id.trim() || getAutoObstacleName(draft.type, surface);

  if (draft.shape === "rect") {
    return {
      obstacle_id: obstacleId,
      type: draft.type,
      shape: "rect",
      safety_margin_cm: getDraftNumber(draft.safety_margin_cm),
      position,
      dimensions: {
        width_cm: getDraftNumber(draft.width_cm),
        height_cm: getDraftNumber(draft.height_cm),
      },
    };
  }

  return {
    obstacle_id: obstacleId,
    type: draft.type,
    shape: "circle",
    safety_margin_cm: getDraftNumber(draft.safety_margin_cm),
    position,
    dimensions: {
      diameter_cm: getDraftNumber(draft.diameter_cm),
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
        getDraftNumber(draft.distance_from_base_right_corner_cm),
      height_from_base_cm: getDraftNumber(draft.height_from_base_cm),
    };
  }

  return {
    distance_from_base_cm: getDraftNumber(draft.distance_from_base_cm),
    distance_from_left_cm: getDraftNumber(draft.distance_from_left_cm),
  };
}

function validateObstacleDraft(
  draft: ObstacleDraft,
  surface: SurfaceData,
): { errors: string[]; baseFieldsValid: boolean } {
  const errors: string[] = [];

  if (!isPositiveDraftNumber(draft.safety_margin_cm)) {
    errors.push("Margine obbligatorio e maggiore di zero.");
  }

  if (draft.shape === "rect") {
    if (!isPositiveDraftNumber(draft.width_cm)) {
      errors.push("Larghezza obbligatoria e maggiore di zero.");
    }

    if (!isPositiveDraftNumber(draft.height_cm)) {
      errors.push("Altezza obbligatoria e maggiore di zero.");
    }
  }

  if (draft.shape === "circle" && !isPositiveDraftNumber(draft.diameter_cm)) {
    errors.push("Diametro obbligatorio e maggiore di zero.");
  }

  if (surface.shape === "triangle") {
    if (!isPositiveDraftNumber(draft.distance_from_base_right_corner_cm)) {
      errors.push("Angolo base destra obbligatorio e maggiore di zero.");
    }

    if (!isPositiveDraftNumber(draft.height_from_base_cm)) {
      errors.push("Altezza H obbligatoria e maggiore di zero.");
    }
  } else {
    if (!isPositiveDraftNumber(draft.distance_from_base_cm)) {
      errors.push("Base obbligatoria e maggiore di zero.");
    }

    if (!isPositiveDraftNumber(draft.distance_from_left_cm)) {
      errors.push("Lato sinistro obbligatorio e maggiore di zero.");
    }
  }

  return { errors, baseFieldsValid: errors.length === 0 };
}

function getDraftNumber(value: NumberDraftValue): number {
  return typeof value === "number" ? value : 0;
}

function isPositiveDraftNumber(value: NumberDraftValue): boolean {
  return typeof value === "number" && value > 0;
}

function updateDraftNumber(
  setDraft: Dispatch<SetStateAction<ObstacleDraft>>,
  key: keyof ObstacleDraft,
  value: string,
) {
  setDraft((currentDraft) => ({
    ...currentDraft,
    [key]: readNonNegativeNumber(value),
  }));
}

function readNonNegativeNumber(value: string): NumberDraftValue {
  if (value.trim() === "") {
    return "";
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return "";
  }

  return numericValue;
}

function getObstacleTypeLabel(type: ObstacleType): string {
  return (
    OBSTACLE_TYPE_OPTIONS.find((option) => option.value === type)?.label ?? type
  );
}

function getObstacleShapeLabel(shape: ObstacleShape): string {
  return shape === "rect" ? "Rettangolare" : "Circolare";
}

function getObstacleDisplayName(obstacle: ObstacleData, index: number): string {
  if (obstacle.obstacle_id.trim() && !obstacle.obstacle_id.startsWith("ostacolo_")) {
    return obstacle.obstacle_id;
  }

  return `${getObstacleTypeLabel(obstacle.type)} ${index + 1}`;
}

function getAutoObstacleName(type: ObstacleType, surface: SurfaceData): string {
  const sameTypeCount = surface.obstacles.filter(
    (obstacle) => obstacle.type === type,
  ).length;

  return `${getObstacleTypeLabel(type)} ${sameTypeCount + 1}`;
}

function getSurfaceLabel(surface: SurfaceData, index: number): string {
  const ordinal = index >= 0 ? index + 1 : 1;
  const baseLabel = `Falda ${ordinal}`;
  const surfaceName = surface.name.trim();

  if (!surfaceName || surfaceName.toLowerCase() === baseLabel.toLowerCase()) {
    return baseLabel;
  }

  return `${baseLabel} - ${surfaceName}`;
}

function getObstaclePositionSummary(
  obstacle: ObstacleData,
  surface: SurfaceData,
): string {
  if (surface.shape === "triangle") {
    const position = obstacle.position;

    if ("distance_from_base_right_corner_cm" in position) {
      return `angolo base ${position.distance_from_base_right_corner_cm} cm, H ${position.height_from_base_cm} cm`;
    }

    return "posizione da verificare";
  }

  const position = obstacle.position;

  if ("distance_from_base_cm" in position) {
    return `base ${position.distance_from_base_cm} cm, lato ${position.distance_from_left_cm} cm`;
  }

  return "posizione da verificare";
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
