// SAMPLE price list created for this assignment (not Remedy Setu's real prices).
//
// Each product has:
//   id       - stable key the AI must return (it can never invent a new one)
//   unit     - what the quantity counts: ratti, piece, mala or puja
//   aliases  - spellings customers use on WhatsApp (lowercase, Hindi included)
//   tiers    - bulk pricing. A tier applies when quantity >= minQty.
//              Tiers must be sorted by minQty, and the first one must start at 1.

export const CATEGORIES = {
  gemstone: 'Gemstones',
  rudraksha: 'Rudraksha',
  spiritual: 'Spiritual Products',
  puja: 'Puja Services',
};

export const PRICE_LIST = [
  // ---------- Gemstones (price per ratti) ----------
  {
    id: 'neelam',
    name: 'Neelam (Blue Sapphire)',
    hindiName: 'नीलम',
    category: 'gemstone',
    unit: 'ratti',
    aliases: ['neelam', 'nilam', 'neelum', 'blue sapphire', 'नीलम'],
    tiers: [
      { minQty: 1, price: 1800 },
      { minQty: 25, price: 1650 },
      { minQty: 100, price: 1500 },
    ],
  },
  {
    id: 'pukhraj',
    name: 'Pukhraj (Yellow Sapphire)',
    hindiName: 'पुखराज',
    category: 'gemstone',
    unit: 'ratti',
    aliases: ['pukhraj', 'pukraj', 'pokhraj', 'yellow sapphire', 'पुखराज'],
    tiers: [
      { minQty: 1, price: 2200 },
      { minQty: 25, price: 2000 },
      { minQty: 100, price: 1850 },
    ],
  },
  {
    id: 'panna',
    name: 'Panna (Emerald)',
    hindiName: 'पन्ना',
    category: 'gemstone',
    unit: 'ratti',
    aliases: ['panna', 'emerald', 'पन्ना'],
    tiers: [
      { minQty: 1, price: 1500 },
      { minQty: 25, price: 1350 },
      { minQty: 100, price: 1200 },
    ],
  },
  {
    id: 'manik',
    name: 'Manik (Ruby)',
    hindiName: 'माणिक',
    category: 'gemstone',
    unit: 'ratti',
    aliases: ['manik', 'manikya', 'ruby', 'माणिक', 'माणिक्य'],
    tiers: [
      { minQty: 1, price: 1400 },
      { minQty: 25, price: 1250 },
      { minQty: 100, price: 1100 },
    ],
  },
  {
    id: 'moti',
    name: 'Moti (Pearl)',
    hindiName: 'मोती',
    category: 'gemstone',
    unit: 'ratti',
    aliases: ['moti', 'pearl', 'मोती'],
    tiers: [
      { minQty: 1, price: 300 },
      { minQty: 50, price: 260 },
      { minQty: 200, price: 220 },
    ],
  },
  {
    id: 'moonga',
    name: 'Moonga (Red Coral)',
    hindiName: 'मूंगा',
    category: 'gemstone',
    unit: 'ratti',
    aliases: ['moonga', 'munga', 'red coral', 'coral', 'मूंगा'],
    tiers: [
      { minQty: 1, price: 450 },
      { minQty: 50, price: 400 },
      { minQty: 200, price: 350 },
    ],
  },
  {
    id: 'gomed',
    name: 'Gomed (Hessonite)',
    hindiName: 'गोमेद',
    category: 'gemstone',
    unit: 'ratti',
    aliases: ['gomed', 'gomedh', 'hessonite', 'गोमेद'],
    tiers: [
      { minQty: 1, price: 250 },
      { minQty: 50, price: 220 },
      { minQty: 200, price: 190 },
    ],
  },
  {
    id: 'lehsuniya',
    name: "Lehsuniya (Cat's Eye)",
    hindiName: 'लहसुनिया',
    category: 'gemstone',
    unit: 'ratti',
    aliases: ['lehsuniya', 'lahsuniya', 'lehsunia', "cat's eye", 'cats eye', 'cat eye', 'लहसुनिया'],
    tiers: [
      { minQty: 1, price: 350 },
      { minQty: 50, price: 310 },
      { minQty: 200, price: 270 },
    ],
  },

  // ---------- Rudraksha (price per piece) ----------
  {
    id: 'rudraksha-5-mukhi',
    name: '5 Mukhi Rudraksha (Nepal)',
    hindiName: '5 मुखी रुद्राक्ष',
    category: 'rudraksha',
    unit: 'piece',
    aliases: ['5 mukhi rudraksha', '5 mukhi', 'five mukhi', 'panch mukhi', 'panchmukhi', '5 मुखी', 'पंचमुखी'],
    tiers: [
      { minQty: 1, price: 60 },
      { minQty: 100, price: 45 },
      { minQty: 500, price: 35 },
    ],
  },
  {
    id: 'rudraksha-6-mukhi',
    name: '6 Mukhi Rudraksha (Nepal)',
    hindiName: '6 मुखी रुद्राक्ष',
    category: 'rudraksha',
    unit: 'piece',
    aliases: ['6 mukhi rudraksha', '6 mukhi', 'six mukhi', 'chhah mukhi', '6 मुखी'],
    tiers: [
      { minQty: 1, price: 250 },
      { minQty: 50, price: 210 },
      { minQty: 200, price: 180 },
    ],
  },
  {
    id: 'rudraksha-7-mukhi',
    name: '7 Mukhi Rudraksha (Nepal)',
    hindiName: '7 मुखी रुद्राक्ष',
    category: 'rudraksha',
    unit: 'piece',
    aliases: ['7 mukhi rudraksha', '7 mukhi', 'seven mukhi', 'saat mukhi', '7 मुखी'],
    tiers: [
      { minQty: 1, price: 600 },
      { minQty: 25, price: 520 },
      { minQty: 100, price: 450 },
    ],
  },
  {
    id: 'rudraksha-gauri-shankar',
    name: 'Gauri Shankar Rudraksha',
    hindiName: 'गौरी शंकर रुद्राक्ष',
    category: 'rudraksha',
    unit: 'piece',
    aliases: ['gauri shankar rudraksha', 'gauri shankar', 'gaurishankar', 'गौरी शंकर'],
    tiers: [
      { minQty: 1, price: 4500 },
      { minQty: 10, price: 4000 },
      { minQty: 50, price: 3600 },
    ],
  },
  {
    id: 'rudraksha-mala-108',
    name: '5 Mukhi Rudraksha Mala (108 beads)',
    hindiName: 'रुद्राक्ष माला',
    category: 'rudraksha',
    unit: 'mala',
    aliases: ['5 mukhi rudraksha mala', 'rudraksha mala', 'rudraksh mala', 'rudraksha ki mala', 'रुद्राक्ष माला', 'रुद्राक्ष की माला'],
    tiers: [
      { minQty: 1, price: 450 },
      { minQty: 25, price: 380 },
      { minQty: 100, price: 320 },
    ],
  },

  // ---------- Spiritual products (price per piece / mala) ----------
  {
    id: 'sphatik-mala',
    name: 'Sphatik (Crystal) Mala',
    hindiName: 'स्फटिक माला',
    category: 'spiritual',
    unit: 'mala',
    aliases: ['sphatik mala', 'sfatik mala', 'crystal mala', 'sphatik', 'स्फटिक माला', 'स्फटिक'],
    tiers: [
      { minQty: 1, price: 900 },
      { minQty: 20, price: 780 },
      { minQty: 100, price: 650 },
    ],
  },
  {
    id: 'shree-yantra',
    name: 'Shree Yantra (Brass, 3 inch)',
    hindiName: 'श्री यंत्र',
    category: 'spiritual',
    unit: 'piece',
    aliases: ['shree yantra', 'shri yantra', 'sri yantra', 'shreeyantra', 'श्री यंत्र'],
    tiers: [
      { minQty: 1, price: 750 },
      { minQty: 20, price: 650 },
      { minQty: 100, price: 550 },
    ],
  },
  {
    id: 'parad-shivling',
    name: 'Parad Shivling (50 g)',
    hindiName: 'पारद शिवलिंग',
    category: 'spiritual',
    unit: 'piece',
    aliases: ['parad shivling', 'parad shivalinga', 'parad shiv ling', 'mercury shivling', 'पारद शिवलिंग'],
    tiers: [
      { minQty: 1, price: 1100 },
      { minQty: 10, price: 950 },
      { minQty: 50, price: 820 },
    ],
  },

  // ---------- Puja services (price per puja) ----------
  {
    id: 'kaal-sarp-puja',
    name: 'Kaal Sarp Dosh Puja (Trimbakeshwar)',
    hindiName: 'काल सर्प दोष पूजा',
    category: 'puja',
    unit: 'puja',
    aliases: ['kaal sarp dosh puja', 'kaal sarp puja', 'kaal sarp dosh', 'kaal sarp', 'kalsarp', 'काल सर्प'],
    tiers: [
      { minQty: 1, price: 5100 },
      { minQty: 5, price: 4600 },
      { minQty: 20, price: 4100 },
    ],
  },
  {
    id: 'mangal-dosh-puja',
    name: 'Mangal Dosh Puja (Ujjain)',
    hindiName: 'मंगल दोष पूजा',
    category: 'puja',
    unit: 'puja',
    aliases: ['mangal dosh puja', 'mangal dosh', 'manglik puja', 'manglik dosh', 'मंगल दोष'],
    tiers: [
      { minQty: 1, price: 3100 },
      { minQty: 5, price: 2800 },
      { minQty: 20, price: 2500 },
    ],
  },
];
