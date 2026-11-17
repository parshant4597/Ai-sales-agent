import { useState } from 'react';
import { addLeadNote, updateLeadStatus } from '../api/client';
import { INTENT_LABELS, LANGUAGE_LABELS, STATUSES } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { formatDateTime, formatInr, getInitials } from '../utils/format';
import Badge from './Badge';
import CopyButton from './CopyButton';

const findStatus = (value) => STATUSES.find((status) => status.value === value);

export default function LeadCard({ lead, onChange }) {
  const [open, setOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const status = findStatus(lead.status);
  const isAdmin = useAuth().user.role === 'admin';

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
    <article className="surface relative overflow-hidden p-4 pl-5 transition hover:-translate-y-0.5 hover:shadow-lg">
      {/* A coloured edge shows the status at a glance while scrolling */}
      <span className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: status?.color }} aria-hidden="true" />

      <div className="flex flex-wrap items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-100 text-sm font-semibold text-stone-600">
          {getInitials(lead.customerName || lead.phone || '#')}
        </span>

        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-medium text-stone-900">{lead.message}</p>
          <p className="mt-1 text-xs text-stone-500">
            {formatDateTime(lead.createdAt)}
            {lead.customerName && ` · ${lead.customerName}`}
            {lead.phone && ` · ${lead.phone}`}
            {isAdmin && <span className="font-medium text-stone-600"> · handled by {lead.createdByName || 'nobody (older lead)'}</span>}
          </p>
        </div>

        <select
          value={lead.status}
          disabled={busy}
          onChange={(event) => run(() => updateLeadStatus(lead._id, event.target.value))}
          aria-label="Lead status"
          className={`cursor-pointer rounded-xl border-0 px-3 py-2 text-sm font-semibold ${status?.classes}`}
        >
          {STATUSES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 pl-13">
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

      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="mt-3 pl-13 text-xs font-semibold text-orange-700 hover:underline">
        {open ? 'Hide details ▴' : `Reply & notes (${lead.notes.length}) ▾`}
      </button>

      {open && (
        <div className="mt-3 space-y-4 border-t border-stone-100 pt-3 pl-13">
          <div>
            <p className="whitespace-pre-wrap rounded-xl bg-[#d9fdd3]/60 p-3 text-sm text-stone-800 ring-1 ring-emerald-100">{lead.reply}</p>
            <CopyButton text={lead.reply} className="mt-2 !px-3 !py-2 !text-xs" />
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-stone-800">Notes</h4>
            <ul className="mb-3 space-y-1.5">
              {lead.notes.length === 0 && <li className="text-xs text-stone-500">No notes yet.</li>}
              {lead.notes.map((note) => (
                <li key={note.createdAt} className="rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-700">
                  <span className="mr-2 text-xs text-stone-400">{formatDateTime(note.createdAt)}</span>
                  {note.text}
                </li>
              ))}
            </ul>
            <form onSubmit={handleAddNote} className="flex gap-2">
              <input value={noteText} onChange={(event) => setNoteText(event.target.value)} maxLength={500} placeholder="Add a note (e.g. called, wants 25 ratti)" className="field" />
              <button type="submit" disabled={busy || !noteText.trim()} className="btn-primary shrink-0 px-4 text-sm">
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
