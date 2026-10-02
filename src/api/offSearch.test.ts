import { describe, expect, it } from 'vitest'
import { buildSearchParams, readHits, toProduct } from './offSearch'

describe('buildSearchParams', () => {
  it('searches a category in France (French product sheets), NOVA 1–3, most scanned first', () => {
    const params = buildSearchParams({ kind: 'category', category: 'en:plain-yogurts' })
    expect(params.get('q')).toBe(
      'categories_tags:"en:plain-yogurts" AND countries_tags:"en:france" AND lang:fr AND nova_group:[1 TO 3]',
    )
    expect(params.get('sort_by')).toBe('-unique_scans_n')
    expect(params.get('page_size')).toBe('50')
    expect(params.get('fields')).toContain('nova_group')
  })

  it('can include ultra-processed products', () => {
    const params = buildSearchParams({ kind: 'category', category: 'en:white-hams' }, { excludeUltraProcessed: false })
    expect(params.get('q')).not.toContain('nova_group')
  })

  it('requires every word of a free text, in relevance order', () => {
    const params = buildSearchParams({ kind: 'text', text: 'lait de coco' })
    expect(params.get('q')).toBe('lait AND de AND coco AND countries_tags:"en:france" AND lang:fr AND nova_group:[1 TO 3]')
    expect(params.has('sort_by')).toBe(false)
  })

  it('neutralizes query syntax typed by the user', () => {
    const params = buildSearchParams({ kind: 'text', text: 'kombucha (bio) -sucre "x" OR y' })
    expect(params.get('q')).toBe(
      'kombucha AND bio AND sucre AND x AND y AND countries_tags:"en:france" AND lang:fr AND nova_group:[1 TO 3]',
    )
  })
})

describe('toProduct', () => {
  it('converts a complete hit', () => {
    expect(
      toProduct({
        code: '3117753052655',
        product_name: 'Tuna',
        product_name_fr: 'Thon au naturel',
        brands: ['Pompon rouge', 'Other'],
        nova_group: 3,
        nutriscore_grade: 'a',
        additives_n: 0,
        ingredients_n: 3,
        unique_scans_n: 42,
        quantity: '3 x 180 g',
        image_front_small_url: 'https://images.openfoodfacts.org/x.jpg',
      }),
    ).toEqual({
      code: '3117753052655',
      name: 'Thon au naturel',
      brand: 'Pompon rouge',
      nova: 3,
      nutriscore: 'a',
      additivesCount: 0,
      ingredientsCount: 3,
      popularity: 42,
      packaging: '3 x 180 g',
      imageUrl: 'https://images.openfoodfacts.org/x.jpg',
    })
  })

  it('copes with messy community data', () => {
    const product = toProduct({
      code: '1',
      product_name: 'Jambon',
      brands: 'null',
      nova_group: '3',
      ingredients_n: '4',
      additives_n: 'n/a',
      nutriscore_grade: 'unknown',
      image_front_small_url: 'http://insecure.example/x.jpg',
    })
    expect(product).toMatchObject({ code: '1', name: 'Jambon', nova: 3, ingredientsCount: 4 })
    expect(product?.brand).toBeUndefined()
    expect(product?.additivesCount).toBeUndefined()
    expect(product?.nutriscore).toBeUndefined()
    expect(product?.imageUrl).toBeUndefined()
  })

  it('unescapes apostrophes', () => {
    expect(toProduct({ code: '1', product_name: 'Lait', brands: ["C\\'est qui le patron"] })?.brand).toBe(
      "C'est qui le patron",
    )
  })

  it('takes the first brand from a comma-separated string', () => {
    expect(toProduct({ code: '1', product_name: 'x', brands: ' , Bjorg, Ecotone' })?.brand).toBe('Bjorg')
  })

  it('rejects hits without barcode or name', () => {
    expect(toProduct({ product_name: 'x' })).toBeNull()
    expect(toProduct({ code: '1', product_name: '  ' })).toBeNull()
    expect(toProduct('oops')).toBeNull()
  })
})

describe('readHits', () => {
  it('returns the hits array', () => {
    expect(readHits({ hits: [1, 2], count: 2 })).toEqual([1, 2])
  })

  it('throws on anything else', () => {
    expect(() => readHits({ error: 'down' })).toThrow()
    expect(() => readHits(null)).toThrow()
  })
})
