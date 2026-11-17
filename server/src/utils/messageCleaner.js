// Turns a pasted WhatsApp message into plain text the extractor can read.
import { wordsToDigits } from './numberWords.js';

// "[10:32 am, 16/11/2026] Ramesh: Neelam 5 ratti"   (iPhone / WhatsApp Web)
const BRACKET_PREFIX = /^\[[^\]\n]{4,40}\]\s*[^:\n]{1,40}:\s*/gm;
// "16/11/26, 10:32 pm - Ramesh: Neelam 5 ratti"      (Android)
const DASH_PREFIX = /^\d{1,2}\/\d{1,2}\/\d{2,4},?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:[ap]\.?m\.?)?\s*[-–]\s*[^:\n]{1,40}:\s*/gim;

// 1,000 and 1,00,000 (Indian grouping) but not "5,25"
const GROUPED_NUMBER = /\b(?:\d{1,3}(?:,\d{3})+|\d{1,2}(?:,\d{2})+,\d{3})\b/g;

export function cleanMessage(raw) {
  const withoutTimestamps = String(raw).replace(BRACKET_PREFIX, '').replace(DASH_PREFIX, '');

  const spaced = withoutTimestamps
    .replace(GROUPED_NUMBER, (number) => number.replace(/,/g, ''))
    .replace(/(\d)(?=[a-zऀ-ॿ])/gi, '$1 '); // "5mukhi" -> "5 mukhi", "100pcs" -> "100 pcs"

  return wordsToDigits(spaced).replace(/[ \t]{2,}/g, ' ').trim();
}
