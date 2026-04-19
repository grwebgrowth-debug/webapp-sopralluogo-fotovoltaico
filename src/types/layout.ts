import type { PanelTechnicalData } from "./panels";

export type ModuleOrientation = "verticale" | "orizzontale";
export type LayoutCalculationMode = "max_modules" | "target_power";

export type LayoutTargetConfig = {
  mode: LayoutCalculationMode;
  target_module_count: number | null;
  target_power_w: number | null;
};

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
  layout_mode: LayoutCalculationMode;
  panel: PanelTechnicalData;
  surfaces: SurfaceModuleLayout[];
  target_module_count: number | null;
  target_power_w: number | null;
  available_modules: number;
  available_power_w: number;
  target_reached: boolean | null;
  total_modules: number;
  total_power_w: number;
  messages: string[];
};
