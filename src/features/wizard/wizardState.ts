import type { RoofType, WizardStepId } from "@/types/domain";
import { WIZARD_STEP_IDS } from "@/types/domain";
import type { LayoutTargetConfig, PreliminaryModuleLayout } from "@/types/layout";
import type { PanelTechnicalData } from "@/types/panels";
import type { SurveyPhoto } from "@/types/photos";
import type { ActiveClientProfileSnapshot } from "@/types/profiles";
import type {
  CustomerData,
  InspectionData,
  ObstacleData,
  PanelSelection,
  SurfaceData,
  SurveyMeta,
} from "@/types/survey";

export type WizardRoofState = {
  roof_type: RoofType | null;
  surfaces: SurfaceData[];
  custom_surface_count: number | null;
};

export type WizardState = {
  survey_id: string;
  currentStepId: WizardStepId;
  completedStepIds: WizardStepId[];
  customer: CustomerData;
  inspection: InspectionData;
  roof: WizardRoofState;
  panel_selection: PanelSelection;
  panel_technical_data: PanelTechnicalData;
  layout_config: LayoutTargetConfig;
  preliminary_layout: PreliminaryModuleLayout | null;
  photos: SurveyPhoto[];
  active_client_profile: ActiveClientProfileSnapshot | null;
  meta: SurveyMeta;
  updated_at: string | null;
};

export type WizardSummary = {
  customer_full_name: string;
  roof_type: RoofType | null;
  surfaces_count: number;
  obstacles_count: number;
  panel_selected: boolean;
  layout_modules_count: number;
  layout_total_power_w: number;
  photos_count: number;
  active_company_name: string | null;
};

export type WizardAction =
  | {
      type: "wizard/hydrate";
      state: WizardState;
    }
  | {
      type: "wizard/change_step";
      stepId: WizardStepId;
    }
  | {
      type: "wizard/reset";
    }
  | {
      type: "customer/update";
      customer: Partial<CustomerData>;
    }
  | {
      type: "inspection/update";
      inspection: Partial<InspectionData>;
    }
  | {
      type: "roof/set_type";
      roofType: RoofType;
    }
  | {
      type: "roof/set_custom_surface_count";
      count: number | null;
    }
  | {
      type: "surfaces/replace";
      surfaces: SurfaceData[];
    }
  | {
      type: "surface/update";
      surfaceId: string;
      surface: Partial<SurfaceData>;
    }
  | {
      type: "obstacle/add";
      surfaceId: string;
      obstacle: ObstacleData;
    }
  | {
      type: "obstacle/update";
      surfaceId: string;
      obstacleId: string;
      obstacle: Partial<ObstacleData>;
    }
  | {
      type: "obstacle/delete";
      surfaceId: string;
      obstacleId: string;
    }
  | {
      type: "panel/set";
      panel: PanelSelection;
      technicalData?: PanelTechnicalData;
    }
  | {
      type: "panel/set_technical_data";
      technicalData: PanelTechnicalData;
    }
  | {
      type: "layout/configure";
      config: LayoutTargetConfig;
    }
  | {
      type: "layout/set";
      layout: PreliminaryModuleLayout | null;
    }
  | {
      type: "photos/add";
      photos: SurveyPhoto[];
    }
  | {
      type: "photo/update";
      photoId: string;
      photo: Partial<SurveyPhoto>;
    }
  | {
      type: "photo/delete";
      photoId: string;
    }
  | {
      type: "profile/apply";
      profile: ActiveClientProfileSnapshot | null;
    };

export function createEmptyCustomerData(): CustomerData {
  return {
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    province: "",
  };
}

export function createEmptyInspectionData(): InspectionData {
  return {
    date: "",
    technician: "",
    notes: "",
  };
}

export function createEmptyPanelSelection(): PanelSelection {
  return {
    brand: "",
    model: "",
  };
}

export function createEmptyPanelTechnicalData(): PanelTechnicalData {
  return {
    width_cm: 0,
    height_cm: 0,
    power_w: 0,
    source: null,
  };
}

