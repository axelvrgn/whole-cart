import type { NovaGroup, Product } from '../types'
import { normalizeText } from './text'

// NOVA 1, 2, 3 first; unknown NOVA after them; ultra-processed (NOVA 4) last.
function novaOrder(nova: NovaGroup | undefined): number {
  if (nova === undefined) return 4
  return nova === 4 ? 5 : nova
}

/**
 * Sorts products from least to most industrial:
 * 1. NOVA group  2. fewer additives  3. shorter ingredient list  4. more popular.
 * NOVA alone isn't enough: all canned tunas are NOVA 3, but "tuna, water, salt"
 * beats "tuna, oil, flavourings".
 */
export function compareProducts(a: Product, b: Product): number {
  return (
    novaOrder(a.nova) - novaOrder(b.nova) ||
    // OFF omits the additives count when none were found, so missing counts as 0.
    (a.additivesCount ?? 0) - (b.additivesCount ?? 0) ||
    (a.ingredientsCount ?? Infinity) - (b.ingredientsCount ?? Infinity) ||
    (b.popularity ?? 0) - (a.popularity ?? 0)
  )
}

/** Ranked products without unnamed entries and duplicates (same barcode, or same name and brand). */
export function rankProducts(products: readonly Product[]): Product[] {
  const seen = new Set<string>()
  return products
    .filter((product) => product.name.trim() !== '')
    .sort(compareProducts)
    .filter((product) => {
      const keys = [`code:${product.code}`, `name:${normalizeText(product.name)}|${normalizeText(product.brand ?? '')}`]
      if (keys.some((key) => seen.has(key))) return false
      keys.forEach((key) => seen.add(key))
      return true
    })
}

/**
 * The best `count` products. NOVA 4 only shows up when nothing else exists.
 * Each brand gets one spot first: the n°2 and n°3 are the fallback when the n°1
 * isn't on the shelf, and a missing product usually means the whole brand is missing.
 * Same-brand products only fill the remaining spots.
 */
export function pickTopProducts(products: readonly Product[], count = 3): Product[] {
  const ranked = rankProducts(products)
  const notUltraProcessed = ranked.filter((product) => product.nova !== 4)
  const candidates = notUltraProcessed.length > 0 ? notUltraProcessed : ranked

  const brands = new Set<string>()
  const firstOfEachBrand: Product[] = []
  const sameBrandAgain: Product[] = []
  for (const product of candidates) {
    const brand = normalizeText(product.brand ?? '')
    // An unknown brand is never grouped with another one.
    if (brand && brands.has(brand)) {
      sameBrandAgain.push(product)
    } else {
      if (brand) brands.add(brand)
      firstOfEachBrand.push(product)
    }
  }
  return [...firstOfEachBrand, ...sameBrandAgain].slice(0, count)
}
