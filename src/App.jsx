import { useMemo, useState } from 'react';
import RequestForm from './components/RequestForm.jsx';
import PresetBar from './components/PresetBar.jsx';
import OfferSummary from './components/OfferSummary.jsx';
import ResultPanel from './components/ResultPanel.jsx';
import { buildCanonical } from './lib/canonical.js';
import { toPaoreq, toPaores } from './lib/edifact.js';
import { toAirShoppingRQ } from './lib/ndc.js';
import { simulateAirShoppingRS } from './lib/simulate.js';
import { isoDateOffset } from './lib/presets.js';

const INITIAL_FORM = {
  origin: 'LHR',
  destination: 'JFK',
  date: isoDateOffset(30),
  passengers: 1,
  cabin: 'Economy'
};

export default function App() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [result, setResult] = useState(null);

  const passengerCount = useMemo(
    () => (result ? result.canonical.passengers.length : form.passengers),
    [result, form.passengers]
  );

  function runPipeline(currentForm) {
    const canonical = buildCanonical(currentForm);
    const paoreq = toPaoreq(canonical);
    const airShoppingRQ = toAirShoppingRQ(canonical);
    const sim = simulateAirShoppingRS(canonical);
    const paores = toPaores(canonical, sim);
    setResult({
      canonical,
      paoreq,
      airShoppingRQ,
      airShoppingRS: sim.xml,
      paores,
      offers: sim.offers
    });
  }

  function handlePreset(presetForm) {
    setForm(presetForm);
    runPipeline(presetForm);
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Rosetta Air</h1>
        <p className="app-subtitle">
          EDIFACT PAOREQ to NDC 21.3, translation demo
        </p>
      </header>

      <main className="app-main">
        <section className="controls">
          <RequestForm form={form} onChange={setForm} onSubmit={runPipeline} />
          <PresetBar onPick={handlePreset} />
        </section>

        {!result && (
          <p className="hint">
            Fill the form, or click a preset, then run the round trip. All four
            messages are generated in the browser, with no network calls.
          </p>
        )}

        {result && (
          <>
            <OfferSummary
              offers={result.offers}
              passengerCount={passengerCount}
            />

            <div className="panel-grid">
              <ResultPanel
                number={1}
                title="EDIFACT PAOREQ"
                text={result.paoreq}
                gridArea="p1"
              />
              <ResultPanel
                number={2}
                title="NDC 21.3 AirShoppingRQ"
                text={result.airShoppingRQ}
                gridArea="p2"
              />
              <ResultPanel
                number={3}
                title="NDC 21.3 AirShoppingRS"
                text={result.airShoppingRS}
                gridArea="p3"
              />
              <ResultPanel
                number={4}
                title="EDIFACT PAORES"
                text={result.paores}
                gridArea="p4"
              />
            </div>
          </>
        )}
      </main>

      <footer className="app-footer">
        <span>
          Rosetta Air, a local translation demo. No backend, no network calls.
        </span>
      </footer>
    </div>
  );
}
