import { STATUSES } from '../constants';
import { formatDateTime, formatInr, getInitials } from '../utils/format';
import Badge from './Badge';

// Shown when the phone number has messaged before, so the agent has context before replying.
export default function CustomerHistory({ customer }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-4 ring-1 ring-amber-200">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-600 text-sm font-semibold text-white">
          {getInitials(customer.name || 'Customer')}
        </span>
        <div>
          <p className="text-sm font-semibold text-amber-950">Returning customer{customer.name && `: ${customer.name}`}</p>
          <p className="text-xs text-amber-800">
            {customer.enquiries} earlier {customer.enquiries === 1 ? 'enquiry' : 'enquiries'}
          </p>
        </div>
      </div>
      <ul className="mt-3 space-y-2">
        {customer.recent.map((lead) => {
          const status = STATUSES.find((item) => item.value === lead.status);
          return (
            <li key={lead.id} className="rounded-xl bg-white/70 px-3 py-2 text-sm text-stone-800">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-stone-500">{formatDateTime(lead.createdAt)}</span>
                {status && <Badge className={status.classes}>{status.label}</Badge>}
                {lead.quoteTotal !== null && <span className="text-xs font-semibold">{formatInr(lead.quoteTotal)}</span>}
              </div>
              <p className="mt-0.5 break-words">{lead.message}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
