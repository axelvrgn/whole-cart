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

/**
 * Finds the dictionary entry for what was typed.
 * An exact match wins; otherwise the longest term contained in the text,
 * so "riz complet bio" → "Riz complet" (not "Riz"), "lait d'avoine" → oat drink (not milk).
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
    if (padded.includes(` ${entry.term} `) && entry.term.length > (best?.term.length ?? 0)) {
      best = entry
    }
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
