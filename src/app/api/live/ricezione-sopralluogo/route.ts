import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { RicezioneSopralluogoLiveRequest } from "@/types/liveApi";
import { jsonError, jsonRouteError, jsonSuccess } from "@/lib/server/liveApiResponse";
import { proxyRicezioneSopralluogo } from "@/lib/server/n8nProxy";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<RicezioneSopralluogoLiveRequest>;

    if (!body.slug_cliente || typeof body.slug_cliente !== "string") {
      return jsonError({
        status: 400,
        errorCode: "invalid_request",
        message: "slug_cliente obbligatorio.",
      });
    }

    if (!body.idempotency_key || typeof body.idempotency_key !== "string") {
      return jsonError({
        status: 400,
        errorCode: "invalid_request",
        message: "idempotency_key obbligatoria.",
      });
    }

    if (!body.payload_full || typeof body.payload_full !== "object") {
      return jsonError({
        status: 400,
        errorCode: "invalid_request",
        message: "payload_full obbligatorio.",
      });
    }

    if (!body.survey || typeof body.survey !== "object") {
      return jsonError({
        status: 400,
        errorCode: "invalid_request",
        message: "survey obbligatorio.",
      });
    }

    const data = await proxyRicezioneSopralluogo({
      slug_cliente: body.slug_cliente,
      idempotency_key: body.idempotency_key,
      schema_version:
        typeof body.schema_version === "string" ? body.schema_version : "1.0",
      source_app:
        typeof body.source_app === "string"
          ? body.source_app
          : "webapp_sopralluogo_fotovoltaico_v1",
      foto_expected_count:
        typeof body.foto_expected_count === "number" ? body.foto_expected_count : 0,
      survey: body.survey as RicezioneSopralluogoLiveRequest["survey"],
      payload_full: body.payload_full as RicezioneSopralluogoLiveRequest["payload_full"],
    });

    return jsonSuccess(data);
  } catch (error) {
    return jsonRouteError(error);
  }
}
