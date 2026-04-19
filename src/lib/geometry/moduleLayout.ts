import type {
  LayoutTargetConfig,
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
  config?: LayoutTargetConfig,
): PreliminaryModuleLayout {
  const panelErrors = getPanelDataErrors(panel);
  const layoutConfig = normalizeLayoutTargetConfig(config, panel.power_w);

  if (panelErrors.length > 0) {
    return {
      calculated_at: new Date().toISOString(),
      layout_mode: layoutConfig.mode,
      panel,
      surfaces: [],
      target_module_count: layoutConfig.target_module_count,
      target_power_w: layoutConfig.target_power_w,
      available_modules: 0,
      available_power_w: 0,
      target_reached: layoutConfig.mode === "target_power" ? false : null,
      total_modules: 0,
      total_power_w: 0,
      messages: panelErrors,
    };
  }

  const surfaceLayouts = calcolaCapacitaFaldeLayout(surfaces, panel);
  const availableModules = sumModules(surfaceLayouts);
  const availablePowerW = availableModules * panel.power_w;

  if (
    layoutConfig.mode === "target_power" &&
    layoutConfig.target_module_count !== null
  ) {
    return calcolaLayoutTarget(
      panel,
      surfaceLayouts,
      layoutConfig,
      availableModules,
      availablePowerW,
    );
  }

  return {
    calculated_at: new Date().toISOString(),
    layout_mode: "max_modules",
    panel,
    surfaces: surfaceLayouts,
    target_module_count: null,
    target_power_w: null,
    available_modules: availableModules,
    available_power_w: availablePowerW,
    target_reached: null,
    total_modules: availableModules,
    total_power_w: availablePowerW,
    messages: [
      ...(layoutConfig.mode === "target_power"
        ? ["Target impianto non impostato: calcolo del massimo numero di moduli possibile."]
        : []),
      ...surfaceLayouts.flatMap((layout) => layout.messages),
    ],
  };
}

export function calcolaCapacitaFaldeLayout(
  surfaces: SurfaceData[],
  panel: PanelTechnicalData,
): SurfaceModuleLayout[] {
  if (getPanelDataErrors(panel).length > 0) {
    return [];
  }

  return surfaces.map((surface) => calcolaLayoutFaldaPreliminare(surface, panel));
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

function calcolaLayoutTarget(
  panel: PanelTechnicalData,
  surfaceLayouts: SurfaceModuleLayout[],
  config: LayoutTargetConfig,
  availableModules: number,
  availablePowerW: number,
): PreliminaryModuleLayout {
  const targetModules = config.target_module_count ?? 0;
  const targetPowerW = targetModules * panel.power_w;
  let remainingModules = targetModules;
  const orderedLayouts = [...surfaceLayouts].sort(compareSurfaceCapacity);
  const selectedLayouts: SurfaceModuleLayout[] = [];

  orderedLayouts.forEach((layout) => {
    if (remainingModules <= 0 || layout.module_count <= 0) {
      return;
    }

    const modulesToUse = Math.min(layout.module_count, remainingModules);
    selectedLayouts.push(trimSurfaceLayout(layout, panel, modulesToUse));
    remainingModules -= modulesToUse;
  });

  const totalModules = sumModules(selectedLayouts);
  const messages = selectedLayouts.flatMap((layout) => layout.messages);

  if (targetModules > availableModules) {
    messages.unshift(
      `Target non raggiunto: richiesti ${targetModules} moduli, inseribili ${availableModules}.`,
    );
  }

  return {
    calculated_at: new Date().toISOString(),
    layout_mode: "target_power",
    panel,
    surfaces: selectedLayouts,
    target_module_count: targetModules,
    target_power_w: targetPowerW,
    available_modules: availableModules,
    available_power_w: availablePowerW,
    target_reached: totalModules >= targetModules,
    total_modules: totalModules,
    total_power_w: totalModules * panel.power_w,
    messages,
  };
}

function trimSurfaceLayout(
  layout: SurfaceModuleLayout,
  panel: PanelTechnicalData,
  moduleCount: number,
): SurfaceModuleLayout {
  const modules = layout.modules.slice(0, moduleCount);
  const occupiedAreaCm2 = modules.reduce(
    (total, module) => total + module.width_cm * module.height_cm,
    0,
  );

  return {
    ...layout,
    module_count: modules.length,
    modules,
    occupied_area_cm2: occupiedAreaCm2,
    total_power_w: modules.length * panel.power_w,
  };
}

function compareSurfaceCapacity(
  first: SurfaceModuleLayout,
  second: SurfaceModuleLayout,
): number {
  if (second.module_count !== first.module_count) {
    return second.module_count - first.module_count;
  }

  return second.useful_area_cm2 - first.useful_area_cm2;
}

function sumModules(layouts: SurfaceModuleLayout[]): number {
  return layouts.reduce((total, layout) => total + layout.module_count, 0);
}

function normalizeLayoutTargetConfig(
  config: LayoutTargetConfig | undefined,
  panelPowerW: number,
): LayoutTargetConfig {
  if (!config || config.mode !== "target_power") {
    return {
      mode: "max_modules",
      target_module_count: null,
      target_power_w: null,
    };
  }

  const targetModuleCount =
    config.target_module_count !== null &&
    Number.isFinite(config.target_module_count) &&
    config.target_module_count > 0
      ? Math.floor(config.target_module_count)
      : null;

  return {
    mode: "target_power",
    target_module_count: targetModuleCount,
    target_power_w:
      targetModuleCount !== null && panelPowerW > 0
        ? targetModuleCount * panelPowerW
        : null,
  };
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
