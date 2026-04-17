import type { WizardStepId } from "@/types/domain";
import type {
  ObstacleData,
  SurfaceData,
  SurfaceDimensions,
} from "@/types/survey";
import { validaOstacoloDentroFalda } from "@/lib/geometry/validation";
import type { WizardState } from "./wizardState";
import { costruisciPayloadN8nV1 } from "./wizardPayload";

export type WizardStepValidation = {
  valid: boolean;
  errors: string[];
};

export function validateWizardStep(
  state: WizardState,
  stepId: WizardStepId,
): WizardStepValidation {
  const errors: string[] = [];

  if (stepId === "cliente") {
    if (!state.customer.first_name.trim()) {
      errors.push("Nome cliente obbligatorio.");
    }

    if (!state.customer.last_name.trim()) {
      errors.push("Cognome cliente obbligatorio.");
    }

    if (!state.customer.address.trim()) {
      errors.push("Indirizzo del sopralluogo obbligatorio.");
    }

    if (!state.inspection.date.trim()) {
      errors.push("Data sopralluogo obbligatoria.");
    }

    if (state.customer.email && !state.customer.email.includes("@")) {
      errors.push("Email non valida.");
    }
  }

  if (stepId === "tetto" && state.roof.roof_type === null) {
    errors.push("Seleziona un tipo di tetto.");
  }

  if (stepId === "falde") {
    if (state.roof.surfaces.length === 0) {
      errors.push("Inserisci almeno una falda.");
    }

    state.roof.surfaces.forEach((surface, index) => {
      const prefix = `Falda ${index + 1}`;

      if (!surface.name.trim()) {
        errors.push(`${prefix}: nome falda obbligatorio.`);
      }

      if (!surface.orientation.trim()) {
        errors.push(`${prefix}: orientamento obbligatorio.`);
      }

      if (!hasValidDimensions(surface)) {
        errors.push(`${prefix}: quote principali mancanti o pari a zero.`);
      }
    });
  }

  if (stepId === "ostacoli") {
    if (state.roof.surfaces.length === 0) {
      errors.push("Inserisci almeno una falda prima degli ostacoli.");
    }

    state.roof.surfaces.forEach((surface, surfaceIndex) => {
      surface.obstacles.forEach((obstacle, obstacleIndex) => {
        const prefix = `Falda ${surfaceIndex + 1}, ostacolo ${
          obstacleIndex + 1
        }`;

        getObstacleErrors(surface, obstacle).forEach((error) => {
          errors.push(`${prefix}: ${error}`);
        });

        const geometryValidation = validaOstacoloDentroFalda(surface, obstacle);

        if (!geometryValidation.valido) {
          errors.push(`${prefix}: ${geometryValidation.errore}`);
        }
      });
    });
  }

  if (stepId === "pannello") {
    if (!state.panel_selection.brand.trim()) {
      errors.push("Marca pannello obbligatoria.");
    }

    if (!state.panel_selection.model.trim()) {
      errors.push("Modello pannello obbligatorio.");
    }
  }

  if (stepId === "revisione" || stepId === "invio") {
    errors.push(...validateFinalSurvey(state).errors);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateFinalSurvey(state: WizardState): WizardStepValidation {
  const errors: string[] = [];
  const checkedSteps: WizardStepId[] = [
    "cliente",
    "tetto",
    "falde",
    "ostacoli",
    "pannello",
  ];

  checkedSteps.forEach((stepId) => {
    validateWizardStep(state, stepId).errors.forEach((error) => {
      errors.push(error);
    });
  });

  const payloadResult = costruisciPayloadN8nV1(state);

  if (!payloadResult.ok) {
    payloadResult.errors.forEach((error) => {
      if (!errors.includes(error)) {
        errors.push(error);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

function hasValidDimensions(surface: SurfaceData): boolean {
  return getDimensionValues(surface.dimensions).every((value) => value > 0);
}

function getDimensionValues(dimensions: SurfaceDimensions): number[] {
  return Object.values(dimensions).filter(
    (value): value is number => typeof value === "number",
  );
}

function getObstacleErrors(
  surface: SurfaceData,
  obstacle: ObstacleData,
): string[] {
  const errors: string[] = [];

  if (!obstacle.obstacle_id.trim()) {
    errors.push("nome ostacolo obbligatorio.");
  }

  if (obstacle.safety_margin_cm <= 0) {
    errors.push("margine di sicurezza obbligatorio e maggiore di zero.");
  }

  if (obstacle.shape === "rect") {
    if (obstacle.dimensions.width_cm <= 0) {
      errors.push("larghezza ostacolo obbligatoria e maggiore di zero.");
    }

    if (obstacle.dimensions.height_cm <= 0) {
      errors.push("altezza ostacolo obbligatoria e maggiore di zero.");
    }
  }

  if (obstacle.shape === "circle" && obstacle.dimensions.diameter_cm <= 0) {
    errors.push("diametro ostacolo obbligatorio e maggiore di zero.");
  }

  if (surface.shape === "triangle") {
    if (!("distance_from_base_right_corner_cm" in obstacle.position)) {
      errors.push("riferimenti posizione triangolare mancanti.");
    } else {
      if (obstacle.position.distance_from_base_right_corner_cm <= 0) {
        errors.push(
          "distanza dall’angolo destro della base obbligatoria e maggiore di zero.",
        );
      }

      if (obstacle.position.height_from_base_cm <= 0) {
        errors.push("altezza dalla base (H) obbligatoria e maggiore di zero.");
      }
    }
  } else if (!("distance_from_base_cm" in obstacle.position)) {
    errors.push("riferimenti posizione standard mancanti.");
  } else {
    if (obstacle.position.distance_from_base_cm <= 0) {
      errors.push("distanza dalla base obbligatoria e maggiore di zero.");
    }

    if (obstacle.position.distance_from_left_cm <= 0) {
      errors.push("distanza dal lato sinistro obbligatoria e maggiore di zero.");
    }
  }

  return errors;
}
