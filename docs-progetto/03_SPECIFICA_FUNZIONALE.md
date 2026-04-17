# Specifica funzionale

## Step 1 — Dati cliente e sopralluogo
Raccoglie i dati minimi del lavoro. I campi obbligatori sono:
- Nome cliente
- Cognome cliente
- Indirizzo del sopralluogo
- Data sopralluogo

## Step 2 — Tipo di tetto
Tipi supportati:
- Falda unica
- Due falde
- Due falde asimmetriche
- Quattro falde / padiglione
- Tetto a L
- Shed
- Più falde personalizzato

L’app prepara automaticamente le falde da compilare.

## Step 3 — Falde
Per ogni falda:
- nome
- forma
- orientamento
- inclinazione
- quote principali
- note

Preview della falda in tempo reale a destra.

## Step 4 — Ostacoli
Per ogni falda:
- elenco ostacoli
- aggiunta / modifica / eliminazione
- preview aggiornata
- validazione geometrica

## Step 5 — Pannello
L’utente seleziona:
- Marca pannello
- Modello pannello

I dati completi del pannello arrivano da n8n / Google Sheet.

## Step 6 — Revisione tecnica
Il tecnico vede:
- dati cliente
- tipo tetto
- falde
- ostacoli
- pannello selezionato
- riepilogo visivo

Ogni blocco ha un pulsante “Modifica”.
Tornando indietro, i dati già inseriti devono restare compilati.

## Step 7 — Invio
L’app invia il JSON finale a n8n e mostra:
- stato invio
- esito
- eventuale errore

## Regole UX
- Layout a due colonne: form a sinistra, preview a destra
- Messaggi errore in italiano
- Nessuna perdita dati tornando indietro
- Dati numerici in centimetri