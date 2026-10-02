import { FOODS, type Food } from '../data/foods'
import { normalizeText } from './text'

/** What to look for on Open Food Facts for a shopping list item. */
export type SearchTarget =
  | { kind: 'category'; food: Food; category: string } // known food: reliable search
  | { kind: 'text'; text: string } // unknown word: approximate free-text search
  | { kind: 'none'; food: Food } // fresh, loose product: nothing to compare

type IndexedTerm = { term: string; food: Food }

function indexTerms(foods: readonly Food[]): IndexedTerm[] {
  return foods.flatMap((food) =>
    [food.label, ...food.terms].map((term) => ({ term: normalizeText(term), food })),
  )
}

const DEFAULT_INDEX = indexTerms(FOODS)

// Words that don't change what the product is: "yaourt nature bio", "2 boîtes de thon".
// Any other extra word might ("lait de coco" is not milk), so the phrase isn't matched.
const NEUTRAL_WORDS = new Set(
  [
    'bio', 'nature', 'naturel', 'frais', 'fraiche', 'francais', 'de', 'du', 'des', 'd', 'le', 'la', 'les', 'l',
    'un', 'une', 'en', 'et', 'pour', 'gros', 'grand', 'petit', 'paquet', 'boite', 'pot', 'sachet', 'brique',
    'bouteille', 'barquette', 'conserve', 'lot', 'kg', 'g', 'gr', 'l', 'cl', 'ml', 'x',
  ].map(normalizeText),
)

function isNeutral(word: string): boolean {
  return NEUTRAL_WORDS.has(word) || /^\d+([.,]\d+)?[a-z]*$/.test(word) // "2", "500g", "1kg"
}

/**
 * Finds the dictionary entry for what was typed.
 * An exact match wins; otherwise the longest term found in the text, provided the
 * other words are neutral: "riz complet bio" → "Riz complet" (not "Riz"),
 * but "lait de coco" → nothing (free-text search), not cow's milk.
 */
export function matchFood(label: string, foods?: readonly Food[]): Food | undefined {
  const index = foods ? indexTerms(foods) : DEFAULT_INDEX
  const text = normalizeText(label)
  if (!text) return undefined

  const exact = index.find((entry) => entry.term === text)
  if (exact) return exact.food

  const padded = ` ${text} `
  let best: IndexedTerm | undefined
  for (const entry of index) {
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
