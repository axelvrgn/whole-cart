import { useRef, useState, type ChangeEvent } from 'react'
import { Page } from '../../components/Page'
import { BackupError } from '../../utils/backup'
import { exportBackup, importBackup } from './backupActions'

type Message = { kind: 'success' | 'error'; text: string }

const buttonClass =
  'h-12 w-full rounded-xl border border-stone-300 bg-white font-medium text-stone-800 active:bg-stone-100'

export function SettingsPage() {
  const [message, setMessage] = useState<Message>()
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleExport() {
    setMessage(undefined)
    try {
      await exportBackup()
    } catch (error) {
      console.error(error)
      setMessage({ kind: 'error', text: "L'export a échoué." })
    }
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = '' // allow re-selecting the same file later
    if (!file) return

    if (!window.confirm('Remplacer ta liste actuelle par celle de la sauvegarde ?')) return

    try {
      const count = await importBackup(file)
      setMessage({ kind: 'success', text: `Liste restaurée : ${count} article${count > 1 ? 's' : ''}.` })
    } catch (error) {
      console.error(error)
      const text = error instanceof BackupError ? error.message : "L'import a échoué."
      setMessage({ kind: 'error', text })
    }
  }

  return (
    <Page title="Réglages">
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">Sauvegarde</h2>
        <p className="mt-1 mb-4 text-sm text-stone-600">
          iOS peut effacer les données d'une app peu utilisée. Exporte ta liste de temps en temps
          (par exemple dans Fichiers) pour pouvoir la restaurer.
        </p>
        <div className="flex flex-col gap-2">
          <button type="button" onClick={handleExport} className={buttonClass}>
            Exporter ma liste
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()} className={buttonClass}>
            Importer une sauvegarde
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
        {message && (
          <p
            role="status"
            className={`mt-3 text-sm ${message.kind === 'success' ? 'text-green-700' : 'text-red-600'}`}
          >
            {message.text}
          </p>
        )}
      </section>
    </Page>
  )
}
