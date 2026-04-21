import type {
  CatalogoPannelliLiveRequest,
  LiveApiErrorCode,
  CatalogoPannelliLiveResponse,
  RicezioneSopralluogoLiveRequest,
  RicezioneSopralluogoLiveResponse,
  UploadFotoLiveResponse,
} from "@/types/liveApi";
import type { InverterCatalogItem, PanelCatalogItem } from "@/types/panels";
import { getN8nServerConfig } from "./n8nConfig";
import { N8nProxyError } from "./n8nErrors";

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

export async function proxyCatalogoPannelli(
  payload: CatalogoPannelliLiveRequest,
): Promise<CatalogoPannelliLiveResponse> {
  const config = getN8nServerConfig("catalogo_pannelli");
  const upstreamUrl = buildCatalogoPannelliUrl(config.workflowUrl, payload);
  const response = await getJsonFromN8n(
    upstreamUrl,
    config.webappSecret,
    "WF-01",
  );

  return normalizeCatalogoResponse(response);
}

export async function proxyRicezioneSopralluogo(
  payload: RicezioneSopralluogoLiveRequest,
): Promise<RicezioneSopralluogoLiveResponse> {
  const config = getN8nServerConfig("ricezione_sopralluogo");
  const response = await postJsonToN8n(
    config.workflowUrl,
    config.webappSecret,
    payload,
    "WF-02",
    payload.idempotency_key,
  );

  return normalizeRicezioneResponse(response);
}

export async function proxyUploadFoto(
  payload: UploadFotoProxyInput,
): Promise<UploadFotoLiveResponse> {
  const config = getN8nServerConfig("upload_foto");
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
    config.workflowUrl,
    config.webappSecret,
    "WF-03",
    formData,
  );

  return normalizeUploadFotoResponse(response);
}

async function postJsonToN8n(
  url: string,
  webappSecret: string,
  payload: unknown,
  workflowLabel: string,
  idempotencyKey?: string,
): Promise<unknown> {
  let response: Response;

  logUpstreamRequest(workflowLabel, "POST", url, webappSecret);

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-WEBAPP-SECRET": webappSecret,
        ...(idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : {}),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(N8N_PROXY_TIMEOUT_MS),
    });
  } catch (error) {
    logFetchFailedBeforeRequest(workflowLabel, "POST", url, webappSecret, error);
    throw normalizeFetchError(error);
  }

  logUpstreamResponse(workflowLabel, "POST", url, webappSecret, response.status);
  return parseN8nResponse(response);
}

async function getJsonFromN8n(
  url: string,
  webappSecret: string,
  workflowLabel: string,
): Promise<unknown> {
  let response: Response;

  logUpstreamRequest(workflowLabel, "GET", url, webappSecret);

  try {
    response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-WEBAPP-SECRET": webappSecret,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(N8N_PROXY_TIMEOUT_MS),
    });
  } catch (error) {
    logFetchFailedBeforeRequest(workflowLabel, "GET", url, webappSecret, error);
    throw normalizeFetchError(error);
  }

  logUpstreamResponse(workflowLabel, "GET", url, webappSecret, response.status);
  return parseN8nResponse(response);
}

