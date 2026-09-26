import { NovaBadge } from '../../components/NovaBadge'
import { Page } from '../../components/Page'

export function ListPage() {
  return (
    <Page title="Ma liste">
      <p className="text-stone-600">La liste de courses arrive à l'étape 2.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <NovaBadge nova={1} />
        <NovaBadge nova={2} />
        <NovaBadge nova={3} />
        <NovaBadge nova={4} />
        <NovaBadge nova={undefined} />
      </div>
    </Page>
  )
}
