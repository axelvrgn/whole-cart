import type { NovaGroup } from '../types'

export type NovaInfo = {
  label: string
  description: string
  className: string // Tailwind classes for the badge
}

const NOVA_INFO: Record<NovaGroup, NovaInfo> = {
  1: { label: 'NOVA 1', description: 'Brut ou peu transformé', className: 'bg-green-600 text-white' },
  2: { label: 'NOVA 2', description: 'Ingrédient culinaire', className: 'bg-lime-500 text-white' },
  3: { label: 'NOVA 3', description: 'Transformé', className: 'bg-orange-500 text-white' },
  4: { label: 'NOVA 4', description: 'Ultra-transformé', className: 'bg-red-600 text-white' },
}

const UNKNOWN: NovaInfo = {
  label: 'NOVA ?',
  description: 'Inconnu',
  className: 'bg-stone-400 text-white',
}

/** Community data: nova_group may be missing or invalid, never crash on it. */
export function parseNova(value: unknown): NovaGroup | undefined {
  const n = Number(value)
  return n === 1 || n === 2 || n === 3 || n === 4 ? n : undefined
}

export function getNovaInfo(nova: NovaGroup | undefined): NovaInfo {
  return nova ? NOVA_INFO[nova] : UNKNOWN
}
