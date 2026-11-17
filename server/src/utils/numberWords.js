// Customers type "paanch ratti" or "पांच रत्ती", and voice input writes numbers as words.
// This turns number words into digits so the rest of the code only ever sees digits.
//
// A word is converted ONLY when a unit word follows it ("do ratti" -> "2 ratti").
// That keeps ordinary Hindi words safe: in "rate do" the word "do" means "give".

const NUMBER_WORDS = {
  // Hinglish
  ek: 1, do: 2, teen: 3, char: 4, chaar: 4, paanch: 5, panch: 5, chhe: 6, chhah: 6, saat: 7, aath: 8, nau: 9,
  das: 10, dus: 10, barah: 12, pandrah: 15, bees: 20, pachees: 25, tees: 30, chalis: 40, pachas: 50,
  saath: 60, sattar: 70, assi: 80, nabbe: 90,
  // English
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12,
  fifteen: 15, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  // Hindi (Devanagari)
  एक: 1, दो: 2, तीन: 3, चार: 4, पांच: 5, पाँच: 5, छह: 6, छः: 6, सात: 7, आठ: 8, नौ: 9, दस: 10, बारह: 12,
  पंद्रह: 15, बीस: 20, पच्चीस: 25, तीस: 30, चालीस: 40, पचास: 50, साठ: 60, सत्तर: 70, अस्सी: 80, नब्बे: 90,
};

const MULTIPLIERS = { sau: 100, hundred: 100, सौ: 100, hazaar: 1000, hazar: 1000, thousand: 1000, हजार: 1000, हज़ार: 1000 };

const UNIT_WORDS = new Set([
  'ratti', 'rati', 'rattis', 'pcs', 'pc', 'piece', 'pieces', 'mala', 'malas', 'puja', 'pujas',
  'रत्ती', 'रती', 'पीस', 'माला', 'पूजा',
]);

const clean = (token) => token.toLowerCase().replace(/^[^\p{L}\p{N}\p{M}]+|[^\p{L}\p{N}\p{M}]+$/gu, '');
const isNumberWord = (word) => word in NUMBER_WORDS || word in MULTIPLIERS;

// ['do', 'sau', 'pachas'] -> 250
function wordsToNumber(words) {
  let total = 0;
  let current = 0;
  for (const word of words) {
    if (word in MULTIPLIERS) {
      total += (current || 1) * MULTIPLIERS[word];
      current = 0;
    } else {
      current += NUMBER_WORDS[word];
    }
  }
  return total + current;
}

export function wordsToDigits(text) {
  // split keeps the whitespace: even indexes are words, odd indexes are the gaps between them
  const parts = text.replace(/([a-z])-(?=[a-z])/gi, '$1 ').split(/(\s+)/);
  const out = [];
  let i = 0;

  while (i < parts.length) {
    if (i % 2 === 0 && isNumberWord(clean(parts[i]))) {
      const run = [];
      let j = i;
      while (j < parts.length && isNumberWord(clean(parts[j]))) {
        run.push(clean(parts[j]));
        j += 2;
      }

      if (j < parts.length && UNIT_WORDS.has(clean(parts[j]))) {
        out.push(String(wordsToNumber(run)), parts[j - 1]);
        i = j;
        continue;
      }
    }
    out.push(parts[i]);
    i += 1;
  }

  return out.join('');
}
