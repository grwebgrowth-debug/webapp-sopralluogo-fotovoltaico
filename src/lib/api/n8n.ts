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
    };

export async function recuperaCatalogoPannelliDaN8n(): Promise<
  ApiResult<PanelCatalogItem[]>
> {
  return {
    ok: false,
    error: "Integrazione n8n non ancora implementata.",
  };
}

export async function inviaSopralluogoAN8n(
  payload: N8nSurveyPayload,
): Promise<ApiResult<{ id_sopralluogo?: string }>> {
  void payload;

  return {
    ok: false,
    error: "Invio a n8n non ancora implementato.",
  };
}
