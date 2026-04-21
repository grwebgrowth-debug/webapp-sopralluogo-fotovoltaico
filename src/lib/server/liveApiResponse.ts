import { NextResponse } from "next/server";
import type {
  LiveApiErrorCode,
  LiveApiFailure,
  LiveApiResponse,
  LiveApiSuccess,
} from "@/types/liveApi";
import { N8nProxyError } from "./n8nProxy";

type ErrorResponseOptions = {
  details?: Record<string, unknown>;
  errorCode: LiveApiErrorCode;
  message: string;
  status: number;
};

export function jsonSuccess<T>(
  data: T,
  status = 200,
): NextResponse<LiveApiResponse<T>> {
  const body: LiveApiSuccess<T> = {
    ok: true,
    data,
  };

  return NextResponse.json(body, { status });
}

export function jsonError(
  options: ErrorResponseOptions,
): NextResponse<LiveApiFailure> {
  return NextResponse.json(
    {
      ok: false,
      error_code: options.errorCode,
      message: options.message,
      details: options.details,
    },
    { status: options.status },
  );
}

export function jsonRouteError(
  error: unknown,
  fallbackMessage = "Errore server.",
): NextResponse<LiveApiFailure> {
  if (error instanceof N8nProxyError) {
    return jsonError({
      status: error.status,
      errorCode: error.errorCode,
      message: error.message,
      details: error.details,
    });
  }

  if (error instanceof SyntaxError) {
    return jsonError({
      status: 400,
      errorCode: "invalid_request",
      message: "Body richiesta non valido.",
    });
  }

  return jsonError({
    status: 500,
    errorCode: "server_error",
    message: fallbackMessage,
  });
}
