import {
  OBSTACLE_SHAPES,
  OBSTACLE_TYPES,
  ROOF_TYPES,
  SURFACE_SHAPES,
  WIZARD_STEP_IDS,
} from "@/types/domain";
import type {
  CircleObstacleDimensions,
  CustomerData,
  GuidedQuadSurfaceDimensions,
  InspectionData,
  ObstacleData,
  ObstaclePosition,
  PanelSelection,
  RectObstacleDimensions,
  RectangularSurfaceDimensions,
  SurfaceData,
  TrapezoidSurfaceDimensions,
  TriangleSurfaceDimensions,
} from "@/types/survey";
import {
  createEmptyWizardState,
  createSurveyMeta,
  type WizardState,
} from "./wizardState";

export const WIZARD_STORAGE_KEY = "sopralluogo_fotovoltaico_v1_wizard";
export const WIZARD_STORAGE_VERSION = 1;

type PersistedWizardState = WizardState & {
  storage_version: typeof WIZARD_STORAGE_VERSION;
};

export function serializeWizardState(state: WizardState): string {
  const persistedState: PersistedWizardState = {
    ...state,
    storage_version: WIZARD_STORAGE_VERSION,
  };

  return JSON.stringify(persistedState);
}

export function deserializeWizardState(rawValue: string): WizardState | null {
  try {
    return normalizeWizardState(JSON.parse(rawValue));
  } catch {
    return null;
  }
}

