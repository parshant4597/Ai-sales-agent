import { useState } from 'react';
import { SAMPLE_GROUPS, SAMPLE_MESSAGES } from '../constants';

function Chip({ text, onPick }) {
  return (
    <button
      type="button"
      onClick={() => onPick(text)}
      className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs text-orange-800 hover:bg-orange-100"
    >
      {text}
    </button>
  );
}

// One-click example messages. A few are always visible, the rest sit behind "More examples".
export default function SampleChips({ onPick }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center gap-2">
        {SAMPLE_MESSAGES.map((sample) => (
          <Chip key={sample} text={sample} onPick={onPick} />
        ))}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="rounded-full px-3 py-1 text-xs font-medium text-stone-600 underline-offset-2 hover:underline"
        >
          {open ? 'Fewer examples ▴' : 'More examples ▾'}
        </button>
      </div>

      {open && (
        <div className="mt-3 space-y-3 rounded-xl bg-stone-50 p-3">
          {SAMPLE_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="mb-1.5 text-xs font-semibold text-stone-600">{group.title}</p>
              <div className="flex flex-wrap gap-2">
                {group.messages.map((sample) => (
                  <Chip key={sample} text={sample} onPick={onPick} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
