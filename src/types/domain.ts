export const WIZARD_STEP_IDS = [
  "cliente",
  "tetto",
  "ostacoli",
  "pannello",
  "layout_moduli",
  "foto",
  "revisione",
] as const;

export type WizardStepId = (typeof WIZARD_STEP_IDS)[number];

export const ROOF_TYPES = [
  "falda_unica",
  "due_falde",
  "due_falde_asimmetriche",
  "quattro_falde_padiglione",
  "tetto_a_l",
  "shed",
  "piu_falde_personalizzato",
] as const;

export type RoofType = (typeof ROOF_TYPES)[number];

export const SURFACE_SHAPES = [
  "rectangular",
  "trapezoid",
  "triangle",
  "guided_quad",
] as const;

export type SurfaceShape = (typeof SURFACE_SHAPES)[number];

export const OBSTACLE_SHAPES = ["rect", "circle"] as const;

export type ObstacleShape = (typeof OBSTACLE_SHAPES)[number];

export const OBSTACLE_TYPES = [
  "camino",
  "lucernario",
  "sfiato",
  "antenna_palo",
  "area_non_utilizzabile",
  "altro_ostacolo",
] as const;

export type ObstacleType = (typeof OBSTACLE_TYPES)[number];

export const PANEL_ALLOWED_ORIENTATIONS = [
  "verticale",
  "orizzontale",
  "entrambi",
] as const;

export type PanelAllowedOrientation =
  (typeof PANEL_ALLOWED_ORIENTATIONS)[number];
