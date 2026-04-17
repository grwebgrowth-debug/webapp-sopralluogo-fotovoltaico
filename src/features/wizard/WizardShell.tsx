"use client";

import { StepCard } from "@/components/ui/StepCard";

const STEP_LIST = [
  {
    numero: 1,
    titolo: "Dati cliente e sopralluogo",
    descrizione: "Raccolta dati anagrafici, indirizzo e informazioni base del rilievo.",
  },
  {
    numero: 2,
    titolo: "Tipo di tetto",
    descrizione: "Scelta del tipo di tetto e preparazione automatica delle falde.",
  },
  {
    numero: 3,
    titolo: "Falde",
    descrizione: "Compilazione forma, orientamento e quote principali di ogni falda.",
  },
  {
    numero: 4,
    titolo: "Ostacoli",
    descrizione: "Inserimento preciso degli ostacoli con preview e controlli geometrici.",
  },
  {
    numero: 5,
    titolo: "Pannello",
    descrizione: "Selezione marca e modello dal catalogo recuperato tramite n8n.",
  },
  {
    numero: 6,
    titolo: "Revisione tecnica",
    descrizione: "Controllo completo dei dati con possibilità di tornare indietro senza perdere nulla.",
  },
  {
    numero: 7,
    titolo: "Invio a n8n",
    descrizione: "Invio del payload finale per elaborazione, salvataggio e preventivo.",
  },
];

export function WizardShell() {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6">
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          Stato attuale
        </p>
        <h2 className="mb-3 text-2xl font-semibold">
          Base progetto pronta per Codex
        </h2>
        <p className="max-w-3xl text-sm leading-7 text-[var(--muted)]">
          Questo progetto contiene solo la base strutturale: architettura, cartelle,
          placeholder e documentazione già allineata. La logica vera del wizard, della
          geometria e dell’integrazione n8n verrà implementata nei passaggi successivi.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {STEP_LIST.map((step) => (
            <StepCard
              key={step.numero}
              numero={step.numero}
              titolo={step.titolo}
              descrizione={step.descrizione}
            />
          ))}
        </div>
      </div>

      <aside className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6">
        <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
          Vincoli fissi
        </p>
        <ul className="space-y-3 text-sm leading-6 text-[var(--muted)]">
          <li>UI interamente in italiano</li>
          <li>Misure in centimetri</li>
          <li>Nessun database nella V1</li>
          <li>Google Sheet come catalogo pannelli</li>
          <li>n8n come orchestratore</li>
          <li>Revisione finale obbligatoria prima dell’invio</li>
          <li>Geometria deterministica, non affidata a un agente</li>
        </ul>

        <div className="mt-6 rounded-2xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--muted)]">
          Prossimo passo consigliato: lanciare il prompt 01 di Codex dopo aver letto i documenti nella cartella <code>docs-progetto</code>.
        </div>
      </aside>
    </section>
  );
}
