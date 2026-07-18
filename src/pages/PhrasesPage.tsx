import { useMemo, useState } from 'react'
import { PHRASES } from '../data/phrases'

export function PhrasesPage() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('全部')
  const [toast, setToast] = useState<string | null>(null)

  const categories = useMemo(() => {
    const set = new Set(PHRASES.map((p) => p.category))
    return ['全部', ...Array.from(set)]
  }, [])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return PHRASES.filter((p) => {
      if (cat !== '全部' && p.category !== cat) return false
      if (!query) return true
      return (
        p.zh.toLowerCase().includes(query) ||
        p.ja.includes(query) ||
        p.romaji.toLowerCase().includes(query) ||
        p.category.includes(query)
      )
    })
  }, [q, cat])

  async function copyPhrase(ja: string) {
    try {
      await navigator.clipboard.writeText(ja)
      setToast('已複製日文')
    } catch {
      setToast('複製失敗，請長按選取')
    }
    window.setTimeout(() => setToast(null), 1600)
  }

  return (
    <section id="phrases" className="block">
      <header className="block-head">
        <h2>日文翻譯</h2>
        <p>點一下複製日文句子</p>
      </header>

      <input
        className="search-box"
        type="search"
        placeholder="搜尋中文／日文／羅馬拼音…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="搜尋句子"
      />

      <div className="cat-filters">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            className={`cat-chip${cat === c ? ' active' : ''}`}
            onClick={() => setCat(c)}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-day">找不到相關句子</div>
      ) : (
        filtered.map((p) => (
          <button
            key={p.id}
            type="button"
            className="phrase"
            onClick={() => copyPhrase(p.ja)}
          >
            <div className="phrase-zh">
              [{p.category}] {p.zh}
            </div>
            <div className="phrase-ja">{p.ja}</div>
            <div className="phrase-romaji">{p.romaji}</div>
          </button>
        ))
      )}

      {toast && <div className="toast">{toast}</div>}
    </section>
  )
}
