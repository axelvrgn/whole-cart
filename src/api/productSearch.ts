import { db } from '../db/db'
import type { Product } from '../types'
import { searchTargetFor } from '../utils/foodMatcher'
import { pickTopProducts } from '../utils/ranking'
import { normalizeText } from '../utils/text'
import { buildSearchParams, readHits, toProduct, type OffQuery } from './offSearch'
import { createRateLimiter } from './rateLimiter'

// Same-origin path, forwarded to https://search.openfoodfacts.org by the Vite dev server
// and by Vercel in production (see vite.config.ts and vercel.json). Calling OFF directly
// from the browser is blocked: their search server doesn't allow other websites (CORS).
const SEARCH_URL = '/off-search/search'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const schedule = createRateLimiter(2000)

export type ProductSearchResult =
  | { status: 'no-search' } // fresh, loose product (courgettes…): nothing to compare
  | { status: 'found' | 'not-found'; products: Product[]; approximate: boolean }

export class ProductSearchError extends Error {
  readonly reason: 'offline' | 'unavailable'

  constructor(reason: 'offline' | 'unavailable') {
    super(reason === 'offline' ? 'Pas de connexion internet.' : 'Open Food Facts ne répond pas, réessaie plus tard.')
    this.reason = reason
  }
}

/** The 3 least industrial products for a shopping list label ("yaourt", "thon"…). */
export async function findProducts(label: string): Promise<ProductSearchResult> {
  const target = searchTargetFor(label)
  if (!target || target.kind === 'none') return { status: 'no-search' }

  const query: OffQuery =
    target.kind === 'category' ? { kind: 'category', category: target.category } : { kind: 'text', text: target.text }
  const products = pickTopProducts(await getCandidates(query))
  return {
    status: products.length > 0 ? 'found' : 'not-found',
    products,
    approximate: target.kind === 'text',
  }
}

function cacheKey(query: OffQuery): string {
  return query.kind === 'category' ? `category:${query.category}` : `text:${normalizeText(query.text)}`
}

// Identical searches running at the same time share one request ("yaourt" added twice).
const inFlight = new Map<string, Promise<Product[]>>()

async function getCandidates(query: OffQuery): Promise<Product[]> {
  const key = cacheKey(query)
  const cached = await db.searchCache.get(key)
  if (cached && Date.now() - cached.savedAt < CACHE_TTL_MS) return cached.products

  let request = inFlight.get(key)
  if (!request) {
    request = fetchCandidates(query).finally(() => inFlight.delete(key))
    inFlight.set(key, request)
  }

  try {
    const products = await request
    await db.searchCache.put({ key, savedAt: Date.now(), products })
    return products
  } catch (error) {
    // In the shop with no network: an old result is better than nothing.
    if (cached) return cached.products
    throw error
  }
}

async function fetchCandidates(query: OffQuery): Promise<Product[]> {
  let hits = await fetchHits(buildSearchParams(query))
  // Nothing in NOVA 1–3: show the least bad ultra-processed products rather than nothing.
  if (hits.length === 0) hits = await fetchHits(buildSearchParams(query, { excludeUltraProcessed: false }))
  return hits.map(toProduct).filter((product): product is Product => product !== null)
}

function fetchHits(params: URLSearchParams): Promise<unknown[]> {
  return schedule(async () => {
    let response: Response
    try {
      response = await fetch(`${SEARCH_URL}?${params}`)
    } catch {
      // fetch only throws when the request couldn't be sent at all.
      throw new ProductSearchError(navigator.onLine ? 'unavailable' : 'offline')
    }
    // When overloaded, OFF answers with an HTML "temporarily unavailable" page.
    const isJson = response.headers.get('content-type')?.includes('json') ?? false
    if (!response.ok || !isJson) throw new ProductSearchError('unavailable')

    try {
      return readHits(await response.json())
    } catch {
      throw new ProductSearchError('unavailable')
    }
  })
}
