import {
  OBSTACLE_SHAPES,
  OBSTACLE_TYPES,
  ROOF_TYPES,
  SURFACE_SHAPES,
  WIZARD_STEP_IDS,
} from "@/types/domain";
import type {
  PreliminaryModuleLayout,
  PositionedModule,
  SurfaceModuleLayout,
} from "@/types/layout";
import type { PanelTechnicalData } from "@/types/panels";
import type { SurveyPhoto } from "@/types/photos";
import type { ActiveClientProfileSnapshot } from "@/types/profiles";
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
    photos: state.photos.map(stripPhotoForStorage),
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
  const customSurfaceCount =
    isRecord(value.roof) && isNumber(value.roof.custom_surface_count)
      ? value.roof.custom_surface_count
      : null;
  const panelSelection = normalizePanelSelection(value.panel_selection);
  const panelTechnicalData = normalizePanelTechnicalData(
    value.panel_technical_data,
  );
  const preliminaryLayout = normalizePreliminaryLayout(value.preliminary_layout);
  const photos = Array.isArray(value.photos)
    ? value.photos.map(normalizeSurveyPhoto).filter(isSurveyPhoto)
    : [];
  const activeClientProfile = normalizeActiveClientProfile(
    value.active_client_profile,
  );
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
      custom_surface_count: customSurfaceCount,
    },
    panel_selection: panelSelection,
    panel_technical_data: panelTechnicalData,
    preliminary_layout: preliminaryLayout,
    photos,
    active_client_profile: activeClientProfile,
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

function normalizePanelTechnicalData(value: unknown): PanelTechnicalData {
  return {
    width_cm: readNumberField(value, "width_cm"),
    height_cm: readNumberField(value, "height_cm"),
    power_w: readNumberField(value, "power_w"),
    source:
      isRecord(value) && (value.source === "catalogo" || value.source === "manuale")
        ? value.source
        : null,
  };
}

function normalizePreliminaryLayout(
  value: unknown,
): PreliminaryModuleLayout | null {
  if (!isRecord(value) || !Array.isArray(value.surfaces)) {
    return null;
  }

  const surfaces = value.surfaces.filter(isSurfaceModuleLayout);

  return {
    calculated_at: readString(value.calculated_at, ""),
    panel: normalizePanelTechnicalData(value.panel),
    surfaces,
    total_modules: readNumberField(value, "total_modules"),
    total_power_w: readNumberField(value, "total_power_w"),
    messages: Array.isArray(value.messages)
      ? value.messages.filter(isString)
      : [],
  };
}

function normalizeSurveyPhoto(value: unknown): SurveyPhoto | null {
  if (
    !isRecord(value) ||
    !isString(value.photo_id) ||
    !isSurveyPhotoType(value.type)
  ) {
    return null;
  }

  return {
    photo_id: value.photo_id,
    type: value.type,
    note: readStringField(value, "note"),
    file_name: readStringField(value, "file_name"),
    file_size: readNumberField(value, "file_size"),
    mime_type: readStringField(value, "mime_type"),
    added_at: readStringField(value, "added_at"),
  };
}

function isSurveyPhoto(value: SurveyPhoto | null): value is SurveyPhoto {
  return value !== null;
}

function normalizeActiveClientProfile(
  value: unknown,
): ActiveClientProfileSnapshot | null {
  if (!isRecord(value) || !isString(value.profile_id)) {
    return null;
  }

  return {
    profile_id: value.profile_id,
    profile_name: readStringField(value, "profile_name"),
    company_name: readStringField(value, "company_name"),
    client_code: readStringField(value, "client_code"),
    default_technician: readStringField(value, "default_technician"),
    preferred_theme:
      value.preferred_theme === "scuro_verde" ||
      value.preferred_theme === "scuro_blu"
        ? value.preferred_theme
        : "scuro_teal",
    n8n_base_url: readStringField(value, "n8n_base_url"),
    survey_submit_endpoint: readStringField(value, "survey_submit_endpoint"),
    panel_catalog_endpoint: readStringField(value, "panel_catalog_endpoint"),
    google_sheet_panel_catalog: readStringField(
      value,
      "google_sheet_panel_catalog",
    ),
    google_sheet_surveys: readStringField(value, "google_sheet_surveys"),
    google_sheet_price_list: readStringField(
      value,
      "google_sheet_price_list",
    ),
    require_photos_before_submit: Boolean(
      value.require_photos_before_submit,
    ),
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

function isSurfaceModuleLayout(value: unknown): value is SurfaceModuleLayout {
  if (
    !isRecord(value) ||
    !isString(value.surface_id) ||
    !isString(value.surface_name) ||
    (value.selected_orientation !== "verticale" &&
      value.selected_orientation !== "orizzontale") ||
    !isNumber(value.module_count) ||
    !Array.isArray(value.modules) ||
    !isNumber(value.useful_area_cm2) ||
    !isNumber(value.occupied_area_cm2) ||
    !isNumber(value.total_power_w)
  ) {
    return false;
  }

  return value.modules.every(isPositionedModule);
}

function isPositionedModule(value: unknown): value is PositionedModule {
  return (
    isRecord(value) &&
    isString(value.module_id) &&
    isString(value.surface_id) &&
    isNumber(value.x_cm) &&
    isNumber(value.y_cm) &&
    isNumber(value.width_cm) &&
    isNumber(value.height_cm) &&
    (value.orientation === "verticale" || value.orientation === "orizzontale")
  );
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

function isSurveyPhotoType(value: unknown): value is SurveyPhoto["type"] {
  return (
    value === "tetto_panoramica" ||
    value === "falda" ||
    value === "ostacolo" ||
    value === "quadro_elettrico" ||
    value === "contatore" ||
    value === "altro"
  );
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

function readNumberField(value: unknown, field: string): number {
  return isRecord(value) && isNumber(value[field]) ? value[field] : 0;
}

function readString(value: unknown, fallback: string): string {
  return isString(value) && value.trim().length > 0 ? value : fallback;
}

function readNullableString(value: unknown): string | null {
  return isString(value) ? value : null;
}

function stripPhotoForStorage(photo: SurveyPhoto): SurveyPhoto {
  const { preview_url: _previewUrl, ...persistablePhoto } = photo;
  return persistablePhoto;
}
