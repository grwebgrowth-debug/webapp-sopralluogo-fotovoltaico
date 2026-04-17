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

export type Box2D = {
  min_x_cm: number;
  min_y_cm: number;
  max_x_cm: number;
  max_y_cm: number;
};

export function creaPoligonoFalda(surface: SurfaceData): PoligonoFalda {
  switch (surface.shape) {
    case "rectangular":
      return creaRettangolo(surface.dimensions);
    case "trapezoid":
      return creaTrapezio(surface.dimensions);
    case "triangle":
      return creaTriangolo(surface.dimensions);
    case "guided_quad":
      return creaQuadrilateroGuidato(surface.dimensions);
  }
}

export function creaRettangolo(
  dimensions: RectangularSurfaceDimensions,
): PoligonoFalda {
  return [
    { x_cm: 0, y_cm: 0 },
    { x_cm: dimensions.width_cm, y_cm: 0 },
    { x_cm: dimensions.width_cm, y_cm: dimensions.height_cm },
    { x_cm: 0, y_cm: dimensions.height_cm },
  ];
}

export function creaTrapezio(
  dimensions: TrapezoidSurfaceDimensions,
): PoligonoFalda {
  const offsetTopX = Math.max(
    0,
    (dimensions.base_bottom_cm - dimensions.base_top_cm) / 2,
  );

  return [
    { x_cm: 0, y_cm: 0 },
    { x_cm: dimensions.base_bottom_cm, y_cm: 0 },
    {
      x_cm: offsetTopX + dimensions.base_top_cm,
      y_cm: dimensions.height_cm,
    },
    { x_cm: offsetTopX, y_cm: dimensions.height_cm },
  ];
}

export function creaTriangolo(
  dimensions: TriangleSurfaceDimensions,
): PoligonoFalda {
  return [
    { x_cm: 0, y_cm: 0 },
    { x_cm: dimensions.base_cm, y_cm: 0 },
    { x_cm: dimensions.base_cm / 2, y_cm: dimensions.height_cm },
  ];
}

export function creaQuadrilateroGuidato(
  dimensions: GuidedQuadSurfaceDimensions,
): PoligonoFalda {
  return [
    { x_cm: 0, y_cm: 0 },
    { x_cm: dimensions.base_bottom_cm, y_cm: 0 },
    { x_cm: dimensions.top_width_cm, y_cm: dimensions.right_height_cm },
    { x_cm: 0, y_cm: dimensions.left_height_cm },
  ];
}

export function getPoligonoBounds(poligono: PoligonoFalda): Box2D {
  const xValues = poligono.map((point) => point.x_cm);
  const yValues = poligono.map((point) => point.y_cm);

  return {
    min_x_cm: Math.min(...xValues),
    min_y_cm: Math.min(...yValues),
    max_x_cm: Math.max(...xValues),
    max_y_cm: Math.max(...yValues),
  };
}

export function isPuntoNelPoligono(
  point: Punto2D,
  poligono: PoligonoFalda,
): boolean {
  return isPuntoSulBordo(point, poligono) || isPuntoInterno(point, poligono);
}

export function distanzaPuntoDaSegmentoCm(
  point: Punto2D,
  segmentStart: Punto2D,
  segmentEnd: Punto2D,
): number {
  const dx = segmentEnd.x_cm - segmentStart.x_cm;
  const dy = segmentEnd.y_cm - segmentStart.y_cm;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return Math.hypot(point.x_cm - segmentStart.x_cm, point.y_cm - segmentStart.y_cm);
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x_cm - segmentStart.x_cm) * dx +
        (point.y_cm - segmentStart.y_cm) * dy) /
        lengthSquared,
    ),
  );
  const projectedPoint = {
    x_cm: segmentStart.x_cm + t * dx,
    y_cm: segmentStart.y_cm + t * dy,
  };

  return Math.hypot(
    point.x_cm - projectedPoint.x_cm,
    point.y_cm - projectedPoint.y_cm,
  );
}

export function distanzaPuntoDaBordoPoligonoCm(
  point: Punto2D,
  poligono: PoligonoFalda,
): number {
  return poligono.reduce((minDistance, segmentStart, index) => {
    const segmentEnd = poligono[(index + 1) % poligono.length];
    return Math.min(
      minDistance,
      distanzaPuntoDaSegmentoCm(point, segmentStart, segmentEnd),
    );
  }, Number.POSITIVE_INFINITY);
}

export function creaPoligonoFaldaPlaceholder(surface: SurfaceData): PoligonoFalda {
  return creaPoligonoFalda(surface);
}

export function creaRettangoloPlaceholder(
  dimensions: RectangularSurfaceDimensions,
): PoligonoFalda {
  return creaRettangolo(dimensions);
}

export function creaTrapezioPlaceholder(
  dimensions: TrapezoidSurfaceDimensions,
): PoligonoFalda {
  return creaTrapezio(dimensions);
}

export function creaTriangoloPlaceholder(
  dimensions: TriangleSurfaceDimensions,
): PoligonoFalda {
  return creaTriangolo(dimensions);
}

export function creaQuadrilateroGuidatoPlaceholder(
  dimensions: GuidedQuadSurfaceDimensions,
): PoligonoFalda {
  return creaQuadrilateroGuidato(dimensions);
}

function isPuntoInterno(point: Punto2D, poligono: PoligonoFalda): boolean {
  let inside = false;

  for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
    const current = poligono[i];
    const previous = poligono[j];
    const intersects =
      current.y_cm > point.y_cm !== previous.y_cm > point.y_cm &&
      point.x_cm <
        ((previous.x_cm - current.x_cm) * (point.y_cm - current.y_cm)) /
          (previous.y_cm - current.y_cm) +
          current.x_cm;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function isPuntoSulBordo(point: Punto2D, poligono: PoligonoFalda): boolean {
  const tolerance = 0.000001;

  return poligono.some((segmentStart, index) => {
    const segmentEnd = poligono[(index + 1) % poligono.length];
    return (
      distanzaPuntoDaSegmentoCm(point, segmentStart, segmentEnd) <= tolerance
    );
  });
}
