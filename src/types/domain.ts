export type RoofType =
  | "falda_unica"
  | "due_falde"
  | "due_falde_asimmetriche"
  | "quattro_falde"
  | "tetto_l"
  | "shed"
  | "multi_custom";

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
  | "altro";
