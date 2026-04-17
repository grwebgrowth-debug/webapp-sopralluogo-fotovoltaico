# Schema Google Sheet

## Foglio 1 — Catalogo Pannelli
Nome foglio: `Catalogo Pannelli`

Colonne:
- Marca
- Modello
- Larghezza pannello (cm)
- Altezza pannello (cm)
- Potenza pannello (W)
- Attivo
- Orientamento consentito
- Note

## Foglio 2 — Sopralluoghi
Nome foglio: `Sopralluoghi`

Colonne:
- ID sopralluogo
- Data sopralluogo
- Tecnico
- Nome cliente
- Cognome cliente
- Indirizzo
- Comune
- Provincia
- Tipo di tetto
- Marca pannello
- Modello pannello
- Numero falde
- JSON falde
- JSON ostacoli
- JSON riepilogo
- Stato preventivo

## Regola architetturale
La web app non parla direttamente a Google Sheets.
La web app parla a n8n.
n8n legge e scrive Google Sheets.