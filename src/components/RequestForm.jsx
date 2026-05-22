import { useMemo } from 'react';
import { AIRPORTS, CABIN_NAMES } from '../lib/canonical.js';

function pad2(n) {
  return String(n).padStart(2, '0');
}

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export default function RequestForm({ form, onChange, onSubmit }) {
  const minDate = useMemo(todayIso, []);
  const sameOd = form.origin === form.destination;
  const canSubmit = !sameOd;

  function setField(name, value) {
    onChange({ ...form, [name]: value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(form);
  }

  return (
    <form className="request-form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="origin">Origin</label>
        <select
          id="origin"
          value={form.origin}
          onChange={(e) => setField('origin', e.target.value)}
        >
          {AIRPORTS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="destination">Destination</label>
        <select
          id="destination"
          value={form.destination}
          onChange={(e) => setField('destination', e.target.value)}
        >
          {AIRPORTS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="date">Departure date</label>
        <input
          id="date"
          type="date"
          min={minDate}
          value={form.date}
          onChange={(e) => setField('date', e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="passengers">Passengers</label>
        <input
          id="passengers"
          type="number"
          min={1}
          max={9}
          value={form.passengers}
          onChange={(e) => {
            const n = Math.max(1, Math.min(9, Number(e.target.value) || 1));
            setField('passengers', n);
          }}
        />
      </div>

      <div className="field">
        <label htmlFor="cabin">Cabin</label>
        <select
          id="cabin"
          value={form.cabin}
          onChange={(e) => setField('cabin', e.target.value)}
        >
          {CABIN_NAMES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="field field-submit">
        <button type="submit" className="primary" disabled={!canSubmit}>
          Translate and simulate
        </button>
        {sameOd && (
          <div className="form-error">Origin and destination must differ.</div>
        )}
      </div>
    </form>
  );
}
