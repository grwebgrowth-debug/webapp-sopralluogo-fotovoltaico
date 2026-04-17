import type { PanelAllowedOrientation } from "./domain";

export type PanelCatalogItem = {
  brand: string;
  model: string;
  width_cm: number;
  height_cm: number;
  power_w: number;
  active: boolean;
  allowed_orientation: PanelAllowedOrientation;
  notes: string;
};
