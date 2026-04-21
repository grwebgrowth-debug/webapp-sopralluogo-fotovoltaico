import type { PanelAllowedOrientation } from "./domain";

export type PanelCatalogItem = {
  panel_id?: string;
  item_code?: string;
  brand: string;
  model: string;
  width_cm: number;
  height_cm: number;
  power_w: number;
  active: boolean;
  allowed_orientation: PanelAllowedOrientation;
  notes: string;
  datasheet_url?: string;
};

export type InverterCatalogItem = {
  componente_id: string;
  codice_articolo?: string;
  descrizione: string;
  sottocategoria?: string;
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
