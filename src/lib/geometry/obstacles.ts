import type { ObstacleData, SurfaceData } from "@/types/survey";
import type { Punto2D } from "./roof";

export type OstacoloRettangolareGeometrico = {
  obstacle_id: string;
  shape: "rect";
  anchor: Punto2D;
  center: Punto2D;
  width_cm: number;
  height_cm: number;
  safety_margin_cm: number;
  vertices: Punto2D[];
  expanded_vertices: Punto2D[];
};

export type OstacoloCircolareGeometrico = {
  obstacle_id: string;
  shape: "circle";
  center: Punto2D;
  radius_cm: number;
  expanded_radius_cm: number;
  safety_margin_cm: number;
};

export type OstacoloGeometrico =
  | OstacoloRettangolareGeometrico
  | OstacoloCircolareGeometrico;

export function creaOstacoloGeometrico(
  obstacle: ObstacleData,
  surface: SurfaceData,
): OstacoloGeometrico {
  if (obstacle.shape === "rect") {
    return creaOstacoloRettangolare(obstacle, surface);
  }

  return creaOstacoloCircolare(obstacle, surface);
}

export function creaOstacoloRettangolare(
  obstacle: ObstacleData & { shape: "rect" },
  surface: SurfaceData,
): OstacoloRettangolareGeometrico {
  const center = getObstacleCenter(obstacle, surface);
  const anchor = {
    x_cm: center.x_cm - obstacle.dimensions.width_cm / 2,
    y_cm: center.y_cm - obstacle.dimensions.height_cm / 2,
  };
  const vertices = getRectVertices(
    anchor,
    obstacle.dimensions.width_cm,
    obstacle.dimensions.height_cm,
  );
  const expandedAnchor = {
    x_cm:
      center.x_cm -
      obstacle.dimensions.width_cm / 2 -
      obstacle.safety_margin_cm,
    y_cm:
      center.y_cm -
      obstacle.dimensions.height_cm / 2 -
      obstacle.safety_margin_cm,
  };
  const expandedVertices = getRectVertices(
    expandedAnchor,
    obstacle.dimensions.width_cm + obstacle.safety_margin_cm * 2,
    obstacle.dimensions.height_cm + obstacle.safety_margin_cm * 2,
  );

  return {
    obstacle_id: obstacle.obstacle_id,
    shape: "rect",
    anchor,
    center,
    width_cm: obstacle.dimensions.width_cm,
    height_cm: obstacle.dimensions.height_cm,
    safety_margin_cm: obstacle.safety_margin_cm,
    vertices,
    expanded_vertices: expandedVertices,
  };
}

export function creaOstacoloCircolare(
  obstacle: ObstacleData & { shape: "circle" },
  surface: SurfaceData,
): OstacoloCircolareGeometrico {
  const center = getObstacleCenter(obstacle, surface);
  const radius = obstacle.dimensions.diameter_cm / 2;

  return {
    obstacle_id: obstacle.obstacle_id,
    shape: "circle",
    center,
    radius_cm: radius,
    expanded_radius_cm: radius + obstacle.safety_margin_cm,
    safety_margin_cm: obstacle.safety_margin_cm,
  };
}

export function creaOstacoloGeometricoPlaceholder(
  obstacle: ObstacleData,
): OstacoloGeometrico {
  return creaOstacoloGeometrico(obstacle, createFallbackSurface());
}

export function creaOstacoloRettangolarePlaceholder(
  obstacle: ObstacleData & { shape: "rect" },
): OstacoloGeometrico {
  return creaOstacoloRettangolare(obstacle, createFallbackSurface());
}

export function creaOstacoloCircolarePlaceholder(
  obstacle: ObstacleData & { shape: "circle" },
): OstacoloGeometrico {
  return creaOstacoloCircolare(obstacle, createFallbackSurface());
}

function getObstacleCenter(obstacle: ObstacleData, surface: SurfaceData): Punto2D {
  if (surface.shape === "triangle") {
    if (!("distance_from_base_right_corner_cm" in obstacle.position)) {
      return { x_cm: 0, y_cm: 0 };
    }

    return {
      x_cm:
        surface.dimensions.base_cm -
        obstacle.position.distance_from_base_right_corner_cm,
      y_cm: obstacle.position.height_from_base_cm,
    };
  }

  if (!("distance_from_base_cm" in obstacle.position)) {
    return { x_cm: 0, y_cm: 0 };
  }

  return {
    x_cm: obstacle.position.distance_from_left_cm,
    y_cm: obstacle.position.distance_from_base_cm,
  };
}

function getRectVertices(
  anchor: Punto2D,
  widthCm: number,
  heightCm: number,
): Punto2D[] {
  return [
    anchor,
    { x_cm: anchor.x_cm + widthCm, y_cm: anchor.y_cm },
    { x_cm: anchor.x_cm + widthCm, y_cm: anchor.y_cm + heightCm },
    { x_cm: anchor.x_cm, y_cm: anchor.y_cm + heightCm },
  ];
}

function createFallbackSurface(): SurfaceData {
  return {
    surface_id: "fallback",
    name: "Falda provvisoria",
    shape: "rectangular",
    orientation: "",
    coverage: "",
    tilt_deg: 0,
    edge_clearance_cm: 0,
    notes: "",
    dimensions: {
      width_cm: 1,
      height_cm: 1,
    },
    obstacles: [],
  };
}
