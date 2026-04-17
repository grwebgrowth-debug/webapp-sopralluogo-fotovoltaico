import type { WizardStepId } from "@/types/domain";
import type { N8nSurveyPayload } from "@/types/survey";

export type WizardState = {
  currentStepId: WizardStepId;
  completedStepIds: WizardStepId[];
  draft: Partial<N8nSurveyPayload>;
};

export const INITIAL_WIZARD_STATE: WizardState = {
  currentStepId: "cliente",
  completedStepIds: [],
  draft: {},
};
