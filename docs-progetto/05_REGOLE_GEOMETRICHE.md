# Regole geometriche

## Unità
Tutte le misure sono in centimetri.

## Falda rettangolare
- width_cm
- height_cm
Poligono: rettangolo pieno.

## Falda trapezoidale
- base_bottom_cm
- base_top_cm
- height_cm
La base inferiore è quella di riferimento per la quota “Distanza dalla base”.

## Falda triangolare
- base_cm
- height_cm
La base è il lato inferiore.
Per gli ostacoli, i riferimenti utente sono:
- Distanza dall’angolo destro della base
- Altezza dalla base (H)

## Falda quadrilatero guidato
- base_bottom_cm
- left_height_cm
- right_height_cm
- top_width_cm
Serve a coprire casi pratici senza introdurre poligoni liberi.

## Ostacoli rettangolari
Le quote posizione si riferiscono:
- al vertice in basso a sinistra per rettangolo/trapezio/guided_quad
- al vertice in basso a destra per triangolo

## Ostacoli circolari
Le quote posizione si riferiscono al centro.

## Margine di sicurezza
Il margine allarga virtualmente l’ostacolo prima della validazione.
Un ostacolo è valido solo se ostacolo + margine restano completamente dentro la falda.

## Messaggi errore consigliati
- L’ostacolo esce dalla falda
- La distanza dalla base è troppo grande
- La distanza dal lato sinistro è troppo grande
- La distanza dall’angolo destro della base è troppo grande
- L’altezza dalla base (H) supera la zona utile
- Con queste dimensioni e questo margine, l’ostacolo non rientra nella falda