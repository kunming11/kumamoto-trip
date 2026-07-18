import { useState } from 'react'
import { BackupModal } from './components/BackupModal'
import { SiteNav } from './components/SiteNav'
import { useAppMode } from './hooks/useAppMode'
import { useTripStore } from './hooks/useTripStore'
import { BudgetPage } from './pages/BudgetPage'
import { HomePage } from './pages/HomePage'
import { ItineraryPage } from './pages/ItineraryPage'
import { PackingPage } from './pages/PackingPage'
import { PhrasesPage } from './pages/PhrasesPage'

export default function App() {
  const store = useTripStore()
  const { mode, toggleMode, isGo } = useAppMode()
  const [backupOpen, setBackupOpen] = useState(false)

  return (
    <div className={`site${isGo ? ' mode-go' : ' mode-plan'}`}>
      <SiteNav
        mode={mode}
        onToggleMode={toggleMode}
        onOpenBackup={() => setBackupOpen(true)}
      />
      <main className="site-main">
        <HomePage trip={store.trip} onReset={store.resetTrip} mode={mode} />
        <ItineraryPage store={store} mode={mode} />
        {!isGo && <PackingPage store={store} />}
        <BudgetPage store={store} mode={mode} />
        <PhrasesPage />
      </main>
      <footer className="site-footer">
        <p>
          熊本之旅 · {isGo ? '旅途模式' : '規劃模式'} · 資料僅存於此瀏覽器 · 請用「備份」匯出
        </p>
      </footer>
      <BackupModal
        open={backupOpen}
        trip={store.trip}
        onClose={() => setBackupOpen(false)}
        onImport={(next) => {
          store.replaceTrip(next)
        }}
      />
    </div>
  )
}
