import { useMemo } from 'react';
import { getPresets } from '../lib/presets.js';

export default function PresetBar({ onPick }) {
  const presets = useMemo(() => getPresets(), []);
  return (
    <div className="preset-bar">
      <span className="preset-bar-label">Try a preset</span>
      {presets.map((p) => (
        <button
          key={p.id}
          type="button"
          className="preset-button"
          onClick={() => onPick(p.form)}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
