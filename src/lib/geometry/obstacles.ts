export type OstacoloGeometrico = {
  kind: "rect" | "circle";
};

export function creaOstacoloRettangolarePlaceholder(): OstacoloGeometrico {
  return { kind: "rect" };
}

export function creaOstacoloCircolarePlaceholder(): OstacoloGeometrico {
  return { kind: "circle" };
}
