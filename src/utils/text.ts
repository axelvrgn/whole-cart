/**
 * Simplifies a French phrase so that small spelling differences don't matter:
 * "Pâtes", "pates" and "pâte" all become "pate"; "Œufs" becomes "oeuf".
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .normalize('NFD') // splits "é" into "e" + accent mark…
    .replace(/[̀-ͯ]/g, '') // …then drops the accent marks
    .replace(/[^a-z0-9]+/g, ' ') // apostrophes, dashes, punctuation → space
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(singularize)
    .join(' ')
}

// Rough French plural removal. It doesn't need to be correct French ("noix" → "noi"),
// only consistent: the dictionary terms and what you type go through the same function.
function singularize(word: string): string {
  return word.length > 3 && /[sx]$/.test(word) ? word.slice(0, -1) : word
}
