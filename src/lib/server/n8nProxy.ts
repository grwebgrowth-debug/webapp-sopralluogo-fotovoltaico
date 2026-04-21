import type {
  CatalogoPannelliLiveRequest,
  LiveApiErrorCode,
  CatalogoPannelliLiveResponse,
  RicezioneSopralluogoLiveRequest,
  RicezioneSopralluogoLiveResponse,
  UploadFotoLiveResponse,
} from "@/types/liveApi";
import type { InverterCatalogItem, PanelCatalogItem } from "@/types/panels";

const N8N_PROXY_TIMEOUT_MS = 15000;

type UploadFotoProxyInput = {
  slug_cliente: string;
  sopralluogo_id: string;
  ordine: string;
  tipo_foto: string;
  file: File;
  nota?: string;
  uploaded_by?: string;
  sha256_file?: string;
};

export class N8nProxyError extends Error {
  details?: Record<string, unknown>;
  errorCode: LiveApiErrorCode;
  status: number;

  constructor(
    message: string,
    status = 502,
    errorCode: LiveApiErrorCode = "upstream_error",
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "N8nProxyError";
    this.errorCode = errorCode;
    this.details = details;
    this.status = status;
  }
}

export async function proxyCatalogoPannelli(
  payload: CatalogoPannelliLiveRequest,
): Promise<CatalogoPannelliLiveResponse> {
  const response = await postJsonToN8n(
    readRequiredEnv("N8N_WF01_CATALOGO_WEBHOOK_URL"),
    payload,
  );

  return normalizeCatalogoResponse(response);
}

export async function proxyRicezioneSopralluogo(
  payload: RicezioneSopralluogoLiveRequest,
): Promise<RicezioneSopralluogoLiveResponse> {
  const response = await postJsonToN8n(
    readRequiredEnv("N8N_WF02_RICEZIONE_WEBHOOK_URL"),
    payload,
    payload.idempotency_key,
  );

  return normalizeRicezioneResponse(response);
}

export async function proxyUploadFoto(
  payload: UploadFotoProxyInput,
): Promise<UploadFotoLiveResponse> {
  const formData = new FormData();

  formData.set("slug_cliente", payload.slug_cliente);
  formData.set("sopralluogo_id", payload.sopralluogo_id);
  formData.set("ordine", payload.ordine);
  formData.set("tipo_foto", payload.tipo_foto);
  formData.set("file", payload.file, payload.file.name);

  if (payload.nota) {
    formData.set("nota", payload.nota);
  }

  if (payload.uploaded_by) {
    formData.set("uploaded_by", payload.uploaded_by);
  }

  if (payload.sha256_file) {
    formData.set("sha256_file", payload.sha256_file);
  }

  const response = await postFormDataToN8n(
    readRequiredEnv("N8N_WF03_UPLOAD_FOTO_WEBHOOK_URL"),
    formData,
  );

  return normalizeUploadFotoResponse(response);
}

async function postJsonToN8n(
  url: string,
  payload: unknown,
  idempotencyKey?: string,
): Promise<unknown> {
  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : {}),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(N8N_PROXY_TIMEOUT_MS),
    });
  } catch (error) {
    throw normalizeFetchError(error);
  }

  return parseN8nResponse(response);
}

async function postFormDataToN8n(
  url: string,
  formData: FormData,
): Promise<unknown> {
  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      body: formData,
      cache: "no-store",
      signal: AbortSignal.timeout(N8N_PROXY_TIMEOUT_MS),
    });
  } catch (error) {
    throw normalizeFetchError(error);
  }

  return parseN8nResponse(response);
}

async function parseN8nResponse(response: Response): Promise<unknown> {
  const rawText = await response.text();
  const data = tryParseJson(rawText);

  if (!response.ok) {
    throw new N8nProxyError(
      extractErrorMessage(data, rawText),
      mapUpstreamStatus(response.status),
      mapUpstreamErrorCode(response.status),
    );
  }

  return data ?? rawText;
}

function normalizeCatalogoResponse(value: unknown): CatalogoPannelliLiveResponse {
  if (Array.isArray(value)) {
    return {
      panel_catalog: value.filter(isPanelCatalogItem),
      inverter_options: [],
    };
  }

  const container = extractPrimaryRecord(value);

  if (!container || !hasKnownPayloadFields(container)) {
    throw new N8nProxyError(
      "WF-01 ha restituito una risposta non valida.",
      502,
      "upstream_invalid_response",
    );
  }

  const panelCatalog = Array.isArray(container.panel_catalog)
    ? container.panel_catalog.filter(isPanelCatalogItem)
    : Array.isArray(container.items)
      ? container.items.filter(isPanelCatalogItem)
      : Array.isArray(container.data)
        ? container.data.filter(isPanelCatalogItem)
      : [];
  const inverterOptions = Array.isArray(container.inverter_options)
    ? container.inverter_options.filter(isInverterCatalogItem)
    : [];

  return {
    panel_catalog: panelCatalog,
    inverter_options: inverterOptions,
  };
}

