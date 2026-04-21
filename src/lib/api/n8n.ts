import type {
  CatalogoPannelliLiveRequest,
  LiveApiErrorCode,
  LiveApiFailure,
  LiveApiResponse,
  CatalogoPannelliLiveResponse,
  RicezioneSopralluogoLiveRequest,
  RicezioneSopralluogoLiveResponse,
  UploadFotoLiveResponse,
} from "@/types/liveApi";
import type {
  CatalogoConfigurazioneItem,
  InverterCatalogItem,
  PanelCatalogItem,
} from "@/types/panels";
import type { SurveyPhoto } from "@/types/photos";
import type { N8nSurveyPayload } from "@/types/survey";

export type ApiResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
      reason:
        | "not_configured"
        | "network_error"
        | "invalid_request"
        | "invalid_response";
    };

type ApiFailureReason = Extract<ApiResult<never>, { ok: false }>["reason"];

export type N8nRequestOptions = {
  slugCliente?: string;
  surveyId?: string;
  photos?: SurveyPhoto[];
  uploadedBy?: string;
  filters?: Omit<CatalogoPannelliLiveRequest, "slug_cliente">;
};

export type SubmitSurveyResult = {
  id_sopralluogo?: string;
  message: string;
  uploaded_photo_count?: number;
};

class LiveApiClientError extends Error {
  details?: Record<string, unknown>;
  errorCode: LiveApiErrorCode;

  constructor(
    message: string,
    errorCode: LiveApiErrorCode,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "LiveApiClientError";
    this.errorCode = errorCode;
    this.details = details;
  }
}

export async function recuperaCatalogoPannelliDaN8n(
  options: N8nRequestOptions = {},
): Promise<ApiResult<PanelCatalogItem[]>> {
  const response = await recuperaCatalogoConfigurazioneDaN8n(options);

  if (!response.ok) {
    return response;
  }

  return {
    ok: true,
    data: response.data.panel_catalog,
  };
}

export async function recuperaOpzioniInverterDaN8n(
  options: N8nRequestOptions = {},
): Promise<ApiResult<InverterCatalogItem[]>> {
  const response = await recuperaCatalogoConfigurazioneDaN8n(options);

  if (!response.ok) {
    return response;
  }

  return {
    ok: true,
    data: ensureAltroInverterOption(response.data.inverter_options),
  };
}

export async function recuperaCatalogoConfigurazioneDaN8n(
  options: N8nRequestOptions = {},
): Promise<ApiResult<CatalogoConfigurazioneItem>> {
  if (!options.slugCliente) {
    return {
      ok: false,
      reason: "not_configured",
      error: "Slug cliente non configurato per il recupero del catalogo live.",
    };
  }

  try {
    const data = await postJson<CatalogoPannelliLiveResponse>(
      "/api/live/catalogo-pannelli",
      {
        slug_cliente: options.slugCliente,
        ...options.filters,
      },
    );

    return {
      ok: true,
      data: {
        panel_catalog: Array.isArray(data.panel_catalog) ? data.panel_catalog : [],
        inverter_options: Array.isArray(data.inverter_options)
          ? data.inverter_options
          : [],
      },
    };
  } catch (error) {
    return toApiFailure(error, "Errore durante il recupero del catalogo live.");
  }
}

export async function inviaSopralluogoAN8n(
  payload: N8nSurveyPayload,
  options: N8nRequestOptions = {},
): Promise<ApiResult<SubmitSurveyResult>> {
  if (!options.slugCliente) {
    return {
      ok: false,
      reason: "not_configured",
      error: "Slug cliente non configurato per l'invio live.",
    };
  }

  if (!options.surveyId) {
    return {
      ok: false,
      reason: "invalid_request",
      error: "Identificativo sopralluogo mancante per l'invio live.",
    };
  }

  try {
    const ricezioneBody: RicezioneSopralluogoLiveRequest = {
      slug_cliente: options.slugCliente,
      idempotency_key: `${options.slugCliente}:${options.surveyId}`,
      schema_version: payload.meta.schema_version,
      source_app: payload.meta.source,
      foto_expected_count: options.photos?.length ?? 0,
      survey: payload.survey,
      payload_full: payload,
    };
    const data = await postJson<RicezioneSopralluogoLiveResponse>(
      "/api/live/ricezione-sopralluogo",
      ricezioneBody,
    );

    let uploadedPhotoCount = 0;

    if (options.photos && options.photos.length > 0) {
      const uploadResult = await uploadFotoAN8n(data.id_sopralluogo, options);

      if (!uploadResult.ok) {
        return uploadResult;
      }

      uploadedPhotoCount = uploadResult.data.uploaded_photo_count;
    }

    return {
      ok: true,
      data: {
        id_sopralluogo: data.id_sopralluogo,
        uploaded_photo_count: uploadedPhotoCount,
        message:
          uploadedPhotoCount > 0
            ? `${data.message} Foto caricate: ${uploadedPhotoCount}.`
            : data.message,
      },
    };
  } catch (error) {
    return toApiFailure(error, "Errore durante l'invio live del sopralluogo.");
  }
}

