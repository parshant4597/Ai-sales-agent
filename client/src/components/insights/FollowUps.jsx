import { STATUSES } from '../../constants';
import { buildWhatsAppLink, formatInr } from '../../utils/format';
import Badge from '../Badge';

const DAY_MS = 24 * 60 * 60 * 1000;

const ageInDays = (isoString) => Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / DAY_MS));

function followUpText(lead) {
  const name = lead.customerName ? ` ${lead.customerName} ji` : '';
  return `Namaste${name}! Following up on your enquiry: "${lead.message}". Shall we go ahead?`;
}

// Leads that went quiet after being contacted or quoted. One click opens WhatsApp with a ready nudge.
export default function FollowUps({ items, total, onOpen }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
        All caught up. No quoted or contacted lead has gone quiet for 2 days.
      </div>
    );
  }

  return (
    <div>
      <ul className="divide-y divide-stone-100">
        {items.map((lead) => {
          const status = STATUSES.find((item) => item.value === lead.status);
          const whatsApp = buildWhatsAppLink(lead.phone, followUpText(lead));
          return (
            <li key={lead.id} className="flex flex-wrap items-center gap-3 py-3">
              <button type="button" onClick={() => onOpen(lead)} className="min-w-0 basis-full text-left sm:flex-1 sm:basis-0">
                <p className="truncate text-sm font-medium text-stone-900">{lead.customerName || lead.phone || 'Unknown customer'}</p>
                <p className="truncate text-xs text-stone-500">{lead.message}</p>
              </button>
              <div className="flex flex-wrap items-center gap-2">
                {status && <Badge className={status.classes}>{status.label}</Badge>}
                {lead.quoteTotal !== null && <span className="text-xs font-medium text-stone-700">{formatInr(lead.quoteTotal)}</span>}
                <span className="w-14 text-right text-xs font-semibold text-red-600">{ageInDays(lead.createdAt)}d quiet</span>
                {whatsApp && (
                  <a
                    href={whatsApp}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    WhatsApp
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {total > items.length && <p className="mt-2 text-xs text-stone-500">Showing the oldest {items.length} of {total}.</p>}
    </div>
  );
}
