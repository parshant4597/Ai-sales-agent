import { useState } from 'react';

export default function CopyButton({ text, className = '' }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt('Copy the reply:', text); // clipboard blocked (e.g. insecure context)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50 ${className}`}
    >
      {copied ? 'Copied ✓' : 'Copy reply'}
    </button>
  );
}
