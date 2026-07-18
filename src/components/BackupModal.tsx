import { useRef, useState } from 'react'
import type { TripState } from '../types'
import { downloadBackup, parseBackup, serializeBackup } from '../utils/backup'

interface Props {
  open: boolean
  trip: TripState
  onClose: () => void
  onImport: (trip: TripState) => void
}

export function BackupModal({ open, trip, onClose, onImport }: Props) {
  const [paste, setPaste] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  async function copyText() {
    try {
      await navigator.clipboard.writeText(serializeBackup(trip))
      setError(null)
      setMessage('已複製備份文字，可貼到 Line／備忘錄')
    } catch {
      setMessage(null)
      setError('複製失敗，請改用「下載 JSON」')
    }
  }

  function handleDownload() {
    downloadBackup(trip)
    setError(null)
    setMessage('已開始下載 JSON 檔')
  }

  function applyImport(raw: string) {
    try {
      const next = parseBackup(raw)
      if (!confirm('匯入會覆蓋目前本機行程資料，確定？')) return
      onImport(next)
      setPaste('')
      setError(null)
      setMessage('匯入成功')
    } catch (e) {
      setMessage(null)
      setError(e instanceof Error ? e.message : '匯入失敗')
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      applyImport(String(reader.result ?? ''))
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="backup-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-head">
          <h2 id="backup-title">備份與還原</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="關閉">
            ×
          </button>
        </header>

        <p className="modal-lead">
          資料只存在這個瀏覽器。出發前請備份，換手機或清快取後可再匯入。
        </p>

        <div className="modal-actions">
          <button type="button" className="submit-btn" onClick={handleDownload}>
            下載 JSON
          </button>
          <button type="button" className="cancel-btn" onClick={() => void copyText()}>
            複製為文字
          </button>
        </div>

        <h3 className="modal-sub">匯入</h3>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json,text/plain"
          hidden
          onChange={onFileChange}
        />
        <button
          type="button"
          className="cancel-btn"
          onClick={() => fileRef.current?.click()}
        >
          選擇 JSON 檔
        </button>

        <div className="field" style={{ marginTop: 12 }}>
          <label htmlFor="backup-paste">或貼上備份文字</label>
          <textarea
            id="backup-paste"
            rows={5}
            value={paste}
            onChange={(e) => setPaste(e.target.value)}
            placeholder='貼上 {"version":1,"trip":{...}} '
          />
        </div>
        <button
          type="button"
          className="submit-btn"
          disabled={!paste.trim()}
          onClick={() => applyImport(paste)}
        >
          從文字匯入
        </button>

        {message && <p className="modal-ok">{message}</p>}
        {error && <p className="modal-err">{error}</p>}
      </div>
    </div>
  )
}
