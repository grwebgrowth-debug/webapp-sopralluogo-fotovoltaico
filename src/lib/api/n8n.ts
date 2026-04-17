import type { PanelCatalogItem } from "@/types/panels";
import type { N8nSurveyPayload } from "@/types/survey";

export type ApiResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
      reason: "not_configured" | "network_error" | "invalid_response";
    };

export type N8nRequestOptions = {
  endpointUrl?: string;
};

export type SubmitSurveyResult = {
  id_sopralluogo?: string;
  message: string;
};

export async function recuperaCatalogoPannelliDaN8n(
  options: N8nRequestOptions = {},
): Promise<ApiResult<PanelCatalogItem[]>> {
  if (!options.endpointUrl) {
    return {
      ok: false,
      reason: "not_configured",
      error:
        "Endpoint n8n per il catalogo pannelli non configurato. Puoi inserire marca e modello manualmente.",
    };
  }

  try {
    const response = await fetch(options.endpointUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return {
        ok: false,
        reason: "network_error",
        error: "n8n non ha restituito il catalogo pannelli.",
      };
    }

    const data = (await response.json()) as unknown;

    if (!Array.isArray(data)) {
      return {
        ok: false,
        reason: "invalid_response",
        error: "Risposta catalogo pannelli non valida.",
      };
    }

    return {
      ok: true,
      data: data.filter(isPanelCatalogItem),
    };
  } catch {
    return {
      ok: false,
      reason: "network_error",
      error: "Errore durante il recupero del catalogo pannelli da n8n.",
    };
  }
}

export async function inviaSopralluogoAN8n(
  payload: N8nSurveyPayload,
  options: N8nRequestOptions = {},
): Promise<ApiResult<SubmitSurveyResult>> {
  if (!options.endpointUrl) {
    return {
      ok: false,
      reason: "not_configured",
      error:
        "Endpoint n8n per l’invio finale non configurato. Il payload è pronto ma non è stato inviato.",
    };
  }

  try {
    const response = await fetch(options.endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return {
        ok: false,
        reason: "network_error",
        error: "n8n non ha confermato l’invio del sopralluogo.",
      };
    }

    const data = (await response.json()) as Partial<SubmitSurveyResult>;

    return {
      ok: true,
      data: {
        id_sopralluogo: data.id_sopralluogo,
        message: data.message ?? "Sopralluogo inviato a n8n.",
      },
    };
  } catch {
    return {
      ok: false,
      reason: "network_error",
      error: "Errore durante l’invio del sopralluogo a n8n.",
    };
  }
}

function isPanelCatalogItem(value: unknown): value is PanelCatalogItem {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.brand === "string" &&
    typeof item.model === "string" &&
    typeof item.width_cm === "number" &&
    typeof item.height_cm === "number" &&
    typeof item.power_w === "number" &&
    typeof item.active === "boolean" &&
    typeof item.allowed_orientation === "string" &&
    typeof item.notes === "string"
  );
}
