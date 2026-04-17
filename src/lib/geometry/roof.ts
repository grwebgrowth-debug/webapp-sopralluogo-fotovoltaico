import type {
  GuidedQuadSurfaceDimensions,
  RectangularSurfaceDimensions,
  SurfaceData,
  TrapezoidSurfaceDimensions,
  TriangleSurfaceDimensions,
} from "@/types/survey";

export type Punto2D = {
  x_cm: number;
  y_cm: number;
};

export type PoligonoFalda = Punto2D[];

export function creaPoligonoFaldaPlaceholder(surface: SurfaceData): PoligonoFalda {
  void surface;

  return [];
}

export function creaRettangoloPlaceholder(
  dimensions: RectangularSurfaceDimensions,
): PoligonoFalda {
  void dimensions;

  return [];
}

export function creaTrapezioPlaceholder(
  dimensions: TrapezoidSurfaceDimensions,
): PoligonoFalda {
  void dimensions;

  return [];
}

export function creaTriangoloPlaceholder(
  dimensions: TriangleSurfaceDimensions,
): PoligonoFalda {
  void dimensions;

  return [];
}

export function creaQuadrilateroGuidatoPlaceholder(
  dimensions: GuidedQuadSurfaceDimensions,
): PoligonoFalda {
  void dimensions;

  return [];
}
