import type { PanelCatalogItem } from "@/types/panels";
import type { ActiveClientProfileSnapshot } from "@/types/profiles";
import type { N8nSurveyPayload } from "@/types/survey";
import {
  inviaSopralluogoAN8n,
  recuperaCatalogoPannelliDaN8n,
  type ApiResult,
} from "@/lib/api/n8n";
import { resolveRuntimeMode } from "@/lib/runtimeMode";
import {
  createDemoQuoteId,
  createDemoSurveyId,
  DEMO_PANEL_CATALOG,
} from "./demoFixtures";

export type { ApiResult } from "@/lib/api/n8n";

export type ServiceOptions = {
  profile: ActiveClientProfileSnapshot | null;
};

export type QuoteResult = {
  preventivo_id: string;
  message: string;
};

export type SaveSurveyResult = {
  id_sopralluogo?: string;
  preventivo_id?: string;
  message: string;
};

export async function getCatalogoPannelli(
  options: ServiceOptions,
): Promise<ApiResult<PanelCatalogItem[]>> {
  if (resolveRuntimeMode(options.profile) === "demo") {
    return {
      ok: true,
      data: DEMO_PANEL_CATALOG,
    };
  }

  return recuperaCatalogoPannelliDaN8n({
    endpointUrl: options.profile?.panel_catalog_endpoint,
  });
}

export async function salvaSopralluogo(
  payload: N8nSurveyPayload,
  options: ServiceOptions,
): Promise<ApiResult<SaveSurveyResult>> {
  if (resolveRuntimeMode(options.profile) === "demo") {
    const quoteResult = await generaPreventivo(payload, options);

    if (!quoteResult.ok) {
      return quoteResult;
    }

    return {
      ok: true,
      data: {
        id_sopralluogo: createDemoSurveyId(payload),
        preventivo_id: quoteResult.data.preventivo_id,
        message:
          "Demo completata. Sopralluogo demo registrato correttamente e preventivo pronto per l'elaborazione.",
      },
    };
  }

  return inviaSopralluogoAN8n(payload, {
    endpointUrl: options.profile?.survey_submit_endpoint,
  });
}

export async function generaPreventivo(
  payload: N8nSurveyPayload,
  options: ServiceOptions,
): Promise<ApiResult<QuoteResult>> {
  if (resolveRuntimeMode(options.profile) === "demo") {
    return {
      ok: true,
      data: {
        preventivo_id: createDemoQuoteId(payload),
        message: "Preventivo demo pronto per l'elaborazione.",
      },
    };
  }

  return {
    ok: false,
    reason: "not_configured",
    error:
      "La generazione del preventivo live sara collegata al workflow dedicato.",
  };
}

export async function uploadFoto(): Promise<ApiResult<{ message: string }>> {
  return {
    ok: false,
    reason: "not_configured",
    error: "Le foto restano disponibili nella sessione corrente.",
  };
}