export function createDefaultLayoutTargetConfig(): LayoutTargetConfig {
  return {
    mode: "max_modules",
    target_module_count: null,
    target_power_w: null,
  };
}

export function createSurveyMeta(): SurveyMeta {
  return {
    source: "webapp_sopralluogo_fotovoltaico_v1",
    schema_version: "1.0",
  };
}

export function createSurveyId(): string {
  return `sopralluogo_${Date.now()}`;
}

export function createEmptyWizardState(): WizardState {
  return {
    survey_id: createSurveyId(),
    currentStepId: "cliente",
    completedStepIds: [],
    customer: createEmptyCustomerData(),
    inspection: createEmptyInspectionData(),
    roof: {
      roof_type: null,
      surfaces: [],
      custom_surface_count: null,
    },
    panel_selection: createEmptyPanelSelection(),
    panel_technical_data: createEmptyPanelTechnicalData(),
    layout_config: createDefaultLayoutTargetConfig(),
    preliminary_layout: null,
    photos: [],
    active_client_profile: null,
    meta: createSurveyMeta(),
    updated_at: null,
  };
}

export const INITIAL_WIZARD_STATE: WizardState = createEmptyWizardState();

export function aggiornaDatiCliente(
  state: WizardState,
  customer: Partial<CustomerData>,
): WizardState {
  return touchState({
    ...state,
    customer: {
      ...state.customer,
      ...customer,
    },
  });
}

export function aggiornaDatiSopralluogo(
  state: WizardState,
  inspection: Partial<InspectionData>,
): WizardState {
  return touchState({
    ...state,
    inspection: {
      ...state.inspection,
      ...inspection,
    },
  });
}

export function impostaTipoTetto(
  state: WizardState,
  roofType: RoofType,
): WizardState {
  return touchState({
    ...state,
    roof: {
      ...state.roof,
      roof_type: roofType,
      custom_surface_count:
        roofType === "piu_falde_personalizzato"
          ? state.roof.custom_surface_count
          : null,
    },
    preliminary_layout: null,
  });
}

export function impostaNumeroFaldePersonalizzato(
  state: WizardState,
  count: number | null,
): WizardState {
  return touchState({
    ...state,
    roof: {
      ...state.roof,
      custom_surface_count: count,
    },
    preliminary_layout: null,
  });
}

export function sostituisciFalde(
  state: WizardState,
  surfaces: SurfaceData[],
): WizardState {
  return touchState({
    ...state,
    roof: {
      ...state.roof,
      surfaces,
    },
    preliminary_layout: null,
  });
}

export function aggiornaFalda(
  state: WizardState,
  surfaceId: string,
  surface: Partial<SurfaceData>,
): WizardState {
  return touchState({
    ...state,
    roof: {
      ...state.roof,
      surfaces: state.roof.surfaces.map((currentSurface) =>
        currentSurface.surface_id === surfaceId
          ? ({ ...currentSurface, ...surface } as SurfaceData)
          : currentSurface,
      ),
    },
    preliminary_layout: null,
  });
}

export function aggiungiOstacolo(
  state: WizardState,
  surfaceId: string,
  obstacle: ObstacleData,
): WizardState {
  return touchState({
    ...state,
    roof: {
      ...state.roof,
      surfaces: state.roof.surfaces.map((surface) =>
        surface.surface_id === surfaceId
          ? {
              ...surface,
              obstacles: [...surface.obstacles, obstacle],
            }
          : surface,
      ) as SurfaceData[],
    },
    preliminary_layout: null,
  });
}

export function aggiornaOstacolo(
  state: WizardState,
  surfaceId: string,
  obstacleId: string,
  obstacle: Partial<ObstacleData>,
): WizardState {
  return touchState({
    ...state,
    roof: {
      ...state.roof,
      surfaces: state.roof.surfaces.map((surface) =>
        surface.surface_id === surfaceId
          ? {
              ...surface,
              obstacles: surface.obstacles.map((currentObstacle) =>
                currentObstacle.obstacle_id === obstacleId
                  ? ({ ...currentObstacle, ...obstacle } as ObstacleData)
                  : currentObstacle,
              ),
            }
          : surface,
      ) as SurfaceData[],
    },
    preliminary_layout: null,
  });
}

