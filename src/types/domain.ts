export type WizardStepId =
  | "cliente"
  | "tetto"
  | "falde"
  | "ostacoli"
  | "pannello"
  | "revisione"
  | "invio";

export type RoofType =
  | "falda_unica"
  | "due_falde"
  | "due_falde_asimmetriche"
  | "quattro_falde_padiglione"
  | "tetto_a_l"
  | "shed"
  | "piu_falde_personalizzato";

export type SurfaceShape =
  | "rectangular"
  | "trapezoid"
  | "triangle"
  | "guided_quad";

export type ObstacleShape = "rect" | "circle";

export type ObstacleType =
  | "camino"
  | "lucernario"
  | "sfiato"
  | "antenna_palo"
  | "area_non_utilizzabile"
  | "altro_ostacolo";

export type PanelAllowedOrientation = "verticale" | "orizzontale" | "entrambi";
