import type { ReactNode } from 'react'

type Props = {
  title: string
  children: ReactNode
}

/** Screen layout: title below the notch, bottom padding so content never hides behind the tab bar. */
export function Page({ title, children }: Props) {
  return (
    <main className="mx-auto max-w-lg px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+5rem)]">
      <h1 className="mb-4 text-2xl font-bold">{title}</h1>
      {children}
    </main>
  )
}
