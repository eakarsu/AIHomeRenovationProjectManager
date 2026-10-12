import React from 'react';

// Presets only change the form state. The native generation button remains separate.
export default function AIPromptPresets({ presets, value, onChange }) {
  return <div className="ai-preset-bar" aria-label="AI prompt examples">
    <strong>Fill example</strong>
    <div className="ai-actions">{presets.map(({ label, values }) =>
      <button key={label} type="button" className="btn btn-secondary btn-sm" onClick={() => onChange({ ...value, ...values })}>{label}</button>
    )}</div>
  </div>;
}
