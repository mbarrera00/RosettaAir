import { useState } from 'react';

export default function ResultPanel({ number, title, text, gridArea }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for environments without the async clipboard API.
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'absolute';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="result-panel" style={gridArea ? { gridArea } : undefined}>
      <header className="result-panel-header">
        <span className="result-panel-badge">{number}</span>
        <h3 className="result-panel-title">{title}</h3>
        <button
          type="button"
          className="result-panel-copy"
          onClick={handleCopy}
          aria-label={`Copy ${title}`}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </header>
      <pre className="result-panel-body">{text}</pre>
    </section>
  );
}
