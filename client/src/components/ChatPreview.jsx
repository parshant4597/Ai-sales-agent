import { useState } from 'react';
import { getInitials } from '../utils/format';

// The conversation as the customer will see it: their message, then our reply.
export default function ChatPreview({ message, reply, contactName = '', label }) {
  // Taken once, so the time stays steady while the agent edits the reply.
  const [time] = useState(() => new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }));

  return (
    <div className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-stone-900/10">
      <div className="flex items-center gap-3 bg-[#0b5d52] px-4 py-2.5 text-white">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">{getInitials(contactName || 'Customer')}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{contactName || 'Customer'}</p>
          <p className="text-[11px] text-white/70">online</p>
        </div>
        {label && <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-medium">{label}</span>}
      </div>

      <div className="chat-wallpaper space-y-3 p-4">
        <div className="flex">
          <div className="max-w-[88%] whitespace-pre-wrap break-words rounded-2xl rounded-tl-sm bg-white px-3.5 py-2 text-sm text-stone-900 shadow-sm">
            {message}
            <span className="ml-3 whitespace-nowrap text-[10px] text-stone-400">{time}</span>
          </div>
        </div>

        <div className="flex justify-end">
          <div className="max-w-[94%] whitespace-pre-wrap break-words rounded-2xl rounded-tr-sm bg-[#d9fdd3] px-3.5 py-2 text-sm leading-relaxed text-stone-900 shadow-sm">
            {reply}
            <span className="ml-3 whitespace-nowrap text-[10px] text-emerald-700">
              {time} ✓✓
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
