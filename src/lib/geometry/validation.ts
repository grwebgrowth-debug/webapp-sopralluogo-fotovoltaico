import type { ObstacleData, SurfaceData } from "@/types/survey";
import { creaOstacoloGeometrico } from "./obstacles";
import {
  creaPoligonoFalda,
  distanzaPuntoDaBordoPoligonoCm,
  isPuntoNelPoligono,
} from "./roof";

export type GeometryValidationResult =
  | {
      valido: true;
      errore?: never;
    }
  | {
      valido: false;
      errore: string;
    };

export function validaOstacoloDentroFalda(
  surface: SurfaceData,
  obstacle: ObstacleData,
): GeometryValidationResult {
  const dimensionValidation = validaDimensioniBase(surface, obstacle);

  if (!dimensionValidation.valido) {
    return dimensionValidation;
  }

  const falda = creaPoligonoFalda(surface);
  const geometriaOstacolo = creaOstacoloGeometrico(obstacle, surface);

  if (geometriaOstacolo.shape === "rect") {
    const expandedInside = geometriaOstacolo.expanded_vertices.every((point) =>
      isPuntoNelPoligono(point, falda),
    );

    if (!expandedInside) {
      return {
        valido: false,
        errore:
          "Con queste dimensioni e questo margine, l’ostacolo non rientra nella falda.",
      };
    }

    return { valido: true };
  }

  const centerInside = isPuntoNelPoligono(geometriaOstacolo.center, falda);
  const centerDistanceFromEdge = distanzaPuntoDaBordoPoligonoCm(
    geometriaOstacolo.center,
    falda,
  );

  if (
    !centerInside ||
    centerDistanceFromEdge < geometriaOstacolo.expanded_radius_cm
  ) {
    return {
      valido: false,
      errore:
        "Con queste dimensioni e questo margine, l’ostacolo non rientra nella falda.",
    };
  }

  return { valido: true };
}

export function validaOstacoloDentroFaldaPlaceholder(
  surface: SurfaceData,
  obstacle: ObstacleData,
): GeometryValidationResult {
  return validaOstacoloDentroFalda(surface, obstacle);
}

export function validaOstacoloPlaceholder(): GeometryValidationResult {
  return {
    valido: false,
    errore: "Seleziona una falda e un ostacolo da validare.",
  };
}

function validaDimensioniBase(
  surface: SurfaceData,
  obstacle: ObstacleData,
): GeometryValidationResult {
  if (obstacle.safety_margin_cm < 0) {
    return {
      valido: false,
      errore: "Il margine di sicurezza non può essere negativo.",
    };
  }

  if (obstacle.shape === "rect") {
    if (
      obstacle.dimensions.width_cm <= 0 ||
      obstacle.dimensions.height_cm <= 0
    ) {
      return {
        valido: false,
        errore: "Larghezza e altezza ostacolo devono essere maggiori di zero.",
      };
    }
  }

  if (obstacle.shape === "circle" && obstacle.dimensions.diameter_cm <= 0) {
    return {
      valido: false,
      errore: "Il diametro ostacolo deve essere maggiore di zero.",
    };
  }

  if (surface.shape === "triangle") {
    if (!("distance_from_base_right_corner_cm" in obstacle.position)) {
      return {
        valido: false,
        errore:
          "Per una falda triangolare usa distanza dall’angolo destro della base e altezza dalla base (H).",
      };
    }

    if (obstacle.position.distance_from_base_right_corner_cm <= 0) {
      return {
        valido: false,
        errore:
          "La distanza del centro dall'angolo destro della base è troppo piccola.",
      };
    }

    if (obstacle.position.height_from_base_cm <= 0) {
      return {
        valido: false,
        errore:
          "L'altezza del centro dalla base (H) deve essere maggiore di zero.",
      };
    }
  } else {
    if (!("distance_from_base_cm" in obstacle.position)) {
      return {
        valido: false,
        errore:
          "Per questa falda usa distanza dalla base e distanza dal lato sinistro.",
      };
    }

    if (obstacle.position.distance_from_base_cm <= 0) {
      return {
        valido: false,
        errore: "La distanza del centro dalla base è troppo piccola.",
      };
    }

    if (obstacle.position.distance_from_left_cm <= 0) {
      return {
        valido: false,
        errore: "La distanza del centro dal lato sinistro è troppo piccola.",
      };
    }
  }

  return { valido: true };
}
