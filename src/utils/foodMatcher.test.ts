import { describe, expect, it } from 'vitest'
import { FOODS } from '../data/foods'
import { keepRelevantProducts, matchFood, searchTargetFor } from './foodMatcher'
import { isOneEditAway, normalizeText } from './text'

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

  it('accepts "fromage" before a cheese name', () => {
    expect(matchFood('fromage comté')?.label).toBe('Comté')
    expect(matchFood('fromage emmental râpé')?.label).toBe('Fromage râpé')
  })

  it('understands the frequent misspelling "compté"', () => {
    expect(matchFood('compté')?.label).toBe('Comté')
    expect(matchFood('fromage compté')?.label).toBe('Comté')
  })

  it('fixes an unambiguous one-letter typo on long words', () => {
    expect(matchFood('emmenthal')?.label).toBe('Emmental')
    expect(matchFood('mozarella')?.label).toBe('Mozzarella')
    expect(matchFood('spagetti')?.label).toBe('Spaghetti')
  })

  it('leaves short words alone', () => {
    // "ris" is one letter away from "riz", but too short to guess safely
    expect(matchFood('ris de veau')).toBeUndefined()
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

describe('isOneEditAway', () => {
  it.each([
    ['comte', 'comte', true],
    ['compte', 'comte', true], // one letter added
    ['comte', 'compte', true], // one letter removed
    ['comte', 'conte', true], // one letter replaced
    ['compote', 'comte', false], // two letters
    ['abc', 'abcde', false],
  ])('%s / %s → %s', (a, b, expected) => {
    expect(isOneEditAway(a, b)).toBe(expected)
  })
})

describe('keepRelevantProducts', () => {
  const products = [
    { code: '1', name: 'Lait de coco', brand: 'Suzi Wan' },
    { code: '2', name: 'Lait demi-écrémé' },
    { code: '3', name: 'Les pâtes à compter !', brand: 'Panzani' },
    { code: '4', name: 'Boisson coco lait', brand: 'Bjorg' },
  ]

  it('keeps products whose name contains every meaningful word', () => {
    expect(keepRelevantProducts(products, 'lait de coco').map((p) => p.code)).toEqual(['1', '4'])
  })

  it('drops loosely related results', () => {
    expect(keepRelevantProducts(products, 'fromage compté')).toEqual([])
  })

  it('also looks at the brand', () => {
    expect(keepRelevantProducts(products, 'coco bjorg').map((p) => p.code)).toEqual(['4'])
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
