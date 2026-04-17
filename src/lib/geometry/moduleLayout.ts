import type {
  ModuleOrientation,
  PositionedModule,
  PreliminaryModuleLayout,
  SurfaceModuleLayout,
} from "@/types/layout";
import type { PanelTechnicalData } from "@/types/panels";
import type { SurfaceData } from "@/types/survey";
import { creaOstacoloGeometrico } from "./obstacles";
import type { OstacoloGeometrico } from "./obstacles";
import {
  creaPoligonoFalda,
  distanzaPuntoDaBordoPoligonoCm,
  getPoligonoBounds,
  isPuntoNelPoligono,
  type PoligonoFalda,
  type Punto2D,
} from "./roof";

type Rect2D = {
  x_cm: number;
  y_cm: number;
  width_cm: number;
  height_cm: number;
};

export function calcolaLayoutModuliPreliminare(
  surfaces: SurfaceData[],
  panel: PanelTechnicalData,
): PreliminaryModuleLayout {
  const panelErrors = getPanelDataErrors(panel);

  if (panelErrors.length > 0) {
    return {
      calculated_at: new Date().toISOString(),
      panel,
      surfaces: [],
      total_modules: 0,
      total_power_w: 0,
      messages: panelErrors,
    };
  }

  const surfaceLayouts = surfaces.map((surface) =>
    calcolaLayoutFaldaPreliminare(surface, panel),
  );

  return {
    calculated_at: new Date().toISOString(),
    panel,
    surfaces: surfaceLayouts,
    total_modules: surfaceLayouts.reduce(
      (total, layout) => total + layout.module_count,
      0,
    ),
    total_power_w: surfaceLayouts.reduce(
      (total, layout) => total + layout.total_power_w,
      0,
    ),
    messages: surfaceLayouts.flatMap((layout) => layout.messages),
  };
}

export function calcolaLayoutFaldaPreliminare(
  surface: SurfaceData,
  panel: PanelTechnicalData,
): SurfaceModuleLayout {
  const verticalLayout = calcolaLayoutPerOrientamento(
    surface,
    panel,
    "verticale",
  );
  const horizontalLayout = calcolaLayoutPerOrientamento(
    surface,
    panel,
    "orizzontale",
  );

  return scegliLayoutMigliore(verticalLayout, horizontalLayout);
}

function calcolaLayoutPerOrientamento(
  surface: SurfaceData,
  panel: PanelTechnicalData,
  orientation: ModuleOrientation,
): SurfaceModuleLayout {
  const falda = creaPoligonoFalda(surface);
  const bounds = getPoligonoBounds(falda);
  const moduleWidth =
    orientation === "verticale" ? panel.width_cm : panel.height_cm;
  const moduleHeight =
    orientation === "verticale" ? panel.height_cm : panel.width_cm;
  const modules: PositionedModule[] = [];
  const obstacles = surface.obstacles.map((obstacle) =>
    creaOstacoloGeometrico(obstacle, surface),
  );
  const edgeClearance = Math.max(0, surface.edge_clearance_cm);
  const startX = bounds.min_x_cm + edgeClearance;
  const endX = bounds.max_x_cm - edgeClearance - moduleWidth;
  const startY = bounds.min_y_cm + edgeClearance;
  const endY = bounds.max_y_cm - edgeClearance - moduleHeight;
  const messages: string[] = [];

  if (endX < startX || endY < startY) {
    messages.push(`${surface.name}: falda troppo piccola per moduli ${orientation}.`);
  } else {
    let moduleIndex = 1;

    for (let y = startY; y <= endY; y += moduleHeight) {
      for (let x = startX; x <= endX; x += moduleWidth) {
        const candidate: Rect2D = {
          x_cm: roundCm(x),
          y_cm: roundCm(y),
          width_cm: moduleWidth,
          height_cm: moduleHeight,
        };

        if (isModuloInseribile(candidate, falda, obstacles, edgeClearance)) {
          modules.push({
            module_id: `${surface.surface_id}_${orientation}_${moduleIndex}`,
            surface_id: surface.surface_id,
            x_cm: candidate.x_cm,
            y_cm: candidate.y_cm,
            width_cm: candidate.width_cm,
            height_cm: candidate.height_cm,
            orientation,
          });
          moduleIndex += 1;
        }
      }
    }

    if (modules.length === 0) {
      messages.push(
        `${surface.name}: nessun modulo inseribile con orientamento ${orientation}.`,
      );
    }
  }

  return {
    surface_id: surface.surface_id,
    surface_name: surface.name,
    selected_orientation: orientation,
    module_count: modules.length,
    modules,
    useful_area_cm2: Math.max(0, getPoligonoAreaCm2(falda) - getObstacleAreaCm2(obstacles)),
    occupied_area_cm2: modules.length * moduleWidth * moduleHeight,
    total_power_w: modules.length * panel.power_w,
    messages,
  };
}

function scegliLayoutMigliore(
  verticalLayout: SurfaceModuleLayout,
  horizontalLayout: SurfaceModuleLayout,
): SurfaceModuleLayout {
  if (horizontalLayout.module_count > verticalLayout.module_count) {
    return horizontalLayout;
  }

  if (horizontalLayout.module_count < verticalLayout.module_count) {
    return verticalLayout;
  }

  if (horizontalLayout.total_power_w > verticalLayout.total_power_w) {
    return horizontalLayout;
  }

  return verticalLayout;
}