export async function uploadFotoAN8n(
  sopralluogoId: string,
  options: N8nRequestOptions = {},
): Promise<ApiResult<{ message: string; uploaded_photo_count: number }>> {
  if (!options.slugCliente) {
    return {
      ok: false,
      reason: "not_configured",
      error: "Slug cliente non configurato per l'upload foto.",
    };
  }

  const photos = options.photos ?? [];
  const missingFiles = photos.filter((photo) => !photo.raw_file);

  if (missingFiles.length > 0) {
    return {
      ok: false,
      reason: "invalid_request",
      error:
        "Una o piu foto non sono piu disponibili per l'upload. Riapri lo step Foto e reinseriscile.",
    };
  }

  try {
    for (const [index, photo] of photos.entries()) {
      const formData = new FormData();
      formData.set("slug_cliente", options.slugCliente);
      formData.set("sopralluogo_id", sopralluogoId);
      formData.set("ordine", String(index + 1));
      formData.set("tipo_foto", photo.type);
      formData.set("file", photo.raw_file as File, photo.file_name);

      if (photo.note.trim()) {
        formData.set("nota", photo.note.trim());
      }

      if (options.uploadedBy?.trim()) {
        formData.set("uploaded_by", options.uploadedBy.trim());
      }

      try {
        await postFormData<UploadFotoLiveResponse>("/api/live/upload-foto", formData);
      } catch (error) {
        throw new Error(
          `Upload foto interrotto alla foto ${index + 1} di ${photos.length}: ${getErrorMessage(
            error,
            "errore upload.",
          )}`,
        );
      }
    }

    return {
      ok: true,
      data: {
        uploaded_photo_count: photos.length,
        message:
          photos.length > 0
            ? "Upload foto completato."
            : "Nessuna foto da caricare.",
      },
    };
  } catch (error) {
    return toApiFailure(error, "Errore durante l'upload live delle foto.");
  }
}

async function postJson<TResponse>(
  url: string,
  body: unknown,
): Promise<TResponse> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  return parseResponse<TResponse>(response);
}

async function postFormData<TResponse>(
  url: string,
  body: FormData,
): Promise<TResponse> {
  const response = await fetch(url, {
    method: "POST",
    body,
  });

  return parseResponse<TResponse>(response);
}

async function parseResponse<TResponse>(response: Response): Promise<TResponse> {
  const raw = (await response.json().catch(() => null)) as
    | LiveApiResponse<TResponse>
    | Record<string, unknown>
    | null;

  if (isLiveApiFailure(raw)) {
    throw new LiveApiClientError(raw.message, raw.error_code, raw.details);
  }

  if (isLiveApiSuccess(raw)) {
    return raw.data as TResponse;
  }

  if (!response.ok) {
    throw new LiveApiClientError(
      typeof raw?.message === "string"
        ? raw.message
        : "Errore risposta API live.",
      "server_error",
    );
  }

  return raw as TResponse;
}

function ensureAltroInverterOption(
  items: InverterCatalogItem[],
): InverterCatalogItem[] {
  if (items.some((item) => item.componente_id === "altro")) {
    return items;
  }

  return [
    ...items,
    {
      componente_id: "altro",
      descrizione: "Altro",
      potenza_nominale_kw: null,
    },
  ];
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function toApiFailure<T>(
  error: unknown,
  fallback: string,
): ApiResult<T> {
  if (error instanceof LiveApiClientError) {
    return {
      ok: false,
      reason: mapLiveApiErrorCodeToReason(error.errorCode),
      error: error.message || fallback,
    };
  }

  return {
    ok: false,
    reason: "network_error",
    error: getErrorMessage(error, fallback),
  };
}

function mapLiveApiErrorCodeToReason(
  errorCode: LiveApiErrorCode,
): ApiFailureReason {
  if (errorCode === "invalid_request") {
    return "invalid_request";
  }

  if (errorCode === "not_configured") {
    return "not_configured";
  }

  if (errorCode === "upstream_invalid_response") {
    return "invalid_response";
  }

  return "network_error";
}

function isLiveApiSuccess<T>(
  value: unknown,
): value is { ok: true; data: T } {
  return (
    typeof value === "object" &&
    value !== null &&
    "ok" in value &&
    (value as { ok?: unknown }).ok === true &&
    "data" in value
  );
}

function isLiveApiFailure(value: unknown): value is LiveApiFailure {
  return (
    typeof value === "object" &&
    value !== null &&
    "ok" in value &&
    (value as { ok?: unknown }).ok === false &&
    typeof (value as { message?: unknown }).message === "string" &&
    typeof (value as { error_code?: unknown }).error_code === "string"
  );
}
