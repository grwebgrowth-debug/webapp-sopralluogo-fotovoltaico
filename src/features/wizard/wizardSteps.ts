import type { WizardStepId } from "@/types/domain";

export type WizardStepDefinition = {
  id: WizardStepId;
  numero: number;
  titolo: string;
  descrizione: string;
};

export const WIZARD_STEPS = [
  {
    id: "cliente",
    numero: 1,
    titolo: "Cliente",
    descrizione: "Dati essenziali del cliente e del sopralluogo.",
  },
  {
    id: "tetto",
    numero: 2,
    titolo: "Tetto e falde",
    descrizione: "Tipo di tetto, numero falde e misure principali.",
  },
  {
    id: "ostacoli",
    numero: 3,
    titolo: "Ostacoli",
    descrizione: "Ostacoli per falda con preview e controlli.",
  },
  {
    id: "pannello",
    numero: 4,
    titolo: "Pannello e obiettivo impianto",
    descrizione: "Modulo FV e target di potenza o numero moduli.",
  },
  {
    id: "layout_moduli",
    numero: 5,
    titolo: "Layout preliminare",
    descrizione: "Stima dei moduli inseribili sulle falde.",
  },
  {
    id: "componenti_impianto",
    numero: 6,
    titolo: "Componenti e note impianto",
    descrizione: "Inverter, cavi e note tecniche del sopralluogo.",
  },
  {
    id: "foto",
    numero: 7,
    titolo: "Foto",
    descrizione: "Immagini del sopralluogo e note rapide.",
  },
  {
    id: "revisione",
    numero: 8,
    titolo: "Revisione e invio",
    descrizione: "Controllo finale e invio del sopralluogo.",
  },
] as const satisfies readonly WizardStepDefinition[];
