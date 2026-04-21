import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { CatalogoPannelliLiveRequest } from "@/types/liveApi";
import { jsonError, jsonRouteError, jsonSuccess } from "@/lib/server/liveApiResponse";
import { proxyCatalogoPannelli } from "@/lib/server/n8nProxy";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<CatalogoPannelliLiveRequest>;

    if (!body.slug_cliente || typeof body.slug_cliente !== "string") {
      return jsonError({
        status: 400,
        errorCode: "invalid_request",
        message: "slug_cliente obbligatorio.",
      });
    }

    const data = await proxyCatalogoPannelli({
      slug_cliente: body.slug_cliente,
      marca: typeof body.marca === "string" ? body.marca : undefined,
      potenza_min_w:
        typeof body.potenza_min_w === "number" ? body.potenza_min_w : undefined,
      potenza_max_w:
        typeof body.potenza_max_w === "number" ? body.potenza_max_w : undefined,
    });

    return jsonSuccess(data);
  } catch (error) {
    return jsonRouteError(error);
  }
}
