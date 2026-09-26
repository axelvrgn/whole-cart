import { describe, expect, it } from 'vitest'
import { getNovaInfo, parseNova } from './nova'

describe('parseNova', () => {
  it('accepts groups 1 to 4, as number or string', () => {
    expect(parseNova(1)).toBe(1)
    expect(parseNova('4')).toBe(4)
  })

  it('returns undefined for missing or invalid values', () => {
    expect(parseNova(undefined)).toBeUndefined()
    expect(parseNova(null)).toBeUndefined()
    expect(parseNova('')).toBeUndefined()
    expect(parseNova(5)).toBeUndefined()
    expect(parseNova(2.5)).toBeUndefined()
  })
})

describe('getNovaInfo', () => {
  it('returns the matching group info', () => {
    expect(getNovaInfo(4).description).toBe('Ultra-transformé')
  })

  it('falls back to "Inconnu" when the group is missing', () => {
    expect(getNovaInfo(undefined).description).toBe('Inconnu')
  })
})
