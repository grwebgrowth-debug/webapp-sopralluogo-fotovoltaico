import type {
  N8nSurveyPayload,
  SopralluogoData,
} from "@/types/survey";
import type { WizardState } from "./wizardState";

export type PayloadBuildResult =
  | {
      ok: true;
      payload: N8nSurveyPayload;
      sopralluogo: SopralluogoData;
    }
  | {
      ok: false;
      errors: string[];
    };

export function costruisciPayloadN8nV1(
  state: WizardState,
): PayloadBuildResult {
  const errors = getPayloadErrors(state);

  if (errors.length > 0 || state.roof.roof_type === null) {
    return {
      ok: false,
      errors,
    };
  }

  const payload: N8nSurveyPayload = {
    survey: {
      customer: state.customer,
      inspection: state.inspection,
    },
    roof: {
      roof_type: state.roof.roof_type,
      surfaces: state.roof.surfaces,
    },
    panel_selection: state.panel_selection,
    meta: state.meta,
  };

  return {
    ok: true,
    payload,
    sopralluogo: {
      id: state.survey_id,
      customer: state.customer,
      inspection: state.inspection,
      roof: payload.roof,
      panel_selection: state.panel_selection,
      meta: state.meta,
    },
  };
}

export function getPayloadErrors(state: WizardState): string[] {
  const errors: string[] = [];

  if (!state.customer.first_name.trim()) {
    errors.push("Nome cliente mancante.");
  }

  if (!state.customer.last_name.trim()) {
    errors.push("Cognome cliente mancante.");
  }

  if (!state.customer.address.trim()) {
    errors.push("Indirizzo del sopralluogo mancante.");
  }

  if (!state.inspection.date.trim()) {
    errors.push("Data sopralluogo mancante.");
  }

  if (state.roof.roof_type === null) {
    errors.push("Tipo di tetto mancante.");
  }

  if (!state.panel_selection.brand.trim()) {
    errors.push("Marca pannello mancante.");
  }

  if (!state.panel_selection.model.trim()) {
    errors.push("Modello pannello mancante.");
  }

  return errors;
}
