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

// For the unit dropdown in the product form.
export const UNIT_OPTIONS = [
  { value: 'ratti', label: 'Ratti (gemstones)' },
  { value: 'piece', label: 'Piece' },
  { value: 'mala', label: 'Mala (garland)' },
  { value: 'puja', label: 'Puja (service)' },
];

// `color` is used by charts, `classes` by badges and selects.
export const STATUSES = [
  { value: 'new', label: 'New', classes: 'bg-sky-100 text-sky-800', color: '#0ea5e9' },
  { value: 'contacted', label: 'Contacted', classes: 'bg-amber-100 text-amber-800', color: '#f59e0b' },
  { value: 'quoted', label: 'Quoted', classes: 'bg-violet-100 text-violet-800', color: '#8b5cf6' },
  { value: 'won', label: 'Won', classes: 'bg-emerald-100 text-emerald-800', color: '#10b981' },
  { value: 'lost', label: 'Lost', classes: 'bg-stone-200 text-stone-700', color: '#a8a29e' },
];

export const RANGES = [7, 14, 30];

export const SAMPLE_MESSAGES = [
  'Neelam ka rate kya hai 5 ratti?',
  'Rudraksha 100 pcs chahiye',
  'नीलम का रेट क्या है 7 रत्ती',
  'Pukhraj 30 ratti aur panna 10 ratti ka best rate batao',
  'Kaal sarp dosh puja book karni hai',
  'Order mein moti kharab mila, refund chahiye',
];

// Shown under "More examples". Each one produces a real quote (or a safe reply), so they double
// as a demo script: tier prices, several products, other languages, and awkward messages.
export const SAMPLE_GROUPS = [
  {
    title: 'See the bulk price drop',
    messages: [
      'Neelam 24 ratti ka rate',
      'Neelam 25 ratti ka rate',
      '5 mukhi rudraksha 500 pcs ka rate',
      'Rudraksha mala 100 pcs wholesale',
    ],
  },
  {
    title: 'Several products at once',
    messages: [
      'Panna 25 ratti aur moonga 50 ratti ka rate',
      'Gomed 60 ratti aur lehsuniya 50 ratti chahiye',
    ],
  },
  {
    title: 'Hindi, Hinglish and English',
    messages: [
      'पुखराज 30 रत्ती का रेट',
      'paanch ratti pukhraj ka bhav batao',
      'neelam 5.25 ratti ka rate',
      'What is the rate of emerald 10 ratti?',
    ],
  },
  {
    title: 'Spiritual products and pujas',
    messages: [
      'Sphatik mala 20 pcs ka price',
      'Gauri shankar rudraksha 10 pcs ka rate',
      'Shree yantra 20 pcs available hai?',
      'Mangal dosh puja 5 booking ka rate',
    ],
  },
  {
    title: 'Tricky messages',
    messages: [
      'Order mein moti kharab mila, refund chahiye aur rudraksha 100 pcs chahiye',
      'neelam 10% discount milega 5 ratti',
      'Diamond ring ka rate batao',
      'delivery kitne din mein hoti hai',
    ],
  },
];
