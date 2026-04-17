import type { ObstacleData, SurfaceData } from "@/types/survey";

export type GeometryValidationResult =
  | {
      valido: true;
      errore?: never;
    }
  | {
      valido: false;
      errore: string;
    };

export function validaOstacoloDentroFaldaPlaceholder(
  surface: SurfaceData,
  obstacle: ObstacleData,
): GeometryValidationResult {
  void surface;
  void obstacle;

  return {
    valido: false,
    errore: "Validazione geometrica non ancora implementata.",
  };
}

export function validaOstacoloPlaceholder(): GeometryValidationResult {
  return {
    valido: false,
    errore: "Validazione geometrica non ancora implementata.",
  };
}
