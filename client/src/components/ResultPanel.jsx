import { useState } from 'react';
import { INTENT_LABELS, LANGUAGE_LABELS } from '../constants';
import { buildWhatsAppLink } from '../utils/format';
import Badge from './Badge';
import CopyButton from './CopyButton';
import QuoteTable from './QuoteTable';

const SOURCE_NOTE = {
  ai: 'AI-written, numbers verified',
  template: 'Template reply (safe fallback)',
  rules: 'Rule-based detection',
};

// The agent can edit the reply before copying, so the text lives in local state.
export default function ResultPanel({ result, phone }) {
  const [reply, setReply] = useState(result.reply);
  const whatsAppLink = buildWhatsAppLink(phone, reply);

  return (
    <section className="space-y-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-orange-100 text-orange-800">{INTENT_LABELS[result.intent]}</Badge>
        <Badge className="bg-sky-100 text-sky-800">{LANGUAGE_LABELS[result.language]}</Badge>
        <Badge>Detected by: {result.extractionSource === 'ai' ? 'AI' : 'rules'}</Badge>
        <Badge>{SOURCE_NOTE[result.replySource]}</Badge>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-stone-800">Matching products and price</h3>
        <QuoteTable quote={result.quote} />
      </div>

      <div>
        <label htmlFor="reply" className="mb-2 block text-sm font-semibold text-stone-800">
          Ready-to-send reply
        </label>
        <textarea
          id="reply"
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          rows={Math.min(14, Math.max(6, reply.split('\n').length + 1))}
          className="w-full rounded-xl border border-stone-300 p-3 text-sm leading-relaxed focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <CopyButton text={reply} />
          {whatsAppLink && (
            <a
              href={whatsAppLink}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Open in WhatsApp
            </a>
          )}
          <span className="text-xs text-stone-500">
            {result.leadId ? 'Saved as a lead ✓' : 'Not saved: database is not connected'}
          </span>
        </div>
      </div>
    </section>
  );
}
