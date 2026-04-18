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
    titolo: "Dati cliente e sopralluogo",
    descrizione: "Raccolta dati anagrafici, indirizzo e informazioni base del rilievo.",
  },
  {
    id: "tetto",
    numero: 2,
    titolo: "Tipo di tetto",
    descrizione: "Scelta del tipo di tetto e preparazione automatica delle falde.",
  },
  {
    id: "falde",
    numero: 3,
    titolo: "Falde",
    descrizione: "Compilazione forma, orientamento e quote principali di ogni falda.",
  },
  {
    id: "ostacoli",
    numero: 4,
    titolo: "Ostacoli",
    descrizione: "Inserimento degli ostacoli con preview e controlli geometrici.",
  },
  {
    id: "pannello",
    numero: 5,
    titolo: "Pannello",
    descrizione:
      "Selezione marca e modello dal catalogo Google Sheet tramite n8n.",
  },
  {
    id: "layout_moduli",
    numero: 6,
    titolo: "Layout moduli preliminare",
    descrizione: "Calcolo tecnico preliminare dei moduli inseribili sulle falde.",
  },
  {
    id: "foto",
    numero: 7,
    titolo: "Foto sopralluogo",
    descrizione: "Raccolta immagini e note fotografiche del rilievo.",
  },
  {
    id: "revisione",
    numero: 8,
    titolo: "Revisione tecnica",
    descrizione: "Controllo completo dei dati prima della conferma finale.",
  },
  {
    id: "invio",
    numero: 9,
    titolo: "Invio a n8n",
    descrizione: "Invio del payload finale per elaborazione e salvataggio.",
  },
] as const satisfies readonly WizardStepDefinition[];
