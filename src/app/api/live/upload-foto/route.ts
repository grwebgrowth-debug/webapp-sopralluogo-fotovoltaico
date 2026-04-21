import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jsonError, jsonRouteError, jsonSuccess } from "@/lib/server/liveApiResponse";
import { proxyUploadFoto } from "@/lib/server/n8nProxy";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const slugCliente = formData.get("slug_cliente");
    const sopralluogoId = formData.get("sopralluogo_id");
    const ordine = formData.get("ordine");
    const tipoFoto = formData.get("tipo_foto");
    const file = formData.get("file");

    if (
      typeof slugCliente !== "string" ||
      typeof sopralluogoId !== "string" ||
      typeof ordine !== "string" ||
      typeof tipoFoto !== "string" ||
      !(file instanceof File)
    ) {
      return jsonError({
        status: 400,
        errorCode: "invalid_request",
        message: "Dati upload foto incompleti.",
      });
    }

    const data = await proxyUploadFoto({
      slug_cliente: slugCliente,
      sopralluogo_id: sopralluogoId,
      ordine,
      tipo_foto: tipoFoto,
      file,
      nota: readOptionalField(formData.get("nota")),
      uploaded_by: readOptionalField(formData.get("uploaded_by")),
      sha256_file: readOptionalField(formData.get("sha256_file")),
    });

    return jsonSuccess(data);
  } catch (error) {
    return jsonRouteError(error);
  }
}

function readOptionalField(value: FormDataEntryValue | null): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}
