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

export type InverterCatalogItem = {
  componente_id: string;
  descrizione: string;
  potenza_nominale_kw: number | null;
  brand?: string;
  model?: string;
  notes?: string;
};

export type CatalogoConfigurazioneItem = {
  panel_catalog: PanelCatalogItem[];
  inverter_options: InverterCatalogItem[];
};

export type PanelTechnicalDataSource = "catalogo" | "manuale";

export type PanelTechnicalData = {
  width_cm: number;
  height_cm: number;
  power_w: number;
  source: PanelTechnicalDataSource | null;
};
