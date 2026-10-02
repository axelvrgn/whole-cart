import { describe, expect, it } from 'vitest'
import { describeComposition, openFoodFactsUrl } from './productText'

describe('describeComposition', () => {
  it('describes ingredients and additives', () => {
    expect(describeComposition({ code: '1', name: 'x', ingredientsCount: 3, additivesCount: 0 })).toBe(
      '3 ingrédients · sans additif',
    )
    expect(describeComposition({ code: '1', name: 'x', ingredientsCount: 1, additivesCount: 1 })).toBe(
      '1 ingrédient · 1 additif',
    )
    expect(describeComposition({ code: '1', name: 'x', ingredientsCount: 8, additivesCount: 4 })).toBe(
      '8 ingrédients · 4 additifs',
    )
  })

  it('treats a missing additives count as none, and skips an unknown ingredient count', () => {
    expect(describeComposition({ code: '1', name: 'x' })).toBe('sans additif')
  })
})

describe('openFoodFactsUrl', () => {
  it('links to the French product page', () => {
    expect(openFoodFactsUrl({ code: '3017620422003', name: 'x' })).toBe(
      'https://fr.openfoodfacts.org/produit/3017620422003',
    )
  })
})
