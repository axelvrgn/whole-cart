import { useState } from 'react'

type Props = {
  url?: string
  alt: string
  size: 'sm' | 'lg'
}

const SIZES = { sm: 'h-12 w-12', lg: 'h-20 w-20' }

/** Product photo, with a neutral placeholder when there is none or it fails to load (offline…). */
export function ProductImage({ url, alt, size }: Props) {
  const [failed, setFailed] = useState(false)
  const box = `${SIZES[size]} shrink-0 rounded-lg bg-stone-100`

  if (!url || failed) {
    return (
      <div className={`${box} flex items-center justify-center text-xl`} aria-hidden="true">
        🛒
      </div>
    )
  }
  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${box} object-contain`}
    />
  )
}
