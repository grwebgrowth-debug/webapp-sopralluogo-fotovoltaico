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

export type RectangularSurfaceDimensions = {
  width_cm: number;
  height_cm: number;
};

export type TrapezoidSurfaceDimensions = {
  base_bottom_cm: number;
  base_top_cm: number;
  height_cm: number;
};

export type TriangleSurfaceDimensions = {
  base_cm: number;
  height_cm: number;
};

export type GuidedQuadSurfaceDimensions = {
  base_bottom_cm: number;
  left_height_cm: number;
  right_height_cm: number;
  top_width_cm: number;
};

export type SurfaceDimensions =
  | RectangularSurfaceDimensions
  | TrapezoidSurfaceDimensions
  | TriangleSurfaceDimensions
  | GuidedQuadSurfaceDimensions;

export type ObstaclePositionStandard = {
  distance_from_base_cm: number;
  distance_from_left_cm: number;
};

export type ObstaclePositionTriangle = {
  distance_from_base_right_corner_cm: number;
  height_from_base_cm: number;
};

export type ObstaclePosition =
  | ObstaclePositionStandard
  | ObstaclePositionTriangle;

export type RectObstacleDimensions = {
  width_cm: number;
  height_cm: number;
};

export type CircleObstacleDimensions = {
  diameter_cm: number;
};

type BaseObstacleData = {
  obstacle_id: string;
  type: ObstacleType;
  shape: ObstacleShape;
  safety_margin_cm: number;
  position: ObstaclePosition;
};

export type ObstacleData = BaseObstacleData &
  (
    | {
        shape: "rect";
        dimensions: RectObstacleDimensions;
      }
    | {
        shape: "circle";
        dimensions: CircleObstacleDimensions;
      }
  );

type BaseSurfaceData = {
  surface_id: string;
  name: string;
  shape: SurfaceShape;
  orientation: string;
  tilt_deg: number;
  edge_clearance_cm: number;
  notes: string;
  obstacles: ObstacleData[];
};

export type SurfaceData =
  | (BaseSurfaceData & {
      shape: "rectangular";
      dimensions: RectangularSurfaceDimensions;
    })
  | (BaseSurfaceData & {
      shape: "trapezoid";
      dimensions: TrapezoidSurfaceDimensions;
    })
  | (BaseSurfaceData & {
      shape: "triangle";
      dimensions: TriangleSurfaceDimensions;
    })
  | (BaseSurfaceData & {
      shape: "guided_quad";
      dimensions: GuidedQuadSurfaceDimensions;
    });

export type PanelSelection = {
  brand: string;
  model: string;
};

export type SurveyMeta = {
  source: "webapp_sopralluogo_fotovoltaico_v1";
  schema_version: "1.0";
};

export type RoofData = {
  roof_type: RoofType;
  surfaces: SurfaceData[];
};

export type SopralluogoData = {
  id: string;
  customer: CustomerData;
  inspection: InspectionData;
  roof: RoofData;
  panel_selection: PanelSelection;
  meta: SurveyMeta;
};

export type N8nSurveyPayload = {
  survey: {
    customer: CustomerData;
    inspection: InspectionData;
  };
  roof: RoofData;
  panel_selection: PanelSelection;
  meta: SurveyMeta;
};

export type SurveyData = N8nSurveyPayload;
