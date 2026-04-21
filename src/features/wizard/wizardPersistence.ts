import {
  OBSTACLE_SHAPES,
  OBSTACLE_TYPES,
  ROOF_TYPES,
  SURFACE_COVERAGES,
  SURFACE_SHAPES,
  WIZARD_STEP_IDS,
} from "@/types/domain";
import type {
  LayoutCalculationMode,
  LayoutTargetConfig,
  PreliminaryModuleLayout,
  PositionedModule,
  SurfaceModuleLayout,
} from "@/types/layout";
import type { PanelTechnicalData } from "@/types/panels";
import type { InverterCatalogItem } from "@/types/panels";
import type { SurveyPhoto } from "@/types/photos";
import {
  CLIENT_THEME_PREFERENCES,
  type ActiveClientProfileSnapshot,
} from "@/types/profiles";
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
  SystemComponentsData,
  TrapezoidSurfaceDimensions,
  TriangleSurfaceDimensions,
} from "@/types/survey";
import {
  createDefaultLayoutTargetConfig,
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

  const currentStepId = normalizeWizardStepId(value.currentStepId);

  if (!currentStepId) {
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
      ? value.roof.surfaces.map(normalizeSurfaceData).filter(isSurfaceData)
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
  const layoutConfig = normalizeLayoutTargetConfig(value.layout_config);
  const photos = Array.isArray(value.photos)
    ? value.photos.map(normalizeSurveyPhoto).filter(isSurveyPhoto)
    : [];
  const systemComponents = normalizeSystemComponents(value.system_components);
  const activeClientProfile = normalizeActiveClientProfile(
    value.active_client_profile,
  );
  const completedStepIds = Array.isArray(value.completedStepIds)
    ? Array.from(
        new Set(value.completedStepIds.map(normalizeWizardStepId).filter(isWizardStepId)),
      )
    : [];

  return {
    ...baseState,
    survey_id: readString(value.survey_id, baseState.survey_id),
    currentStepId,
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
    layout_config: reconcileLayoutTargetConfig(layoutConfig, panelTechnicalData.power_w),
    preliminary_layout: preliminaryLayout,
    system_components: systemComponents,
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

function normalizeLayoutTargetConfig(value: unknown): LayoutTargetConfig {
  if (!isRecord(value)) {
    return createDefaultLayoutTargetConfig();
  }

  const mode = isLayoutCalculationMode(value.mode)
    ? value.mode
    : "max_modules";

  if (mode !== "target_power") {
    return createDefaultLayoutTargetConfig();
  }

  return {
    mode,
    target_module_count: readNullablePositiveInteger(
      value.target_module_count,
    ),
    target_power_w: readNullablePositiveNumber(value.target_power_w),
  };
}

function reconcileLayoutTargetConfig(
  config: LayoutTargetConfig,
  panelPowerW: number,
): LayoutTargetConfig {
  if (config.mode !== "target_power") {
    return createDefaultLayoutTargetConfig();
  }

  return {
    mode: "target_power",
    target_module_count: config.target_module_count,
    target_power_w:
      config.target_module_count !== null && panelPowerW > 0
        ? config.target_module_count * panelPowerW
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
  const totalModules = readNumberField(value, "total_modules");
  const totalPowerW = readNumberField(value, "total_power_w");

  return {
    calculated_at: readString(value.calculated_at, ""),
    layout_mode: isLayoutCalculationMode(value.layout_mode)
      ? value.layout_mode
      : "max_modules",
    panel: normalizePanelTechnicalData(value.panel),
    surfaces,
    target_module_count: readNullablePositiveInteger(value.target_module_count),
    target_power_w: readNullablePositiveNumber(value.target_power_w),
    available_modules: isNumber(value.available_modules)
      ? value.available_modules
      : totalModules,
    available_power_w: isNumber(value.available_power_w)
      ? value.available_power_w
      : totalPowerW,
    target_reached: isBoolean(value.target_reached)
      ? value.target_reached
      : null,
    total_modules: totalModules,
    total_power_w: totalPowerW,
    messages: Array.isArray(value.messages)
      ? value.messages.filter(isString)
      : [],
  };
}

function normalizeSurveyPhoto(value: unknown): SurveyPhoto | null {
  if (
    !isRecord(value) ||
    !isString(value.photo_id) ||
    (!isSurveyPhotoType(value.type) && value.type !== "falda")
  ) {
    return null;
  }

  return {
    photo_id: value.photo_id,
    type: normalizeSurveyPhotoType(value.type),
    note: readStringField(value, "note"),
    file_name: readStringField(value, "file_name"),
    file_size: readNumberField(value, "file_size"),
    mime_type: readStringField(value, "mime_type"),
    added_at: readStringField(value, "added_at"),
    preview_url: undefined,
    raw_file: undefined,
  };
}

function isSurveyPhoto(value: SurveyPhoto | null): value is SurveyPhoto {
  return value !== null;
}

function normalizeSystemComponents(value: unknown): SystemComponentsData {
  const inverterValue = isRecord(value) ? value.inverter : undefined;

  return {
    inverter: normalizeInverterCatalogItem(inverterValue),
    cable_length_m: readNumberField(value, "cable_length_m"),
    technical_notes: readStringField(value, "technical_notes"),
  };
}

function normalizeActiveClientProfile(
  value: unknown,
): ActiveClientProfileSnapshot | null {
  if (!isRecord(value) || !isString(value.profile_id)) {
    return null;
  }

  const preferredTheme =
    isString(value.preferred_theme) &&
    CLIENT_THEME_PREFERENCES.includes(value.preferred_theme as never)
      ? (value.preferred_theme as ActiveClientProfileSnapshot["preferred_theme"])
      : "scuro_teal";

  return {
    profile_id: value.profile_id,
    profile_name: readStringField(value, "profile_name"),
    company_name: readStringField(value, "company_name"),
    client_code: readStringField(value, "client_code"),
    default_technician: readStringField(value, "default_technician"),
    preferred_theme: preferredTheme,
    require_photos_before_submit: Boolean(
      value.require_photos_before_submit,
    ),
    demo_mode: Boolean(value.demo_mode),
  };
}

function normalizeSurfaceData(value: unknown): SurfaceData | null {
  if (!isRecord(value) || !isSurfaceShape(value.shape)) {
    return null;
  }

  const baseSurface = {
    surface_id: readStringField(value, "surface_id"),
    name: readStringField(value, "name"),
    shape: value.shape,
    orientation: readStringField(value, "orientation"),
    coverage: isSurfaceCoverage(value.coverage) ? value.coverage : "",
    tilt_deg: readNumberField(value, "tilt_deg"),
    edge_clearance_cm: readNumberField(value, "edge_clearance_cm"),
    notes: readStringField(value, "notes"),
    obstacles: Array.isArray(value.obstacles)
      ? value.obstacles.filter(isObstacleData)
      : [],
  };

  switch (value.shape) {
    case "rectangular":
      return isRectangularSurfaceDimensions(value.dimensions)
        ? {
            ...baseSurface,
            shape: "rectangular",
            dimensions: value.dimensions,
          }
        : null;
    case "trapezoid":
      return isTrapezoidSurfaceDimensions(value.dimensions)
        ? {
            ...baseSurface,
            shape: "trapezoid",
            dimensions: value.dimensions,
          }
        : null;
    case "triangle":
      return isTriangleSurfaceDimensions(value.dimensions)
        ? {
            ...baseSurface,
            shape: "triangle",
            dimensions: value.dimensions,
          }
        : null;
    case "guided_quad":
      return isGuidedQuadSurfaceDimensions(value.dimensions)
        ? {
            ...baseSurface,
            shape: "guided_quad",
            dimensions: value.dimensions,
          }
        : null;
    default:
      return null;
  }
}

function isSurfaceData(value: SurfaceData | null): value is SurfaceData {
  if (!isRecord(value) || !isSurfaceShape(value.shape)) {
    return false;
  }

  if (
    !isString(value.surface_id) ||
    !isString(value.name) ||
    !isString(value.orientation) ||
    !isString(value.coverage) ||
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

function normalizeWizardStepId(
  value: unknown,
): WizardState["currentStepId"] | null {
  if (isWizardStepId(value)) {
    return value;
  }

  if (value === "falde") {
    return "tetto";
  }

  if (value === "invio") {
    return "revisione";
  }

  return null;
}

function isLayoutCalculationMode(value: unknown): value is LayoutCalculationMode {
  return value === "max_modules" || value === "target_power";
}

function isSurveyPhotoType(value: unknown): value is SurveyPhoto["type"] {
  return (
    value === "tetto_panoramica" ||
    value === "falda_1" ||
    value === "falda_2" ||
    value === "ostacolo" ||
    value === "quadro_elettrico" ||
    value === "contatore" ||
    value === "inverter_esistente" ||
    value === "copertura" ||
    value === "altro"
  );
}

function normalizeSurveyPhotoType(value: unknown): SurveyPhoto["type"] {
  if (value === "falda") {
    return "falda_1";
  }

  return isSurveyPhotoType(value) ? value : "tetto_panoramica";
}

function isRoofType(value: unknown): value is NonNullable<WizardState["roof"]["roof_type"]> {
  return isString(value) && ROOF_TYPES.includes(value as never);
}

function isSurfaceShape(value: unknown): value is SurfaceData["shape"] {
  return isString(value) && SURFACE_SHAPES.includes(value as never);
}

function isSurfaceCoverage(value: unknown): value is SurfaceData["coverage"] {
  return value === "" || (isString(value) && SURFACE_COVERAGES.includes(value as never));
}

function isObstacleType(value: unknown): value is ObstacleData["type"] {
  return isString(value) && OBSTACLE_TYPES.includes(value as never);
}

function isObstacleShape(value: unknown): value is ObstacleData["shape"] {
  return isString(value) && OBSTACLE_SHAPES.includes(value as never);
}

function normalizeInverterCatalogItem(
  value: unknown,
): InverterCatalogItem | null {
  if (!isRecord(value) || !isString(value.componente_id) || !isString(value.descrizione)) {
    return null;
  }

  return {
    componente_id: value.componente_id,
    codice_articolo: readOptionalStringField(value, "codice_articolo"),
    descrizione: value.descrizione,
    sottocategoria: readOptionalStringField(value, "sottocategoria"),
    potenza_nominale_kw: isNumber(value.potenza_nominale_kw)
      ? value.potenza_nominale_kw
      : null,
    brand: readOptionalStringField(value, "brand"),
    model: readOptionalStringField(value, "model"),
    notes: readOptionalStringField(value, "notes"),
  };
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

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function readStringField(value: unknown, field: string): string {
  return isRecord(value) && isString(value[field]) ? value[field] : "";
}

function readOptionalStringField(value: unknown, field: string): string | undefined {
  return isRecord(value) && isString(value[field]) ? value[field] : undefined;
}

function readNumberField(value: unknown, field: string): number {
  return isRecord(value) && isNumber(value[field]) ? value[field] : 0;
}

function readNullablePositiveInteger(value: unknown): number | null {
  return isNumber(value) && value > 0 ? Math.floor(value) : null;
}

function readNullablePositiveNumber(value: unknown): number | null {
  return isNumber(value) && value > 0 ? value : null;
}

function readString(value: unknown, fallback: string): string {
  return isString(value) && value.trim().length > 0 ? value : fallback;
}

function readNullableString(value: unknown): string | null {
  return isString(value) ? value : null;
}

function stripPhotoForStorage(photo: SurveyPhoto): SurveyPhoto {
  const {
    preview_url: _previewUrl,
    raw_file: _rawFile,
    ...persistablePhoto
  } = photo;
  return persistablePhoto;
}
