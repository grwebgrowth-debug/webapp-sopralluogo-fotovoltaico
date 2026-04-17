import type { RoofType, WizardStepId } from "@/types/domain";
import { WIZARD_STEP_IDS } from "@/types/domain";
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
};

export type WizardState = {
  survey_id: string;
  currentStepId: WizardStepId;
  completedStepIds: WizardStepId[];
  customer: CustomerData;
  inspection: InspectionData;
  roof: WizardRoofState;
  panel_selection: PanelSelection;
  meta: SurveyMeta;
  updated_at: string | null;
};

export type WizardSummary = {
  customer_full_name: string;
  roof_type: RoofType | null;
  surfaces_count: number;
  obstacles_count: number;
  panel_selected: boolean;
};

export type WizardAction =
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
    },
    panel_selection: createEmptyPanelSelection(),
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
    },
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
  });
}

export function impostaPannello(
  state: WizardState,
  panel: PanelSelection,
): WizardState {
  return touchState({
    ...state,
    panel_selection: panel,
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
      return impostaPannello(state, action.panel);
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

function addCompletedStep(
  completedStepIds: WizardStepId[],
  stepId: WizardStepId,
): WizardStepId[] {
  if (completedStepIds.includes(stepId)) {
    return completedStepIds;
  }

  return [...completedStepIds, stepId];
}
