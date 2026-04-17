import type { WizardStepId } from "@/types/domain";
import type { SurfaceData, SurfaceDimensions } from "@/types/survey";
import type { WizardState } from "./wizardState";

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
