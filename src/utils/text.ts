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

/** True if `a` and `b` differ by at most one letter added, removed or replaced ("compte" / "comte"). */
export function isOneEditAway(a: string, b: string): boolean {
  if (a === b) return true
  if (Math.abs(a.length - b.length) > 1) return false
  const [short, long] = a.length <= b.length ? [a, b] : [b, a]
  let i = 0
  while (i < short.length && short[i] === long[i]) i++
  // Skip the one differing letter, then the rest must be identical.
  const rest = short.length === long.length ? short.slice(i + 1) : short.slice(i)
  return rest === long.slice(i + 1)
}

// Rough French plural removal. It doesn't need to be correct French ("noix" → "noi"),
// only consistent: the dictionary terms and what you type go through the same function.
function singularize(word: string): string {
  return word.length > 3 && /[sx]$/.test(word) ? word.slice(0, -1) : word
}
