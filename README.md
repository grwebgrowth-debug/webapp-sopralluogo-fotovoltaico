# Web App Sopralluogo Fotovoltaico — Base progetto Next.js

Questo pacchetto contiene una base progetto reale, ordinata e pronta da usare con Codex.

## Cosa contiene
- struttura Next.js + TypeScript + Tailwind
- cartelle già allineate al progetto
- tipi base
- placeholder per step, geometria, validazione e API
- documentazione di progetto nella cartella `docs-progetto/`

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
