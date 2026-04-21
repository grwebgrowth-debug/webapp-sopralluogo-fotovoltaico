import type { CatalogoConfigurazioneItem } from "./panels";
import type { N8nSurveyPayload } from "./survey";

export const LIVE_API_ERROR_CODES = [
  "invalid_request",
  "not_configured",
  "upstream_error",
  "upstream_timeout",
  "upstream_invalid_response",
  "server_error",
] as const;

export type LiveApiErrorCode = (typeof LIVE_API_ERROR_CODES)[number];

export type LiveApiSuccess<T> = {
  ok: true;
  data: T;
};

export type LiveApiFailure = {
  ok: false;
  error_code: LiveApiErrorCode;
  message: string;
  details?: Record<string, unknown>;
};

export type LiveApiResponse<T> = LiveApiSuccess<T> | LiveApiFailure;

export type CatalogoPannelliLiveRequest = {
  slug_cliente: string;
  marca?: string;
  potenza_min_w?: number;
  potenza_max_w?: number;
};

export type CatalogoPannelliLiveResponse = CatalogoConfigurazioneItem;

export type RicezioneSopralluogoLiveRequest = {
  slug_cliente: string;
  idempotency_key: string;
  schema_version: string;
  source_app: string;
  foto_expected_count: number;
  survey: N8nSurveyPayload["survey"];
  payload_full: N8nSurveyPayload;
};

export type RicezioneSopralluogoLiveResponse = {
  id_sopralluogo: string;
  message: string;
  status?: string;
};

export type UploadFotoLiveResponse = {
  foto_id?: string;
  message: string;
  ordine?: number;
  tipo_foto?: string;
};

export type CatalogoPannelliLiveApiResponse =
  LiveApiResponse<CatalogoPannelliLiveResponse>;
export type RicezioneSopralluogoLiveApiResponse =
  LiveApiResponse<RicezioneSopralluogoLiveResponse>;
export type UploadFotoLiveApiResponse = LiveApiResponse<UploadFotoLiveResponse>;
