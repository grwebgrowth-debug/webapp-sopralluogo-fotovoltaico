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

  const surveyFalde = state.roof.surfaces.map((surface) => ({
    ...surface,
    copertura: surface.coverage,
  }));
  const surveyPannelloSelezionato = {
    panel_id: state.panel_selection.panel_id,
    item_code: state.panel_selection.item_code,
    brand: state.panel_selection.brand,
    model: state.panel_selection.model,
    power_w:
      state.panel_selection.power_w ?? state.panel_technical_data.power_w,
    width_cm:
      state.panel_selection.width_cm ?? state.panel_technical_data.width_cm,
    height_cm:
      state.panel_selection.height_cm ?? state.panel_technical_data.height_cm,
  };

  const payload: N8nSurveyPayload = {
    survey: {
      customer: state.customer,
      inspection: state.inspection,
      falde: surveyFalde,
      pannello_selezionato: surveyPannelloSelezionato,
      componenti_impianto: {
        inverter: state.system_components.inverter,
        lunghezza_cavi_m: state.system_components.cable_length_m,
        note_tecniche: state.system_components.technical_notes,
      },
    },
    roof: {
      roof_type: state.roof.roof_type,
      surfaces: state.roof.surfaces,
    },
    panel_selection: state.panel_selection,
    system_components: state.system_components,
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
      system_components: state.system_components,
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

  if (state.system_components.inverter === null) {
    errors.push("Inverter mancante.");
  }

  return errors;
}