export function eliminaOstacolo(
  state: WizardState,
  surfaceId: string,
  obstacleId: string,
): WizardState {
  return touchState({
    ...state,
    roof: {
      ...state.roof,
      surfaces: state.roof.surfaces.map((surface) =>
        surface.surface_id === surfaceId
          ? {
              ...surface,
              obstacles: surface.obstacles.filter(
                (obstacle) => obstacle.obstacle_id !== obstacleId,
              ),
            }
          : surface,
      ) as SurfaceData[],
    },
    preliminary_layout: null,
  });
}

export function impostaPannello(
  state: WizardState,
  panel: PanelSelection,
  technicalData?: PanelTechnicalData,
): WizardState {
  return touchState({
    ...state,
    panel_selection: panel,
    panel_technical_data: technicalData ?? state.panel_technical_data,
    layout_config: aggiornaPotenzaTargetLayout(
      state.layout_config,
      technicalData ?? state.panel_technical_data,
    ),
    preliminary_layout: null,
  });
}

export function impostaDatiTecniciPannello(
  state: WizardState,
  technicalData: PanelTechnicalData,
): WizardState {
  return touchState({
    ...state,
    panel_technical_data: technicalData,
    layout_config: aggiornaPotenzaTargetLayout(state.layout_config, technicalData),
    preliminary_layout: null,
  });
}

export function configuraTargetLayout(
  state: WizardState,
  config: LayoutTargetConfig,
): WizardState {
  return touchState({
    ...state,
    layout_config: normalizeLayoutTargetConfig(
      config,
      state.panel_technical_data.power_w,
    ),
    preliminary_layout: null,
  });
}

export function impostaLayoutPreliminare(
  state: WizardState,
  layout: PreliminaryModuleLayout | null,
): WizardState {
  return touchState({
    ...state,
    preliminary_layout: layout,
  });
}

export function aggiungiFotoSopralluogo(
  state: WizardState,
  photos: SurveyPhoto[],
): WizardState {
  return touchState({
    ...state,
    photos: [...state.photos, ...photos],
  });
}

export function aggiornaFotoSopralluogo(
  state: WizardState,
  photoId: string,
  photo: Partial<SurveyPhoto>,
): WizardState {
  return touchState({
    ...state,
    photos: state.photos.map((currentPhoto) =>
      currentPhoto.photo_id === photoId
        ? { ...currentPhoto, ...photo }
        : currentPhoto,
    ),
  });
}

export function eliminaFotoSopralluogo(
  state: WizardState,
  photoId: string,
): WizardState {
  return touchState({
    ...state,
    photos: state.photos.filter((photo) => photo.photo_id !== photoId),
  });
}

export function applicaProfiloClienteAttivo(
  state: WizardState,
  profile: ActiveClientProfileSnapshot | null,
): WizardState {
  return touchState({
    ...state,
    active_client_profile: profile,
  });
}

export function cambiaStep(
  state: WizardState,
  stepId: WizardStepId,
): WizardState {
  const completedStepIds = addCompletedStep(
    state.completedStepIds,
    state.currentStepId,
  );

  return touchState({
    ...state,
    currentStepId: stepId,
    completedStepIds,
  });
}

export function resettaWizard(): WizardState {
  return createEmptyWizardState();
}

