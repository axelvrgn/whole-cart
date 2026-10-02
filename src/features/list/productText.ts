import type { Product } from '../../types'

/** "3 ingrédients · sans additif" — the facts behind the ranking, in plain French. */
export function describeComposition(product: Product): string {
  const parts: string[] = []
  const ingredients = product.ingredientsCount
  if (ingredients !== undefined && ingredients > 0) {
    parts.push(ingredients === 1 ? '1 ingrédient' : `${ingredients} ingrédients`)
  }
  const additives = product.additivesCount ?? 0
  parts.push(additives === 0 ? 'sans additif' : additives === 1 ? '1 additif' : `${additives} additifs`)
  return parts.join(' · ')
}

export function openFoodFactsUrl(product: Product): string {
  return `https://fr.openfoodfacts.org/produit/${encodeURIComponent(product.code)}`
}