function isModuloInseribile(
  moduleRect: Rect2D,
  falda: PoligonoFalda,
  obstacles: OstacoloGeometrico[],
  edgeClearance: number,
): boolean {
  const moduleVertices = getRectVertices(moduleRect);
  const insideFalda = moduleVertices.every((point) =>
    isPuntoNelPoligono(point, falda),
  );

  if (!insideFalda) {
    return false;
  }

  if (
    edgeClearance > 0 &&
    moduleVertices.some(
      (point) => distanzaPuntoDaBordoPoligonoCm(point, falda) < edgeClearance,
    )
  ) {
    return false;
  }

  return obstacles.every((obstacle) => !doesModuleOverlapObstacle(moduleRect, obstacle));
}

function doesModuleOverlapObstacle(
  moduleRect: Rect2D,
  obstacle: OstacoloGeometrico,
): boolean {
  if (obstacle.shape === "rect") {
    return doPolygonsOverlap(
      getRectVertices(moduleRect),
      obstacle.expanded_vertices,
    );
  }

  return doesRectOverlapCircle(
    moduleRect,
    obstacle.center,
    obstacle.expanded_radius_cm,
  );
}

function doPolygonsOverlap(first: Punto2D[], second: Punto2D[]): boolean {
  if (first.some((point) => isPointInPolygonStrict(point, second))) {
    return true;
  }

  if (second.some((point) => isPointInPolygonStrict(point, first))) {
    return true;
  }

  return first.some((start, index) => {
    const end = first[(index + 1) % first.length];
    return second.some((otherStart, otherIndex) =>
      doSegmentsIntersect(
        start,
        end,
        otherStart,
        second[(otherIndex + 1) % second.length],
      ),
    );
  });
}

function doesRectOverlapCircle(
  rect: Rect2D,
  center: Punto2D,
  radiusCm: number,
): boolean {
  const closestX = clamp(center.x_cm, rect.x_cm, rect.x_cm + rect.width_cm);
  const closestY = clamp(center.y_cm, rect.y_cm, rect.y_cm + rect.height_cm);
  return Math.hypot(center.x_cm - closestX, center.y_cm - closestY) <= radiusCm;
}

function getRectVertices(rect: Rect2D): Punto2D[] {
  return [
    { x_cm: rect.x_cm, y_cm: rect.y_cm },
    { x_cm: rect.x_cm + rect.width_cm, y_cm: rect.y_cm },
    {
      x_cm: rect.x_cm + rect.width_cm,
      y_cm: rect.y_cm + rect.height_cm,
    },
    { x_cm: rect.x_cm, y_cm: rect.y_cm + rect.height_cm },
  ];
}

function getPoligonoAreaCm2(poligono: PoligonoFalda): number {
  const area = poligono.reduce((total, point, index) => {
    const next = poligono[(index + 1) % poligono.length];
    return total + point.x_cm * next.y_cm - next.x_cm * point.y_cm;
  }, 0);

  return Math.abs(area) / 2;
}

function getObstacleAreaCm2(obstacles: OstacoloGeometrico[]): number {
  return obstacles.reduce((total, obstacle) => {
    if (obstacle.shape === "rect") {
      return total + getPoligonoAreaCm2(obstacle.expanded_vertices);
    }

    return total + Math.PI * obstacle.expanded_radius_cm ** 2;
  }, 0);
}

function doSegmentsIntersect(
  firstStart: Punto2D,
  firstEnd: Punto2D,
  secondStart: Punto2D,
  secondEnd: Punto2D,
): boolean {
  const d1 = direction(secondStart, secondEnd, firstStart);
  const d2 = direction(secondStart, secondEnd, firstEnd);
  const d3 = direction(firstStart, firstEnd, secondStart);
  const d4 = direction(firstStart, firstEnd, secondEnd);

  if (
    ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
  ) {
    return true;
  }

  return (
    (d1 === 0 && isOnSegment(secondStart, secondEnd, firstStart)) ||
    (d2 === 0 && isOnSegment(secondStart, secondEnd, firstEnd)) ||
    (d3 === 0 && isOnSegment(firstStart, firstEnd, secondStart)) ||
    (d4 === 0 && isOnSegment(firstStart, firstEnd, secondEnd))
  );
}

function direction(a: Punto2D, b: Punto2D, c: Punto2D): number {
  return (c.x_cm - a.x_cm) * (b.y_cm - a.y_cm) - (b.x_cm - a.x_cm) * (c.y_cm - a.y_cm);
}

function isOnSegment(a: Punto2D, b: Punto2D, c: Punto2D): boolean {
  return (
    Math.min(a.x_cm, b.x_cm) <= c.x_cm &&
    c.x_cm <= Math.max(a.x_cm, b.x_cm) &&
    Math.min(a.y_cm, b.y_cm) <= c.y_cm &&
    c.y_cm <= Math.max(a.y_cm, b.y_cm)
  );
}

function isPointInPolygonStrict(point: Punto2D, poligono: Punto2D[]): boolean {
  return isPuntoNelPoligono(point, poligono);
}

function getPanelDataErrors(panel: PanelTechnicalData): string[] {
  const errors: string[] = [];

  if (panel.width_cm <= 0) {
    errors.push("Larghezza pannello mancante o non valida.");
  }

  if (panel.height_cm <= 0) {
    errors.push("Altezza pannello mancante o non valida.");
  }

  if (panel.power_w <= 0) {
    errors.push("Potenza pannello mancante o non valida.");
  }

  return errors;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundCm(value: number): number {
  return Math.round(value * 100) / 100;
}
