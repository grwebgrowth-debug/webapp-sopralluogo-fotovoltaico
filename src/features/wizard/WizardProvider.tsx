"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import type { RoofType, WizardStepId } from "@/types/domain";
import type { PreliminaryModuleLayout } from "@/types/layout";
import type { PanelTechnicalData } from "@/types/panels";
import type {
  CustomerData,
  InspectionData,
  ObstacleData,
  PanelSelection,
  SurfaceData,
} from "@/types/survey";
import {
  clearPersistedWizardState,
  loadPersistedWizardState,
  savePersistedWizardState,
} from "./wizardPersistence";
import { costruisciPayloadN8nV1 } from "./wizardPayload";
import {
  createEmptyWizardState,
  getNextWizardStepId,
  getPreviousWizardStepId,
  getWizardSummary,
  wizardReducer,
  type WizardState,
  type WizardSummary,
} from "./wizardState";

type WizardActions = {
  aggiornaDatiCliente: (customer: Partial<CustomerData>) => void;
  aggiornaDatiSopralluogo: (inspection: Partial<InspectionData>) => void;
  impostaTipoTetto: (roofType: RoofType) => void;
  impostaNumeroFaldePersonalizzato: (count: number | null) => void;
  sostituisciFalde: (surfaces: SurfaceData[]) => void;
  aggiornaFalda: (surfaceId: string, surface: Partial<SurfaceData>) => void;
  aggiungiOstacolo: (surfaceId: string, obstacle: ObstacleData) => void;
  aggiornaOstacolo: (
    surfaceId: string,
    obstacleId: string,
    obstacle: Partial<ObstacleData>,
  ) => void;
  eliminaOstacolo: (surfaceId: string, obstacleId: string) => void;
  impostaPannello: (
    panel: PanelSelection,
    technicalData?: PanelTechnicalData,
  ) => void;
  impostaDatiTecniciPannello: (technicalData: PanelTechnicalData) => void;
  impostaLayoutPreliminare: (layout: PreliminaryModuleLayout | null) => void;
  cambiaStep: (stepId: WizardStepId) => void;
  vaiAvanti: () => void;
  vaiIndietro: () => void;
  resettaWizard: () => void;
};

type WizardContextValue = {
  state: WizardState;
  summary: WizardSummary;
  payloadResult: ReturnType<typeof costruisciPayloadN8nV1>;
  actions: WizardActions;
};

export const WizardContext = createContext<WizardContextValue | null>(null);

type WizardProviderProps = {
  children: ReactNode;
};

export function WizardProvider({ children }: WizardProviderProps) {
  const [hydrated, setHydrated] = useState(false);
  const [state, dispatch] = useReducer(wizardReducer, undefined, () =>
    createEmptyWizardState(),
  );

  useEffect(() => {
    const persistedState = loadPersistedWizardState();

    if (persistedState) {
      dispatch({ type: "wizard/hydrate", state: persistedState });
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      savePersistedWizardState(state);
    }
  }, [hydrated, state]);

  const actions = useMemo<WizardActions>(
    () => ({
      aggiornaDatiCliente: (customer) =>
        dispatch({ type: "customer/update", customer }),
      aggiornaDatiSopralluogo: (inspection) =>
        dispatch({ type: "inspection/update", inspection }),
      impostaTipoTetto: (roofType) =>
        dispatch({ type: "roof/set_type", roofType }),
      impostaNumeroFaldePersonalizzato: (count) =>
        dispatch({ type: "roof/set_custom_surface_count", count }),
      sostituisciFalde: (surfaces) =>
        dispatch({ type: "surfaces/replace", surfaces }),
      aggiornaFalda: (surfaceId, surface) =>
        dispatch({ type: "surface/update", surfaceId, surface }),
      aggiungiOstacolo: (surfaceId, obstacle) =>
        dispatch({ type: "obstacle/add", surfaceId, obstacle }),
      aggiornaOstacolo: (surfaceId, obstacleId, obstacle) =>
        dispatch({
          type: "obstacle/update",
          surfaceId,
          obstacleId,
          obstacle,
        }),
      eliminaOstacolo: (surfaceId, obstacleId) =>
        dispatch({ type: "obstacle/delete", surfaceId, obstacleId }),
      impostaPannello: (panel, technicalData) =>
        dispatch({ type: "panel/set", panel, technicalData }),
      impostaDatiTecniciPannello: (technicalData) =>
        dispatch({ type: "panel/set_technical_data", technicalData }),
      impostaLayoutPreliminare: (layout) =>
        dispatch({ type: "layout/set", layout }),
      cambiaStep: (stepId) => dispatch({ type: "wizard/change_step", stepId }),
      vaiAvanti: () => {
        const nextStepId = getNextWizardStepId(state.currentStepId);
        if (nextStepId) {
          dispatch({ type: "wizard/change_step", stepId: nextStepId });
        }
      },
      vaiIndietro: () => {
        const previousStepId = getPreviousWizardStepId(state.currentStepId);
        if (previousStepId) {
          dispatch({ type: "wizard/change_step", stepId: previousStepId });
        }
      },
      resettaWizard: () => {
        clearPersistedWizardState();
        dispatch({ type: "wizard/reset" });
      },
    }),
    [state.currentStepId],
  );

  const value = useMemo<WizardContextValue>(
    () => ({
      state,
      summary: getWizardSummary(state),
      payloadResult: costruisciPayloadN8nV1(state),
      actions,
    }),
    [actions, state],
  );

  return (
    <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);

  if (!context) {
    throw new Error("useWizard deve essere usato dentro WizardProvider.");
  }

  return context;
}
