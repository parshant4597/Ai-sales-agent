import { useState } from 'react';
import { CheckIcon, CopyIcon } from './icons';

export default function CopyButton({ text, className = '', label = 'Copy reply' }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt('Copy the reply:', text); // clipboard blocked (e.g. insecure context)
    }
  }

  return (
    <button type="button" onClick={handleCopy} className={`btn-primary flex items-center gap-2 px-4 py-2.5 text-sm ${className}`}>
      {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
      {copied ? 'Copied' : label}
    </button>
  );
}
