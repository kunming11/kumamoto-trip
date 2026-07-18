import { useMemo, useState } from 'react'
import type { TripStore } from '../hooks/useTripStore'
import type { PackCategory } from '../types'
import { PACK_CAT_LABEL, PACK_CAT_ORDER } from '../utils/labels'

interface Props {
  store: TripStore
}

export function PackingPage({ store }: Props) {
  const { trip, togglePack, addPack, removePack } = store
  const [name, setName] = useState('')
  const [category, setCategory] = useState<PackCategory>('clothes')

  const checked = trip.packing.filter((p) => p.checked).length
  const total = trip.packing.length
  const pct = total === 0 ? 0 : Math.round((checked / total) * 100)

  const grouped = useMemo(() => {
    return PACK_CAT_ORDER.map((cat) => ({
      cat,
      items: trip.packing.filter((p) => p.category === cat),
    }))
  }, [trip.packing])

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const n = name.trim()
    if (!n) return
    addPack(n, category)
    setName('')
  }

  return (
    <section id="pack" className="block">
      <header className="block-head">
        <h2>行李清單</h2>
        <p>
          已打包 {checked}/{total}（{pct}%）
        </p>
        <div className="progress-bar" aria-hidden>
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </header>

      {grouped.map(({ cat, items }) => (
        <section key={cat} className="pack-cat">
          <h3>{PACK_CAT_LABEL[cat]}</h3>
          {items.length === 0 ? (
            <p style={{ color: 'var(--ink-faint)', fontSize: '0.85rem' }}>尚無項目</p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={`pack-item${item.checked ? ' checked' : ''}`}
              >
                <button
                  type="button"
                  className={`check${item.checked ? ' on' : ''}`}
                  onClick={() => togglePack(item.id)}
                  aria-label={item.checked ? '取消勾選' : '勾選'}
                >
                  {item.checked ? '✓' : ''}
                </button>
                <span>{item.name}</span>
                <button
                  type="button"
                  className="icon-btn danger"
                  onClick={() => removePack(item.id)}
                  aria-label="刪除"
                >
                  刪
                </button>
              </div>
            ))
          )}
        </section>
      ))}

      <form className="add-form" onSubmit={handleAdd}>
        <h3>＋ 新增行李</h3>
        <div className="field-row">
          <div className="field">
            <label htmlFor="pack-name">項目</label>
            <input
              id="pack-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：護膝"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="pack-cat">分類</label>
            <select
              id="pack-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value as PackCategory)}
            >
              {PACK_CAT_ORDER.map((c) => (
                <option key={c} value={c}>
                  {PACK_CAT_LABEL[c]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button type="submit" className="submit-btn">
          加入清單
        </button>
      </form>
    </section>
  )
}