export function loadPersistedWizardState(): WizardState | null {
  if (!canUseLocalStorage()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(WIZARD_STORAGE_KEY);
  return rawValue ? deserializeWizardState(rawValue) : null;
}

export function savePersistedWizardState(state: WizardState): void {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(WIZARD_STORAGE_KEY, serializeWizardState(state));
}

export function clearPersistedWizardState(): void {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.removeItem(WIZARD_STORAGE_KEY);
}

export function normalizeWizardState(value: unknown): WizardState | null {
  if (!isRecord(value)) {
    return null;
  }

  if (value.storage_version !== WIZARD_STORAGE_VERSION) {
    return null;
  }

  if (!isWizardStepId(value.currentStepId)) {
    return null;
  }

  const baseState = createEmptyWizardState();
  const customer = normalizeCustomerData(value.customer);
  const inspection = normalizeInspectionData(value.inspection);
  const roofType = isRoofType(value.roof_type)
    ? value.roof_type
    : isRecord(value.roof) && isRoofType(value.roof.roof_type)
      ? value.roof.roof_type
      : null;
  const surfaces =
    isRecord(value.roof) && Array.isArray(value.roof.surfaces)
      ? value.roof.surfaces.filter(isSurfaceData)
      : [];
  const panelSelection = normalizePanelSelection(value.panel_selection);
  const completedStepIds = Array.isArray(value.completedStepIds)
    ? value.completedStepIds.filter(isWizardStepId)
    : [];

  return {
    ...baseState,
    survey_id: readString(value.survey_id, baseState.survey_id),
    currentStepId: value.currentStepId,
    completedStepIds,
    customer,
    inspection,
    roof: {
      roof_type: roofType,
      surfaces,
    },
    panel_selection: panelSelection,
    meta: createSurveyMeta(),
    updated_at: readNullableString(value.updated_at),
  };
}

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function normalizeCustomerData(value: unknown): CustomerData {
  return {
    first_name: readStringField(value, "first_name"),
    last_name: readStringField(value, "last_name"),
    phone: readStringField(value, "phone"),
    email: readStringField(value, "email"),
    address: readStringField(value, "address"),
    city: readStringField(value, "city"),
    province: readStringField(value, "province"),
  };
}

function normalizeInspectionData(value: unknown): InspectionData {
  return {
    date: readStringField(value, "date"),
    technician: readStringField(value, "technician"),
    notes: readStringField(value, "notes"),
  };
}

function normalizePanelSelection(value: unknown): PanelSelection {
  return {
    brand: readStringField(value, "brand"),
    model: readStringField(value, "model"),
  };
}

function isSurfaceData(value: unknown): value is SurfaceData {
  if (!isRecord(value) || !isSurfaceShape(value.shape)) {
    return false;
  }

  if (
    !isString(value.surface_id) ||
    !isString(value.name) ||
    !isString(value.orientation) ||
    !isNumber(value.tilt_deg) ||
    !isNumber(value.edge_clearance_cm) ||
    !isString(value.notes) ||
    !Array.isArray(value.obstacles)
  ) {
    return false;
  }

  if (!value.obstacles.every(isObstacleData)) {
    return false;
  }

  switch (value.shape) {
    case "rectangular":
      return isRectangularSurfaceDimensions(value.dimensions);
    case "trapezoid":
      return isTrapezoidSurfaceDimensions(value.dimensions);
    case "triangle":
      return isTriangleSurfaceDimensions(value.dimensions);
    case "guided_quad":
      return isGuidedQuadSurfaceDimensions(value.dimensions);
    default:
      return false;
  }
}

function isObstacleData(value: unknown): value is ObstacleData {
  if (
    !isRecord(value) ||
    !isString(value.obstacle_id) ||
    !isObstacleType(value.type) ||
    !isObstacleShape(value.shape) ||
    !isNumber(value.safety_margin_cm) ||
    !isObstaclePosition(value.position)
  ) {
    return false;
  }

  if (value.shape === "rect") {
    return isRectObstacleDimensions(value.dimensions);
  }

  return isCircleObstacleDimensions(value.dimensions);
}

function isRectangularSurfaceDimensions(
  value: unknown,
): value is RectangularSurfaceDimensions {
  return isRecord(value) && isNumber(value.width_cm) && isNumber(value.height_cm);
}

function isTrapezoidSurfaceDimensions(
  value: unknown,
): value is TrapezoidSurfaceDimensions {
  return (
    isRecord(value) &&
    isNumber(value.base_bottom_cm) &&
    isNumber(value.base_top_cm) &&
    isNumber(value.height_cm)
  );
}

function isTriangleSurfaceDimensions(
  value: unknown,
): value is TriangleSurfaceDimensions {
  return isRecord(value) && isNumber(value.base_cm) && isNumber(value.height_cm);
}

function isGuidedQuadSurfaceDimensions(
  value: unknown,
): value is GuidedQuadSurfaceDimensions {
  return (
    isRecord(value) &&
    isNumber(value.base_bottom_cm) &&
    isNumber(value.left_height_cm) &&
    isNumber(value.right_height_cm) &&
    isNumber(value.top_width_cm)
  );
}

function isObstaclePosition(value: unknown): value is ObstaclePosition {
  return (
    isRecord(value) &&
    ((isNumber(value.distance_from_base_cm) &&
      isNumber(value.distance_from_left_cm)) ||
      (isNumber(value.distance_from_base_right_corner_cm) &&
        isNumber(value.height_from_base_cm)))
  );
}

function isRectObstacleDimensions(
  value: unknown,
): value is RectObstacleDimensions {
  return isRecord(value) && isNumber(value.width_cm) && isNumber(value.height_cm);
}

function isCircleObstacleDimensions(
  value: unknown,
): value is CircleObstacleDimensions {
  return isRecord(value) && isNumber(value.diameter_cm);
}

function isWizardStepId(value: unknown): value is WizardState["currentStepId"] {
  return isString(value) && WIZARD_STEP_IDS.includes(value as never);
}

function isRoofType(value: unknown): value is NonNullable<WizardState["roof"]["roof_type"]> {
  return isString(value) && ROOF_TYPES.includes(value as never);
}

function isSurfaceShape(value: unknown): value is SurfaceData["shape"] {
  return isString(value) && SURFACE_SHAPES.includes(value as never);
}

function isObstacleType(value: unknown): value is ObstacleData["type"] {
  return isString(value) && OBSTACLE_TYPES.includes(value as never);
}

function isObstacleShape(value: unknown): value is ObstacleData["shape"] {
  return isString(value) && OBSTACLE_SHAPES.includes(value as never);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function readStringField(value: unknown, field: string): string {
  return isRecord(value) && isString(value[field]) ? value[field] : "";
}

function readString(value: unknown, fallback: string): string {
  return isString(value) && value.trim().length > 0 ? value : fallback;
}

function readNullableString(value: unknown): string | null {
  return isString(value) ? value : null;
}
