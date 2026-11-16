import { useState } from 'react';
import { addLeadNote, updateLeadStatus } from '../api/client';
import { INTENT_LABELS, LANGUAGE_LABELS, STATUSES } from '../constants';
import { formatDateTime, formatInr } from '../utils/format';
import Badge from './Badge';
import CopyButton from './CopyButton';

const statusClasses = (value) => STATUSES.find((status) => status.value === value)?.classes;

export default function LeadCard({ lead, onChange }) {
  const [open, setOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Runs an API call, then hands the updated lead to the parent list.
  async function run(action) {
    setBusy(true);
    setError('');
    try {
      onChange(await action());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleAddNote(event) {
    event.preventDefault();
    if (!noteText.trim()) return;
    await run(() => addLeadNote(lead._id, noteText));
    setNoteText('');
  }

  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-medium text-stone-900">{lead.message}</p>
          <p className="mt-1 text-xs text-stone-500">
            {formatDateTime(lead.createdAt)}
            {lead.customerName && ` · ${lead.customerName}`}
            {lead.phone && ` · ${lead.phone}`}
          </p>
        </div>
        <select
          value={lead.status}
          disabled={busy}
          onChange={(event) => run(() => updateLeadStatus(lead._id, event.target.value))}
          aria-label="Lead status"
          className={`rounded-lg border-0 px-3 py-1.5 text-sm font-medium ${statusClasses(lead.status)}`}
        >
          {STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Badge className="bg-orange-100 text-orange-800">{INTENT_LABELS[lead.intent]}</Badge>
        <Badge className="bg-sky-100 text-sky-800">{LANGUAGE_LABELS[lead.language]}</Badge>
        {lead.quoteLines.map((line) => (
          <Badge key={line.productId}>
            {line.name}
            {line.quantity !== null && ` × ${line.quantity}`}
          </Badge>
        ))}
        {lead.quoteTotal !== null && <Badge className="bg-emerald-100 text-emerald-800">{formatInr(lead.quoteTotal)}</Badge>}
      </div>

      <button type="button" onClick={() => setOpen(!open)} className="mt-3 text-xs font-medium text-orange-700 hover:underline">
        {open ? 'Hide details' : `Reply & notes (${lead.notes.length})`}
      </button>

      {open && (
        <div className="mt-3 space-y-4 border-t border-stone-100 pt-3">
          <div>
            <p className="whitespace-pre-wrap rounded-xl bg-stone-50 p-3 text-sm text-stone-800">{lead.reply}</p>
            <CopyButton text={lead.reply} className="mt-2" />
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-stone-800">Notes</h4>
            <ul className="mb-2 space-y-1">
              {lead.notes.length === 0 && <li className="text-xs text-stone-500">No notes yet.</li>}
              {lead.notes.map((note) => (
                <li key={note.createdAt} className="text-sm text-stone-700">
                  <span className="text-xs text-stone-400">{formatDateTime(note.createdAt)} </span>
                  {note.text}
                </li>
              ))}
            </ul>
            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                value={noteText}
                onChange={(event) => setNoteText(event.target.value)}
                maxLength={500}
                placeholder="Add a note (e.g. called, wants 25 ratti)"
                className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={busy || !noteText.trim()}
                className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
              >
                Add
              </button>
            </form>
          </div>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </article>
  );
}
