import { useEffect, useRef } from 'react';

// An accessible dialog: Escape and a click outside close it, the page behind stays still, and
// focus moves into it. On a phone it slides up as a sheet.
export default function Modal({ title, onClose, children }) {
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);

  // Always call the latest onClose without re-running the effect below (which would steal focus mid-typing).
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const onKeyDown = (event) => event.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector('input, textarea, select')?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/45 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[92vh] w-full max-w-2xl animate-fade-up overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-stone-900">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
