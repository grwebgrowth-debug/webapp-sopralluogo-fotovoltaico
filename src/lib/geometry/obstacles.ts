import type { ObstacleData } from "@/types/survey";

export type OstacoloGeometrico = {
  obstacle_id: string;
  shape: "rect" | "circle";
  safety_margin_cm: number;
};

export function creaOstacoloGeometricoPlaceholder(
  obstacle: ObstacleData,
): OstacoloGeometrico {
  return {
    obstacle_id: obstacle.obstacle_id,
    shape: obstacle.shape,
    safety_margin_cm: obstacle.safety_margin_cm,
  };
}

export function creaOstacoloRettangolarePlaceholder(
  obstacle: ObstacleData & { shape: "rect" },
): OstacoloGeometrico {
  return creaOstacoloGeometricoPlaceholder(obstacle);
}

export function creaOstacoloCircolarePlaceholder(
  obstacle: ObstacleData & { shape: "circle" },
): OstacoloGeometrico {
  return creaOstacoloGeometricoPlaceholder(obstacle);
}