async function postFormDataToN8n(
  url: string,
  webappSecret: string,
  workflowLabel: string,
  formData: FormData,
): Promise<unknown> {
  let response: Response;

  logUpstreamRequest(workflowLabel, "POST", url, webappSecret);

  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "X-WEBAPP-SECRET": webappSecret,
      },
      body: formData,
      cache: "no-store",
      signal: AbortSignal.timeout(N8N_PROXY_TIMEOUT_MS),
    });
  } catch (error) {
    logFetchFailedBeforeRequest(workflowLabel, "POST", url, webappSecret, error);
    throw normalizeFetchError(error);
  }

  logUpstreamResponse(workflowLabel, "POST", url, webappSecret, response.status);
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
    const container = value
      .map(extractPrimaryRecord)
      .find((item) => item && hasKnownPayloadFields(item));

    if (container) {
      return normalizeCatalogoResponse(container);
    }

    return {
      panel_catalog: value.map(normalizePanelCatalogItem).filter(isDefined),
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
    ? container.panel_catalog.map(normalizePanelCatalogItem).filter(isDefined)
    : Array.isArray(container.items)
      ? container.items.map(normalizePanelCatalogItem).filter(isDefined)
      : Array.isArray(container.data)
        ? container.data.map(normalizePanelCatalogItem).filter(isDefined)
      : [];
  const inverterOptions = Array.isArray(container.inverter_options)
    ? container.inverter_options
        .map(normalizeInverterCatalogItem)
        .filter(isDefined)
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

function buildCatalogoPannelliUrl(
  baseUrl: string,
  payload: CatalogoPannelliLiveRequest,
): string {
  const url = new URL(baseUrl);

  url.searchParams.set("slug_cliente", payload.slug_cliente);

  if (payload.marca) {
    url.searchParams.set("marca", payload.marca);
  }

  if (typeof payload.potenza_min_w === "number") {
    url.searchParams.set("potenza_min_w", String(payload.potenza_min_w));
  }

  if (typeof payload.potenza_max_w === "number") {
    url.searchParams.set("potenza_max_w", String(payload.potenza_max_w));
  }

  return url.toString();
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

function normalizePanelCatalogItem(value: unknown): PanelCatalogItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const brand =
    readOptionalString(value, ["brand", "marca"]) ?? "";
  const model =
    readOptionalString(value, ["model", "modello"]) ?? "";
  const widthCm = readOptionalNumber(value, ["width_cm", "larghezza_cm"]);
  const heightCm = readOptionalNumber(value, ["height_cm", "altezza_cm"]);
  const powerW = readOptionalNumber(value, ["power_w", "potenza_w"]);
  const widthFromMm = readOptionalNumber(value, ["larghezza_mm"]);
  const heightFromMm = readOptionalNumber(value, ["altezza_mm"]);

  const normalizedWidthCm =
    widthCm ?? (typeof widthFromMm === "number" ? widthFromMm / 10 : undefined);
  const normalizedHeightCm =
    heightCm ?? (typeof heightFromMm === "number" ? heightFromMm / 10 : undefined);

  if (
    !brand ||
    !model ||
    typeof normalizedWidthCm !== "number" ||
    typeof normalizedHeightCm !== "number" ||
    typeof powerW !== "number"
  ) {
    return null;
  }

  return {
    panel_id: readOptionalString(value, ["panel_id", "pannello_id"]),
    item_code: readOptionalString(value, ["item_code", "codice_pannello"]),
    brand,
    model,
    width_cm: normalizedWidthCm,
    height_cm: normalizedHeightCm,
    power_w: powerW,
    active: typeof value.active === "boolean" ? value.active : true,
    allowed_orientation: normalizeAllowedOrientation(value.allowed_orientation),
    notes: readOptionalString(value, ["notes", "note"]) ?? "",
    datasheet_url: readOptionalString(value, ["datasheet_url"]),
  };
}

function normalizeInverterCatalogItem(value: unknown): InverterCatalogItem | null {
  if (
    !isRecord(value) ||
    typeof value.componente_id !== "string" ||
    typeof value.descrizione !== "string"
  ) {
    return null;
  }

  return {
    componente_id: value.componente_id,
    codice_articolo: readOptionalString(value, ["codice_articolo"]),
    descrizione: value.descrizione,
    sottocategoria: readOptionalString(value, ["sottocategoria"]),
    potenza_nominale_kw:
      typeof value.potenza_nominale_kw === "number" ? value.potenza_nominale_kw : null,
    brand: readOptionalString(value, ["brand"]),
    model: readOptionalString(value, ["model"]),
    notes: readOptionalString(value, ["notes", "note"]),
  };
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

function readOptionalString(
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
  fields: string | string[],
): number | undefined {
  const fieldList = Array.isArray(fields) ? fields : [fields];

  for (const field of fieldList) {
    const resolvedValue = readSingleOptionalNumber(value, field);

    if (typeof resolvedValue === "number") {
      return resolvedValue;
    }
  }

  return undefined;
}

function readSingleOptionalNumber(
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

function normalizeAllowedOrientation(value: unknown): PanelCatalogItem["allowed_orientation"] {
  return value === "verticale" || value === "orizzontale" || value === "entrambi"
    ? value
    : "entrambi";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
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

function logUpstreamRequest(
  workflowLabel: string,
  upstreamMethod: "GET" | "POST",
  upstreamUrl: string,
  webappSecret: string,
): void {
  console.info(`[${workflowLabel}] upstream request`, {
    upstreamMethod,
    upstreamUrl,
    hasSecret: Boolean(webappSecret),
  });
}

function logUpstreamResponse(
  workflowLabel: string,
  upstreamMethod: "GET" | "POST",
  upstreamUrl: string,
  webappSecret: string,
  status: number,
): void {
  console.info(`[${workflowLabel}] upstream response`, {
    upstreamMethod,
    upstreamUrl,
    hasSecret: Boolean(webappSecret),
    status,
  });
}

function logFetchFailedBeforeRequest(
  workflowLabel: string,
  upstreamMethod: "GET" | "POST",
  upstreamUrl: string,
  webappSecret: string,
  error: unknown,
): void {
  console.error(`[${workflowLabel}] fetch failed before request`, {
    upstreamMethod,
    upstreamUrl,
    hasSecret: Boolean(webappSecret),
    error: error instanceof Error ? error.message : String(error),
  });
}
