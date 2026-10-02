import type { NutriScore, Product } from '../types'
import { parseNova } from '../utils/nova'

/**
 * Pure helpers for the Open Food Facts search API ("search-a-licious").
 * Docs: https://search.openfoodfacts.org/docs
 */

export type OffQuery = { kind: 'category'; category: string } | { kind: 'text'; text: string }

const FIELDS = [
  'code',
  'product_name',
  'product_name_fr',
  'brands',
  'nova_group',
  'nutriscore_grade',
  'additives_n',
  'ingredients_n',
  'unique_scans_n',
  'quantity',
  'image_front_small_url',
].join(',')

// The query language is Lucene: these characters have a special meaning in free text.
function escapeFreeText(text: string): string {
  return text.replace(/[+\-&|!(){}[\]^"~*?:\\/]/g, ' ').trim()
}

/**
 * @param excludeUltraProcessed ask the server for NOVA 1–3 only. Without it, for
 *   white ham 48 of the 50 most scanned products are NOVA 4 and the good ones are missed.
 */
export function buildSearchParams(query: OffQuery, { excludeUltraProcessed = true } = {}): URLSearchParams {
  // "Sold in France" is loosely tagged (Tesco or Lidl Germany products show up):
  // also requiring a French product sheet keeps brands you'll actually find on the shelf.
  const filters = ['countries_tags:"en:france"', 'lang:fr']
  if (excludeUltraProcessed) filters.push('nova_group:[1 TO 3]')

  const params = new URLSearchParams({ langs: 'fr', page_size: '50', fields: FIELDS })
  if (query.kind === 'category') {
    params.set('q', [`categories_tags:"${query.category}"`, ...filters].join(' AND '))
    // The 50 most scanned products: the ones you are likely to find on the shelf.
    params.set('sort_by', '-unique_scans_n')
  } else {
    // Free text keeps the default relevance order, otherwise unrelated popular products come first.
    params.set('q', [`(${escapeFreeText(query.text)})`, ...filters].join(' AND '))
  }
  return params
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function nonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const text = value.trim()
  return text && text !== 'null' ? text : undefined
}

// Numbers sometimes arrive as strings ("3") in community data.
function toCount(value: unknown): number | undefined {
  const n = typeof value === 'string' ? Number(value) : value
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : undefined
}

function firstBrand(value: unknown): string | undefined {
  const brands = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : []
  return brands.map(nonEmptyString).find(Boolean)
}

function toNutriScore(value: unknown): NutriScore | undefined {
  return typeof value === 'string' && /^[a-e]$/.test(value) ? (value as NutriScore) : undefined
}

/** Converts one raw search hit into a Product, or null if it is unusable (no barcode or no name). */
export function toProduct(hit: unknown): Product | null {
  if (!isRecord(hit)) return null
  const code = nonEmptyString(hit.code)
  const name = nonEmptyString(hit.product_name_fr) ?? nonEmptyString(hit.product_name)
  if (!code || !name) return null

  const imageUrl = nonEmptyString(hit.image_front_small_url)
  return {
    code,
    name,
    brand: firstBrand(hit.brands),
    nova: parseNova(hit.nova_group),
    nutriscore: toNutriScore(hit.nutriscore_grade),
    additivesCount: toCount(hit.additives_n),
    ingredientsCount: toCount(hit.ingredients_n),
    popularity: toCount(hit.unique_scans_n),
    packaging: nonEmptyString(hit.quantity),
    imageUrl: imageUrl?.startsWith('https://') ? imageUrl : undefined,
  }
}

/** Extracts the hits array from a response body; throws if the body isn't a search result. */
export function readHits(body: unknown): unknown[] {
  if (isRecord(body) && Array.isArray(body.hits)) return body.hits
  throw new Error('Unexpected search response')
}