export function wizardReducer(
  state: WizardState,
  action: WizardAction,
): WizardState {
  switch (action.type) {
    case "wizard/hydrate":
      return action.state;
    case "wizard/change_step":
      return cambiaStep(state, action.stepId);
    case "wizard/reset":
      return resettaWizard();
    case "customer/update":
      return aggiornaDatiCliente(state, action.customer);
    case "inspection/update":
      return aggiornaDatiSopralluogo(state, action.inspection);
    case "roof/set_type":
      return impostaTipoTetto(state, action.roofType);
    case "roof/set_custom_surface_count":
      return impostaNumeroFaldePersonalizzato(state, action.count);
    case "surfaces/replace":
      return sostituisciFalde(state, action.surfaces);
    case "surface/update":
      return aggiornaFalda(state, action.surfaceId, action.surface);
    case "obstacle/add":
      return aggiungiOstacolo(state, action.surfaceId, action.obstacle);
    case "obstacle/update":
      return aggiornaOstacolo(
        state,
        action.surfaceId,
        action.obstacleId,
        action.obstacle,
      );
    case "obstacle/delete":
      return eliminaOstacolo(state, action.surfaceId, action.obstacleId);
    case "panel/set":
      return impostaPannello(state, action.panel, action.technicalData);
    case "panel/set_technical_data":
      return impostaDatiTecniciPannello(state, action.technicalData);
    case "layout/configure":
      return configuraTargetLayout(state, action.config);
    case "layout/set":
      return impostaLayoutPreliminare(state, action.layout);
    case "photos/add":
      return aggiungiFotoSopralluogo(state, action.photos);
    case "photo/update":
      return aggiornaFotoSopralluogo(state, action.photoId, action.photo);
    case "photo/delete":
      return eliminaFotoSopralluogo(state, action.photoId);
    case "profile/apply":
      return applicaProfiloClienteAttivo(state, action.profile);
    default:
      return state;
  }
}

export function getWizardSummary(state: WizardState): WizardSummary {
  return {
    customer_full_name: [state.customer.first_name, state.customer.last_name]
      .filter(Boolean)
      .join(" "),
    roof_type: state.roof.roof_type,
    surfaces_count: state.roof.surfaces.length,
    obstacles_count: state.roof.surfaces.reduce(
      (total, surface) => total + surface.obstacles.length,
      0,
    ),
    panel_selected: Boolean(
      state.panel_selection.brand && state.panel_selection.model,
    ),
    layout_modules_count: state.preliminary_layout?.total_modules ?? 0,
    layout_total_power_w: state.preliminary_layout?.total_power_w ?? 0,
    photos_count: state.photos.length,
    active_company_name: state.active_client_profile?.company_name || null,
  };
}

export function getNextWizardStepId(
  currentStepId: WizardStepId,
): WizardStepId | null {
  const currentIndex = WIZARD_STEP_IDS.indexOf(currentStepId);
  return WIZARD_STEP_IDS[currentIndex + 1] ?? null;
}

export function getPreviousWizardStepId(
  currentStepId: WizardStepId,
): WizardStepId | null {
  const currentIndex = WIZARD_STEP_IDS.indexOf(currentStepId);
  return WIZARD_STEP_IDS[currentIndex - 1] ?? null;
}

function touchState(state: WizardState): WizardState {
  return {
    ...state,
    updated_at: new Date().toISOString(),
  };
}

function aggiornaPotenzaTargetLayout(
  config: LayoutTargetConfig,
  panel: PanelTechnicalData,
): LayoutTargetConfig {
  return normalizeLayoutTargetConfig(config, panel.power_w);
}

function normalizeLayoutTargetConfig(
  config: LayoutTargetConfig,
  panelPowerW: number,
): LayoutTargetConfig {
  if (config.mode !== "target_power") {
    return createDefaultLayoutTargetConfig();
  }

  const targetModuleCount =
    config.target_module_count !== null &&
    Number.isFinite(config.target_module_count) &&
    config.target_module_count > 0
      ? Math.floor(config.target_module_count)
      : null;

  return {
    mode: "target_power",
    target_module_count: targetModuleCount,
    target_power_w:
      targetModuleCount !== null && panelPowerW > 0
        ? targetModuleCount * panelPowerW
        : null,
  };
}

function addCompletedStep(
  completedStepIds: WizardStepId[],
  stepId: WizardStepId,
): WizardStepId[] {
  if (completedStepIds.includes(stepId)) {
    return completedStepIds;
  }

  return [...completedStepIds, stepId];
}
