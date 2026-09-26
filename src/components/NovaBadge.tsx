import type { NovaGroup } from '../types'
import { getNovaInfo } from '../utils/nova'

type Props = {
  nova: NovaGroup | undefined
}

export function NovaBadge({ nova }: Props) {
  const info = getNovaInfo(nova)
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${info.className}`}
      title={info.description}
    >
      {info.label}
    </span>
  )
}
