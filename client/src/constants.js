export const INTENT_LABELS = {
  price_enquiry: 'Price enquiry',
  bulk_order: 'Bulk order',
  availability: 'Availability',
  puja_booking: 'Puja booking',
  order_status: 'Order status',
  complaint: 'Complaint',
  general: 'General',
};

export const LANGUAGE_LABELS = {
  english: 'English',
  hinglish: 'Hinglish',
  hindi: 'Hindi',
};

export const UNIT_LABELS = { ratti: 'ratti', piece: 'pcs', mala: 'mala', puja: 'puja' };

export const STATUSES = [
  { value: 'new', label: 'New', classes: 'bg-sky-100 text-sky-800' },
  { value: 'contacted', label: 'Contacted', classes: 'bg-amber-100 text-amber-800' },
  { value: 'quoted', label: 'Quoted', classes: 'bg-violet-100 text-violet-800' },
  { value: 'won', label: 'Won', classes: 'bg-emerald-100 text-emerald-800' },
  { value: 'lost', label: 'Lost', classes: 'bg-stone-200 text-stone-700' },
];

export const SAMPLE_MESSAGES = [
  'Neelam ka rate kya hai 5 ratti?',
  'Rudraksha 100 pcs chahiye',
  'नीलम का रेट क्या है 7 रत्ती',
  'Pukhraj 30 ratti aur panna 10 ratti ka best rate batao',
  'Kaal sarp dosh puja book karni hai',
  'Order mein moti kharab mila, refund chahiye',
];
