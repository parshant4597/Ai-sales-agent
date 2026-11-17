// Helpers that turn what an admin types into what the catalogue needs.
import { MAX_ALIASES } from '../constants.js';
import { normalize } from './text.js';

// "Neelam (Blue Sapphire)" -> "neelam-blue-sapphire". Used as the product's permanent id.
export function slugify(text) {
  const slug = String(text)
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '');
  return slug || 'product';
}

/**
 * Every spelling customers might use to ask for the product.
 * Admins should not have to remember to list the name itself, so it is added automatically,
 * together with the parts of "Neelam (Blue Sapphire)" and the Hindi name.
 */
export function buildAliases(name, hindiName, extra = []) {
  const parenthesised = [...name.matchAll(/\(([^)]+)\)/g)].map((match) => match[1]);
  const candidates = [name, name.split('(')[0], ...parenthesised, hindiName, ...extra];

  const unique = new Set(
    candidates
      .map((candidate) => normalize(candidate || ''))
      .filter((alias) => alias.length >= 2 && alias.length <= 40),
  );
  return [...unique].slice(0, MAX_ALIASES + 5);
}
