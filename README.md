# Rosetta Air

A small React and Vite single page web application that demonstrates translating a legacy airline EDIFACT shopping request into a modern IATA NDC 21.3 request, simulating the airline response, and translating it back to EDIFACT. The whole round trip runs in the browser. There is no backend, no API call, no database, and no credentials.

## Run

```bash
npm install
npm run dev
```

Open the URL that Vite prints, usually `http://localhost:5173`.

## What it does

The four messages of the round trip are:

1. EDIFACT PAOREQ, the legacy request.
2. NDC 21.3 AirShoppingRQ, the modern request, translated from message 1.
3. NDC 21.3 AirShoppingRS, the modern response, simulated locally.
4. EDIFACT PAORES, the legacy response, translated from message 3.

Fill the form or click a preset, then click `Translate and simulate` to see all four messages plus a friendly list of offers.

## Project layout

All translation and simulation logic lives in `src/lib` as pure functions, with no React and no DOM access. Components only call lib functions and render. This separation is what would let the simulation later be swapped for a real airline call.

```
src/
  main.jsx
  App.jsx
  styles.css
  components/
    RequestForm.jsx
    PresetBar.jsx
    OfferSummary.jsx
    ResultPanel.jsx
  lib/
    canonical.js
    edifact.js
    ndc.js
    simulate.js
    presets.js
```
