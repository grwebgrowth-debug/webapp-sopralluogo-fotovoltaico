import type { SurfaceShape } from "@/types/domain";
import type { SurfaceData, SurfaceDimensions } from "@/types/survey";

export function createDefaultSurface(index: number): SurfaceData {
  return {
    surface_id: createSurfaceId(),
    name: `Falda ${index}`,
    shape: "rectangular",
    orientation: "",
    coverage: "",
    tilt_deg: 0,
    edge_clearance_cm: 0,
    notes: "",
    dimensions: {
      width_cm: 0,
      height_cm: 0,
    },
    obstacles: [],
  };
}

export function createDefaultDimensions(
  shape: SurfaceShape,
): SurfaceDimensions {
  switch (shape) {
    case "rectangular":
      return {
        width_cm: 0,
        height_cm: 0,
      };
    case "trapezoid":
      return {
        base_bottom_cm: 0,
        base_top_cm: 0,
        height_cm: 0,
      };
    case "triangle":
      return {
        base_cm: 0,
        height_cm: 0,
      };
    case "guided_quad":
      return {
        base_bottom_cm: 0,
        left_height_cm: 0,
        right_height_cm: 0,
        top_width_cm: 0,
      };
  }
}

export function ensureSurfaceCount(
  currentSurfaces: SurfaceData[],
  count: number,
): SurfaceData[] {
  const safeCount = Math.max(1, Math.floor(count));
  const nextSurfaces = currentSurfaces.slice(0, safeCount);

  while (nextSurfaces.length < safeCount) {
    nextSurfaces.push(createDefaultSurface(nextSurfaces.length + 1));
  }

  return nextSurfaces.map((surface, index) => ({
    ...surface,
    name: surface.name || `Falda ${index + 1}`,
  }));
}

function createSurfaceId(): string {
  return `falda_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
