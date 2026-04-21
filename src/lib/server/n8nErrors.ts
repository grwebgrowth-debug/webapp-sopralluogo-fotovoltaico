import type { LiveApiErrorCode } from "@/types/liveApi";

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
