# Root Kit — Web App Sopralluogo Fotovoltaico V1

Questo pacchetto contiene i file base da mettere **direttamente nella root del progetto** prima di lavorare con Codex.

## Ordine consigliato
1. Leggi `01_SPECIFICA_V1_BLOCCATA.md`
2. Leggi `02_GLOSSARIO_UI.md`
3. Leggi `03_SPECIFICA_FUNZIONALE.md`
4. Leggi `04_MODELLO_DATI.md`
5. Leggi `05_REGOLE_GEOMETRICHE.md`
6. Leggi `06_PAYLOAD_N8N_V1.md`
7. Leggi `07_SCHEMA_GOOGLE_SHEET.md`
8. Usa `08_PROMPT_MASTER_CODEX.md` come base
9. Lancia i prompt dentro `prompts_codex/` nell’ordine numerico

## Obiettivo del kit
Dare a Codex:
- una specifica funzionale stabile
- un glossario UI coerente in italiano
- un contratto dati chiaro
- regole geometriche separate dalla UI
- prompt già pronti, con complessità sensata

## Vincoli fissi del progetto
- UI in italiano
- misure in centimetri
- niente database nella V1
- Google Sheet come catalogo pannelli
- n8n come orchestratore
- revisione finale obbligatoria prima dell’invio
- geometria deterministica, non affidata a un agente