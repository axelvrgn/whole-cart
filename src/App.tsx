import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { BottomNav } from './components/BottomNav'
import { ListPage } from './features/list/ListPage'
import { ScanPage } from './features/scan/ScanPage'
import { SettingsPage } from './features/settings/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ListPage />} />
        <Route path="/scan" element={<ScanPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </BrowserRouter>
  )
}
