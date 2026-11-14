# Egg o'clock

Samle eggbestillingen til frokosten på én telefon. Velg kokt eller stekt, hvordan egget skal være, hvor mange og til hvem. Bestillingen viser hvem som skal ha hva, og en kokeplan som sier når hvert egg skal i kjelen så alle blir ferdige samtidig.

Bygget ut fra eggbestillingen i h53, med samme oppsett som godt-oclock (Vite+, React, PWA).

## Flyt

1. **Kokt eller stekt?** Ett trykk, går rett videre.
2. **Hvordan?** Kokt: bløtkokt / medium / hardkokt med koketid. Stekt: én side eller begge, hel eller knust plomme, med forhåndsvisning.
3. **Hvor mange, og til hvem?** Antall og navn (valgfritt, tidligere navn som snarveier).

Bestillingen har +/- per linje, angre etter at du legger til eller tømmer, og deling via delingsmenyen (eller kopiering). Alt lagres i `localStorage`. Tilbake-knappen og tilbake-sveip på telefonen følger stegene.

## Utvikling

```sh
pnpm install
pnpm dev          # utviklingsserver
pnpm exec vp check
pnpm exec vp test
pnpm build        # produksjonsbygg til dist/ (inkl. sw.js for offline)
```

## Installer på telefonen

Åpne siden i Safari → Del → **Legg til på Hjem-skjerm**. Appen åpnes i fullskjerm og fungerer uten nett.
