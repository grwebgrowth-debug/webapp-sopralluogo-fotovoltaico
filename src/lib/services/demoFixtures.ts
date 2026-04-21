import type { InverterCatalogItem, PanelCatalogItem } from "@/types/panels";
import type { N8nSurveyPayload } from "@/types/survey";

export const DEMO_PANEL_CATALOG: PanelCatalogItem[] = [
  {
    brand: "SunPower",
    model: "Performance 7 435 W",
    width_cm: 113.4,
    height_cm: 172.2,
    power_w: 435,
    active: true,
    allowed_orientation: "entrambi",
    notes: "Modulo ad alta efficienza per tetti residenziali.",
  },
  {
    brand: "Jinko Solar",
    model: "Tiger Neo N-type 440 W",
    width_cm: 113.4,
    height_cm: 176.2,
    power_w: 440,
    active: true,
    allowed_orientation: "entrambi",
    notes: "Formato compatto con buona resa in condizioni reali.",
  },
  {
    brand: "LONGi",
    model: "Hi-MO 6 Explorer 430 W",
    width_cm: 113.4,
    height_cm: 172.2,
    power_w: 430,
    active: true,
    allowed_orientation: "entrambi",
    notes: "Modulo monofacciale per installazioni civili.",
  },
  {
    brand: "Trina Solar",
    model: "Vertex S+ 450 W",
    width_cm: 113.4,
    height_cm: 176.2,
    power_w: 450,
    active: true,
    allowed_orientation: "entrambi",
    notes: "Modulo vetro-vetro adatto a layout residenziali.",
  },
  {
    brand: "REC",
    model: "Alpha Pure-RX 470 W",
    width_cm: 120.5,
    height_cm: 172.8,
    power_w: 470,
    active: true,
    allowed_orientation: "entrambi",
    notes: "Modulo premium per massimizzare la potenza disponibile.",
  },
  {
    brand: "Canadian Solar",
    model: "TOPHiKu6 455 W",
    width_cm: 113.4,
    height_cm: 190.3,
    power_w: 455,
    active: true,
    allowed_orientation: "entrambi",
    notes: "Formato leggermente piu alto, utile su falde ampie.",
  },
];

export const DEMO_INVERTER_OPTIONS: InverterCatalogItem[] = [
  {
    componente_id: "inv-demo-fronius-6kw",
    descrizione: "Fronius Primo 6.0-1",
    potenza_nominale_kw: 6,
    brand: "Fronius",
    model: "Primo 6.0-1",
  },
  {
    componente_id: "inv-demo-solaredge-8kw",
    descrizione: "SolarEdge SE8K",
    potenza_nominale_kw: 8,
    brand: "SolarEdge",
    model: "SE8K",
  },
  {
    componente_id: "altro",
    descrizione: "Altro",
    potenza_nominale_kw: null,
  },
];

export function createDemoSurveyId(payload: N8nSurveyPayload): string {
  const clientCode = payload.survey.customer.last_name
    .trim()
    .slice(0, 3)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  return `SOPR-DEMO-${clientCode || "0001"}`;
}

export function createDemoQuoteId(payload: N8nSurveyPayload): string {
  const panelCode = payload.panel_selection.brand
    .trim()
    .slice(0, 3)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  return `PREV-DEMO-${panelCode || "0001"}`;
}