function normalizeRicezioneResponse(
  value: unknown,
): RicezioneSopralluogoLiveResponse {
  const container = extractPrimaryRecord(value);

  if (!container) {
    throw new N8nProxyError(
      "WF-02 ha restituito una risposta non valida.",
      502,
      "upstream_invalid_response",
    );
  }

  const idSopralluogo = readFirstString(container, [
    "id_sopralluogo",
    "sopralluogo_id",
    "id",
  ]);

  if (!idSopralluogo) {
    throw new N8nProxyError(
      "WF-02 non ha restituito l'id del sopralluogo.",
      502,
      "upstream_invalid_response",
    );
  }

  return {
    id_sopralluogo: idSopralluogo,
    message:
      readFirstString(container, ["message", "messaggio", "status_message"]) ??
      "Sopralluogo ricevuto correttamente.",
    status: readFirstString(container, ["status", "stato", "esito"]),
  };
}

function normalizeUploadFotoResponse(value: unknown): UploadFotoLiveResponse {
  const container = extractPrimaryRecord(value);

  if (!container) {
    return {
      message: "Foto caricata correttamente.",
    };
  }

  return {
    foto_id: readFirstString(container, ["foto_id", "id_foto", "id"]),
    message:
      readFirstString(container, ["message", "messaggio", "status_message"]) ??
      "Foto caricata correttamente.",
    ordine: readOptionalNumber(container, "ordine"),
    tipo_foto: readFirstString(container, ["tipo_foto", "tipo"]),
  };
}

function readRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new N8nProxyError(
      `Variabile ambiente mancante: ${name}`,
      500,
      "not_configured",
      { env: name },
    );
  }

  return value;
}

function extractErrorMessage(data: unknown, rawText: string): string {
  const container = extractPrimaryRecord(data);

  if (container) {
    return (
      readFirstString(container, ["error", "message", "messaggio"]) ??
      "Errore restituito da n8n."
    );
  }

  return rawText || "Errore restituito da n8n.";
}

function tryParseJson(value: string): unknown {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function extractPrimaryRecord(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value)) {
    return null;
  }

  if (hasKnownPayloadFields(value)) {
    return value;
  }

  for (const field of ["data", "result", "output", "payload"]) {
    if (isRecord(value[field])) {
      const nested = value[field] as Record<string, unknown>;

      if (hasKnownPayloadFields(nested)) {
        return nested;
      }
    }
  }

  return value;
}

function hasKnownPayloadFields(value: Record<string, unknown>): boolean {
  return (
    Array.isArray(value.panel_catalog) ||
    Array.isArray(value.items) ||
    Array.isArray(value.inverter_options) ||
    typeof value.id_sopralluogo === "string" ||
    typeof value.sopralluogo_id === "string" ||
    typeof value.status === "string" ||
    typeof value.stato === "string" ||
    typeof value.foto_id === "string" ||
    typeof value.id_foto === "string" ||
    typeof value.message === "string" ||
    typeof value.messaggio === "string"
  );
}

function isPanelCatalogItem(value: unknown): value is PanelCatalogItem {
  return (
    isRecord(value) &&
    typeof value.brand === "string" &&
    typeof value.model === "string" &&
    typeof value.width_cm === "number" &&
    typeof value.height_cm === "number" &&
    typeof value.power_w === "number" &&
    typeof value.active === "boolean" &&
    typeof value.allowed_orientation === "string" &&
    typeof value.notes === "string"
  );
}

function isInverterCatalogItem(value: unknown): value is InverterCatalogItem {
  return (
    isRecord(value) &&
    typeof value.componente_id === "string" &&
    typeof value.descrizione === "string" &&
    (typeof value.potenza_nominale_kw === "number" ||
      value.potenza_nominale_kw === null ||
      value.potenza_nominale_kw === undefined)
  );
}

function readFirstString(
  value: Record<string, unknown>,
  fields: string[],
): string | undefined {
  for (const field of fields) {
    if (typeof value[field] === "string" && value[field].trim().length > 0) {
      return value[field];
    }
  }

  return undefined;
}

function readOptionalNumber(
  value: Record<string, unknown>,
  field: string,
): number | undefined {
  if (typeof value[field] === "number") {
    return value[field];
  }

  if (typeof value[field] === "string") {
    const parsedValue = Number(value[field]);
    return Number.isFinite(parsedValue) ? parsedValue : undefined;
  }

  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeFetchError(error: unknown): N8nProxyError {
  if (error instanceof N8nProxyError) {
    return error;
  }

  if (
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  ) {
    return new N8nProxyError(
      "Timeout durante la chiamata a n8n.",
      504,
      "upstream_timeout",
    );
  }

  return new N8nProxyError(
    error instanceof Error && error.message
      ? error.message
      : "Errore di rete verso n8n.",
    502,
    "upstream_error",
  );
}

function mapUpstreamStatus(status: number): number {
  if (status === 408 || status === 504) {
    return 504;
  }

  return 502;
}

function mapUpstreamErrorCode(status: number): LiveApiErrorCode {
  if (status === 408 || status === 504) {
    return "upstream_timeout";
  }

  return "upstream_error";
}
