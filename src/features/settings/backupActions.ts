import { getAllItems, replaceAllItems } from '../list/listRepository'
import { backupFileName, buildBackup, parseBackup } from '../../utils/backup'

/**
 * On iPhone, opens the share sheet ("Enregistrer dans Fichiers", AirDrop, mail…).
 * On a computer, downloads the file.
 */
export async function exportBackup(): Promise<void> {
  const backup = buildBackup(await getAllItems())
  const file = new File([JSON.stringify(backup, null, 2)], backupFileName(), { type: 'application/json' })

  const isTouchDevice = navigator.maxTouchPoints > 0
  if (isTouchDevice && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
    } catch (error) {
      // The user closed the share sheet: not an error.
      if (error instanceof DOMException && error.name === 'AbortError') return
      throw error
    }
    return
  }

  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  link.click()
  URL.revokeObjectURL(url)
}

/** Reads and validates the file first; the current list is only replaced if the file is valid. */
export async function importBackup(file: File): Promise<number> {
  const backup = parseBackup(await file.text())
  await replaceAllItems(backup.items)
  return backup.items.length
}
