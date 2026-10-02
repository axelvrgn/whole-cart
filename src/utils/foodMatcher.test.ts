import { describe, expect, it } from 'vitest'
import { FOODS } from '../data/foods'
import { matchFood, searchTargetFor } from './foodMatcher'
import { normalizeText } from './text'

describe('normalizeText', () => {
  it('ignores case, accents, plurals and punctuation', () => {
    expect(normalizeText('  Pâtes ')).toBe('pate')
    expect(normalizeText('Œufs')).toBe('oeuf')
    expect(normalizeText("Flocons d'avoine")).toBe('flocon d avoine')
    expect(normalizeText('Lait demi-écrémé')).toBe('lait demi ecreme')
  })

  it('keeps short words intact', () => {
    expect(normalizeText('riz')).toBe('riz')
    expect(normalizeText('sel')).toBe('sel')
  })
})

describe('matchFood', () => {
  it.each([
    ['yaourt', 'Yaourt nature'],
    ['Yaourts', 'Yaourt nature'],
    ['pâtes', 'Pâtes'],
    ['PATES', 'Pâtes'],
    ['penne', 'Pâtes'],
    ['œufs', 'Œufs'],
    ['oeufs', 'Œufs'],
    ['thon', 'Thon en conserve'],
    ["flocons d'avoine", "Flocons d'avoine"],
    ['courgettes', 'Courgettes'],
  ])('"%s" → %s', (typed, label) => {
    expect(matchFood(typed)?.label).toBe(label)
  })

  it('prefers the most specific term', () => {
    expect(matchFood('riz')?.label).toBe('Riz')
    expect(matchFood('riz complet')?.label).toBe('Riz complet')
    expect(matchFood("lait d'avoine")?.label).toBe("Boisson à l'avoine")
    expect(matchFood('beurre de cacahuète')?.label).toBe('Beurre de cacahuète')
    expect(matchFood('sauce tomate')?.label).toBe('Sauce tomate')
  })

  it('finds a known food inside a longer phrase made of neutral words', () => {
    expect(matchFood('yaourt nature bio')?.label).toBe('Yaourt nature')
    expect(matchFood('2 boîtes de thon')?.label).toBe('Thon en conserve')
    expect(matchFood('pâtes 500g')?.label).toBe('Pâtes')
    expect(matchFood('riz complet bio')?.label).toBe('Riz complet')
  })

  it('does not match when an extra word changes the product', () => {
    expect(matchFood('lait de coco')).toBeUndefined()
    expect(matchFood('yaourt à la fraise')).toBeUndefined()
    expect(matchFood('chips de légumes')).toBeUndefined()
  })

  it('does not match parts of words', () => {
    // "sel" must not match inside "selle"
    expect(matchFood('selle d’agneau')).toBeUndefined()
  })

  it('returns undefined for unknown or empty text', () => {
    expect(matchFood('kombucha')).toBeUndefined()
    expect(matchFood('   ')).toBeUndefined()
  })
})

describe('searchTargetFor', () => {
  it('searches by category for a known packaged food', () => {
    expect(searchTargetFor('yaourt')).toMatchObject({ kind: 'category', category: 'en:plain-yogurts' })
  })

  it('does not search for fresh, loose products', () => {
    expect(searchTargetFor('Carottes')).toMatchObject({ kind: 'none' })
  })

  it('falls back to free text for unknown words', () => {
    expect(searchTargetFor(' kombucha ')).toEqual({ kind: 'text', text: 'kombucha' })
  })

  it('returns undefined for empty text', () => {
    expect(searchTargetFor('')).toBeUndefined()
  })
})

describe('FOODS dictionary', () => {
  it('never uses the same term for two different foods', () => {
    const owners = new Map<string, string>()
    const conflicts: string[] = []
    for (const food of FOODS) {
      for (const term of new Set([food.label, ...food.terms].map(normalizeText))) {
        const owner = owners.get(term)
        if (owner && owner !== food.label) conflicts.push(`"${term}": ${owner} / ${food.label}`)
        owners.set(term, food.label)
      }
    }
    expect(conflicts).toEqual([])
  })

  it('uses Open Food Facts category tags', () => {
    for (const food of FOODS) {
      if (food.category) expect(food.category).toMatch(/^[a-z]{2}:[a-z0-9-]+$/)
    }
  })
})
