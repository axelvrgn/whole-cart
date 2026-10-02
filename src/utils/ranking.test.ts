import { describe, expect, it } from 'vitest'
import type { Product } from '../types'
import { pickTopProducts, rankProducts } from './ranking'

function product(code: string, fields: Partial<Product> = {}): Product {
  return { code, name: `Product ${code}`, ...fields }
}

const codes = (products: Product[]) => products.map((p) => p.code)

describe('rankProducts', () => {
  it('sorts by NOVA group first', () => {
    const ranked = rankProducts([product('n3', { nova: 3 }), product('n1', { nova: 1 }), product('n2', { nova: 2 })])
    expect(codes(ranked)).toEqual(['n1', 'n2', 'n3'])
  })

  it('puts unknown NOVA after NOVA 3, and NOVA 4 last', () => {
    const ranked = rankProducts([product('n4', { nova: 4 }), product('unknown'), product('n3', { nova: 3 })])
    expect(codes(ranked)).toEqual(['n3', 'unknown', 'n4'])
  })

  it('then prefers fewer additives, treating a missing count as zero', () => {
    const ranked = rankProducts([
      product('two', { nova: 3, additivesCount: 2 }),
      product('missing', { nova: 3 }),
      product('one', { nova: 3, additivesCount: 1 }),
    ])
    expect(codes(ranked)).toEqual(['missing', 'one', 'two'])
  })

  it('then prefers a shorter ingredient list (tuna, water, salt beats tuna with flavourings)', () => {
    const ranked = rankProducts([
      product('flavoured', { nova: 3, ingredientsCount: 6 }),
      product('unknown', { nova: 3 }),
      product('natural', { nova: 3, ingredientsCount: 3 }),
    ])
    expect(codes(ranked)).toEqual(['natural', 'flavoured', 'unknown'])
  })

  it('then prefers the most popular product', () => {
    const ranked = rankProducts([product('rare', { nova: 1, popularity: 2 }), product('common', { nova: 1, popularity: 500 })])
    expect(codes(ranked)).toEqual(['common', 'rare'])
  })

  it('removes products without a name', () => {
    expect(codes(rankProducts([product('a', { name: '  ' }), product('b')]))).toEqual(['b'])
  })

  it('removes duplicates, keeping the best-ranked one', () => {
    const ranked = rankProducts([
      product('worse', { name: 'Thon au naturel', brand: 'Petit Navire', nova: 3, ingredientsCount: 5 }),
      product('better', { name: 'Thon au Naturel ', brand: 'petit navire', nova: 3, ingredientsCount: 3 }),
      product('better', { name: 'Same barcode', nova: 3 }),
    ])
    expect(codes(ranked)).toEqual(['better'])
  })

  it('does not mutate the input', () => {
    const input = [product('b', { nova: 2 }), product('a', { nova: 1 })]
    rankProducts(input)
    expect(codes(input)).toEqual(['b', 'a'])
  })
})

describe('pickTopProducts', () => {
  it('returns the best 3 by default', () => {
    const top = pickTopProducts([1, 2, 3, 4, 5].map((n) => product(`p${n}`, { nova: 1, popularity: n })))
    expect(codes(top)).toEqual(['p5', 'p4', 'p3'])
  })

  it('leaves NOVA 4 out when anything else exists', () => {
    const top = pickTopProducts([product('n4', { nova: 4 }), product('n3', { nova: 3 })])
    expect(codes(top)).toEqual(['n3'])
  })

  it('falls back to NOVA 4 when nothing else exists', () => {
    const top = pickTopProducts([product('a', { nova: 4, additivesCount: 3 }), product('b', { nova: 4, additivesCount: 1 })])
    expect(codes(top)).toEqual(['b', 'a'])
  })

  it('returns an empty list when there is nothing', () => {
    expect(pickTopProducts([])).toEqual([])
  })
})
