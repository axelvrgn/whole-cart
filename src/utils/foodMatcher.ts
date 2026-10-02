import { FOODS, type Food } from '../data/foods'
import type { Product } from '../types'
import { isOneEditAway, normalizeText } from './text'

/** What to look for on Open Food Facts for a shopping list item. */
export type SearchTarget =
  | { kind: 'category'; food: Food; category: string } // known food: reliable search
  | { kind: 'text'; text: string } // unknown word: approximate free-text search
  | { kind: 'none'; food: Food } // fresh, loose product: nothing to compare

type IndexedTerm = { term: string; food: Food }
type Index = { terms: IndexedTerm[]; vocabulary: Set<string> }

function buildIndex(foods: readonly Food[]): Index {
  const terms = foods.flatMap((food) =>
    [food.label, ...food.terms].map((term) => ({ term: normalizeText(term), food })),
  )
  const vocabulary = new Set(terms.flatMap((entry) => entry.term.split(' ')))
  return { terms, vocabulary }
}

const DEFAULT_INDEX = buildIndex(FOODS)

// Words that don't change what the product is: "yaourt nature bio", "2 boîtes de thon",
// "fromage comté". Any other extra word might ("lait de coco" is not milk), so the phrase isn't matched.
const NEUTRAL_WORDS = new Set(
  [
    'bio', 'nature', 'naturel', 'frais', 'fraiche', 'francais', 'de', 'du', 'des', 'd', 'le', 'la', 'les', 'l',
    'un', 'une', 'en', 'et', 'pour', 'gros', 'grand', 'petit', 'paquet', 'boite', 'pot', 'sachet', 'brique',
    'bouteille', 'barquette', 'conserve', 'lot', 'kg', 'g', 'gr', 'l', 'cl', 'ml', 'x',
    'fromage',
  ].map(normalizeText),
)

function isNeutral(word: string): boolean {
  return NEUTRAL_WORDS.has(word) || /^\d+([.,]\d+)?[a-z]*$/.test(word) // "2", "500g", "1kg"
}

/**
 * Fixes one-letter typos on long words, when there is no doubt: "emmenthal" → "emmental",
 * "mozarella" → "mozzarella". Short words are left alone ("riz" vs "ris" is too risky),
 * and so is a word close to two dictionary words ("compte": comté or compote?).
 */
function correctTypos(text: string, vocabulary: Set<string>): string {
  return text
    .split(' ')
    .map((word) => {
      if (word.length < 5 || vocabulary.has(word) || isNeutral(word)) return word
      const candidates = [...vocabulary].filter((known) => known.length >= 4 && isOneEditAway(word, known))
      return candidates.length === 1 ? candidates[0] : word
    })
    .join(' ')
}

/**
 * Finds the dictionary entry for what was typed.
 * An exact match wins; otherwise the longest term found in the text, provided the
 * other words are neutral: "riz complet bio" → "Riz complet" (not "Riz"),
 * but "lait de coco" → nothing (free-text search), not cow's milk.
 */
export function matchFood(label: string, foods?: readonly Food[]): Food | undefined {
  const index = foods ? buildIndex(foods) : DEFAULT_INDEX
  const text = correctTypos(normalizeText(label), index.vocabulary)
  if (!text) return undefined

  const exact = index.terms.find((entry) => entry.term === text)
  if (exact) return exact.food

  const padded = ` ${text} `
  let best: IndexedTerm | undefined
  for (const entry of index.terms) {
    if (!padded.includes(` ${entry.term} `) || entry.term.length <= (best?.term.length ?? 0)) continue
    const extraWords = padded.replace(` ${entry.term} `, ' ').trim().split(' ').filter(Boolean)
    if (extraWords.every(isNeutral)) best = entry
  }
  return best?.food
}

export function searchTargetFor(label: string, foods?: readonly Food[]): SearchTarget | undefined {
  const text = label.trim()
  if (!text) return undefined

  const food = matchFood(text, foods)
  if (!food) return { kind: 'text', text }
  return food.category ? { kind: 'category', food, category: food.category } : { kind: 'none', food }
}

/**
 * For free-text searches: keeps products whose name contains every meaningful word typed.
 * OFF's text search also looks at categories, labels and loose word forms, which brings
 * nonsense like "Les pâtes à compter" for "fromage compté".
 */
export function keepRelevantProducts(products: readonly Product[], typed: string): Product[] {
  const wanted = normalizeText(typed)
    .split(' ')
    .filter((word) => word && !isNeutral(word))
  if (wanted.length === 0) return [...products]
  return products.filter((product) => {
    const nameWords = new Set(normalizeText(`${product.name} ${product.brand ?? ''}`).split(' '))
    return wanted.every((word) => nameWords.has(word))
  })
}
