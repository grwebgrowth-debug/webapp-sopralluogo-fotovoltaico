import type { PanelTechnicalData } from "./panels";

export type ModuleOrientation = "verticale" | "orizzontale";

export type PositionedModule = {
  module_id: string;
  surface_id: string;
  x_cm: number;
  y_cm: number;
  width_cm: number;
  height_cm: number;
  orientation: ModuleOrientation;
};

export type SurfaceModuleLayout = {
  surface_id: string;
  surface_name: string;
  selected_orientation: ModuleOrientation;
  module_count: number;
  modules: PositionedModule[];
  useful_area_cm2: number;
  occupied_area_cm2: number;
  total_power_w: number;
  messages: string[];
};

export type PreliminaryModuleLayout = {
  calculated_at: string;
  panel: PanelTechnicalData;
  surfaces: SurfaceModuleLayout[];
  total_modules: number;
  total_power_w: number;
  messages: string[];
};
