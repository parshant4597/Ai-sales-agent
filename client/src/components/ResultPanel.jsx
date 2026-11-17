import { useState } from 'react';
import { INTENT_LABELS, LANGUAGE_LABELS } from '../constants';
import { buildWhatsAppLink } from '../utils/format';
import Badge from './Badge';
import ChatPreview from './ChatPreview';
import CopyButton from './CopyButton';
import CustomerHistory from './CustomerHistory';
import { CheckIcon, EditIcon, SendIcon } from './icons';
import QuoteTable from './QuoteTable';

const SOURCE_NOTE = {
  ai: 'AI-written, numbers verified',
  template: 'Safe template reply',
};

// The agent can edit the reply before copying, so the text lives in local state.
export default function ResultPanel({ result, context }) {
  const [reply, setReply] = useState(result.reply);
  const [editing, setEditing] = useState(false);
  const whatsAppLink = buildWhatsAppLink(context.phone, reply);

  return (
    <section className="animate-fade-up space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-orange-100 text-orange-800">{INTENT_LABELS[result.intent]}</Badge>
        <Badge className="bg-sky-100 text-sky-800">{LANGUAGE_LABELS[result.language]}</Badge>
        <Badge>{result.extractionSource === 'ai' ? 'Understood by AI' : 'Understood by rules'}</Badge>
        <Badge className={result.replySource === 'ai' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-700'}>{SOURCE_NOTE[result.replySource]}</Badge>
      </div>

      <ChatPreview message={context.message} reply={reply} contactName={context.customerName} label={LANGUAGE_LABELS[result.language]} />

      {editing && (
        <textarea
          aria-label="Edit the reply"
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          rows={Math.min(14, Math.max(6, reply.split('\n').length + 1))}
          className="field leading-relaxed"
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <CopyButton text={reply} />
        {whatsAppLink && (
          <a href={whatsAppLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-[0.9rem] bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/25 transition hover:bg-emerald-700">
            <SendIcon size={16} /> Open in WhatsApp
          </a>
        )}
        <button type="button" onClick={() => setEditing(!editing)} className="btn-secondary flex items-center gap-2 px-4 py-2.5 text-sm">
          <EditIcon size={16} /> {editing ? 'Done editing' : 'Edit reply'}
        </button>
        <span className={`ml-auto flex items-center gap-1 text-xs ${result.leadId ? 'text-emerald-700' : 'text-amber-700'}`}>
          {result.leadId ? (
            <>
              <CheckIcon size={14} /> Saved as a lead
            </>
          ) : (
            'Not saved: database is not connected'
          )}
        </span>
      </div>

      {result.customer && <CustomerHistory customer={result.customer} />}

      <div className="surface p-5">
        <h3 className="mb-3 text-sm font-semibold text-stone-900">Matching products and price</h3>
        <QuoteTable quote={result.quote} />
      </div>
    </section>
  );
}
