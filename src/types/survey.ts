import type { ObstacleShape, ObstacleType, RoofType, SurfaceShape } from "./domain";

export type CustomerData = {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  province: string;
};

export type InspectionData = {
  date: string;
  technician: string;
  notes: string;
};

export type SurfaceDimensions =
  | { shape: "rectangular"; width_cm: number; height_cm: number }
  | { shape: "trapezoid"; base_bottom_cm: number; base_top_cm: number; height_cm: number }
  | { shape: "triangle"; base_cm: number; height_cm: number }
  | {
      shape: "guided_quad";
      base_bottom_cm: number;
      left_height_cm: number;
      right_height_cm: number;
      top_width_cm: number;
    };

export type ObstaclePositionStandard = {
  distance_from_base_cm: number;
  distance_from_left_cm: number;
};

export type ObstaclePositionTriangle = {
  distance_from_base_right_corner_cm: number;
  height_from_base_cm: number;
};

export type ObstacleData = {
  obstacle_id: string;
  type: ObstacleType;
  shape: ObstacleShape;
  safety_margin_cm: number;
} & (
  | {
      shape: "rect";
      width_cm: number;
      height_cm: number;
      position: ObstaclePositionStandard | ObstaclePositionTriangle;
    }
  | {
      shape: "circle";
      diameter_cm: number;
      position: ObstaclePositionStandard | ObstaclePositionTriangle;
    }
);

export type SurfaceData = {
  surface_id: string;
  name: string;
  shape: SurfaceShape;
  orientation: string;
  tilt_deg: number;
  edge_clearance_cm: number;
  notes: string;
  dimensions: SurfaceDimensions;
  obstacles: ObstacleData[];
};

export type PanelSelection = {
  brand: string;
  model: string;
};

export type SurveyData = {
  survey: {
    customer: CustomerData;
    inspection: InspectionData;
  };
  roof: {
    roof_type: RoofType;
    surfaces: SurfaceData[];
  };
  panel_selection: PanelSelection;
  meta: {
    source: string;
    schema_version: string;
  };
};
