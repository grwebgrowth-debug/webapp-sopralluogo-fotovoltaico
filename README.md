# Web App Sopralluogo Fotovoltaico — Base progetto Next.js

Questo pacchetto contiene la base progetto V1 per la web app di sopralluogo fotovoltaico.

## Cosa contiene
- struttura Next.js + TypeScript + Tailwind
- cartelle già allineate agli step funzionali
- tipi base
- placeholder per step, geometria, validazione e API
- documentazione di progetto nella cartella `docs-progetto/`

## Struttura principale
- `src/app`: layout globale e homepage
- `src/components/layout`: shell e intestazione applicativa
- `src/components/ui`: componenti UI condivisi
- `src/features/wizard`: shell, step e stato iniziale del wizard
- `src/features/cliente`: step dati cliente e sopralluogo
- `src/features/tetto`: step tipo di tetto
- `src/features/falde`: step falde
- `src/features/ostacoli`: step ostacoli
- `src/features/pannelli`: step pannello
- `src/features/revisione`: step revisione tecnica
- `src/lib/geometry`: moduli geometrici separati dalla UI
- `src/lib/validation`: validazioni condivise
- `src/lib/api`: placeholder per n8n
- `src/lib/formatters`: formattatori per misure e valori
- `src/types`: tipi condivisi e payload V1

## Cosa NON contiene ancora
- logica completa del wizard
- motore geometrico completo
- integrazione reale con n8n
- integrazione reale con Google Sheets

## Avvio locale
1. Apri la cartella del progetto
2. Installa le dipendenze:
   `npm install`
3. Avvia il progetto:
   `npm run dev`

## Ordine di lavoro consigliato
1. Leggi `docs-progetto/_LEGGIMI_PRIMA.md`
2. Usa `docs-progetto/08_PROMPT_MASTER_CODEX.md`
3. Lancia i prompt in `docs-progetto/prompts_codex/` nell’ordine numerico

## Vincoli fissi
- UI in italiano
- misure in centimetri
- niente database nella V1
- Google Sheet come catalogo pannelli
- n8n come orchestratore
- revisione finale obbligatoria prima dell’invio
