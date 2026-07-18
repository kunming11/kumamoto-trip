import { useEffect, useMemo, useState } from 'react'
import type { TripStore } from '../hooks/useTripStore'
import type { ItemType, ItineraryItem } from '../types'
import type { AppMode } from '../utils/backup'
import { resolveTodayDayIndex } from '../utils/backup'
import { directionsUrl, formatDateLabel, navToUrl } from '../utils/format'
import { ITEM_TYPE_LABEL } from '../utils/labels'

interface Props {
  store: TripStore
  mode: AppMode
}

const TYPES = Object.keys(ITEM_TYPE_LABEL) as ItemType[]

const emptyForm = {
  title: '',
  type: 'attraction' as ItemType,
  time: '',
  note: '',
  mapsQuery: '',
}

export function ItineraryPage({ store, mode }: Props) {
  const isGo = mode === 'go'
  const { trip, toggleItemDone, addItem, removeItem, updateItem, moveItem } = store
  const [dayIndex, setDayIndex] = useState(0)
  const day = trip.days[dayIndex] ?? trip.days[0]

  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const doneCount = useMemo(
    () => day.items.filter((i) => i.done).length,
    [day.items],
  )

  useEffect(() => {
    if (!isGo) return
    const idx = resolveTodayDayIndex(trip.days)
    setDayIndex(idx)
    cancelEdit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGo, trip.days.length])

  function placeQuery(item: ItineraryItem) {
    return (item.mapsQuery || item.title).trim()
  }

  function startEdit(item: ItineraryItem) {
    setEditingId(item.id)
    setForm({
      title: item.title,
      type: item.type,
      time: item.time ?? '',
      note: item.note ?? '',
      mapsQuery: item.mapsQuery ?? '',
    })
    document.getElementById('item-form')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const t = form.title.trim()
    if (!t) return
    const data = {
      title: t,
      type: form.type,
      time: form.time.trim() || undefined,
      note: form.note.trim() || undefined,
      mapsQuery: form.mapsQuery.trim() || t,
    }
    if (editingId) {
      updateItem(day.date, editingId, data)
      cancelEdit()
    } else {
      addItem(day.date, data)
      setForm(emptyForm)
    }
  }

  function onDragStart(index: number) {
    if (isGo) return
    setDragIndex(index)
  }

  function onDragOver(e: React.DragEvent, index: number) {
    if (isGo) return
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return
    setOverIndex(index)
  }

  function onDrop(index: number) {
    if (isGo) return
    if (dragIndex !== null && dragIndex !== index) {
      moveItem(day.date, dragIndex, index)
    }
    setDragIndex(null)
    setOverIndex(null)
  }

  function onDragEnd() {
    setDragIndex(null)
    setOverIndex(null)
  }

  return (
    <section id="days" className="block">
      <header className="block-head">
        <h2>每日行程</h2>
        <p>
          {isGo
            ? '旅途模式：勾選完成・大按鈕導航（編輯請切回規劃）'
            : '拖曳調整順序 · 編輯／刪除 · 一鍵開 Google Maps 導航'}
        </p>
      </header>

      <div className="day-tabs" role="tablist">
        {trip.days.map((d, i) => (
          <button
            key={d.date}
            type="button"
            role="tab"
            aria-selected={i === dayIndex}
            className={`day-tab${i === dayIndex ? ' active' : ''}`}
            onClick={() => {
              setDayIndex(i)
              cancelEdit()
            }}
          >
            <span className="day-date">{formatDateLabel(d.date)}</span>
            Day {i + 1}
          </button>
        ))}
      </div>

      <h2 className="day-heading">
        {day.label}
        {day.items.length > 0 && (
          <span style={{ color: 'var(--ink-muted)', fontWeight: 400, fontSize: '0.85rem' }}>
            {' '}
            · 完成 {doneCount}/{day.items.length}
          </span>
        )}
      </h2>

      {day.items.length === 0 ? (
        <div className="empty-day">
          {isGo ? '這天沒有行程' : '這天還沒安排 — 在下方新增即可'}
        </div>
      ) : (
        <div className="item-list">
          {day.items.map((item, index) => {
            const dest = placeQuery(item)
            const next = day.items[index + 1]
            const nextPlace = next ? placeQuery(next) : ''
            const showLeg =
              Boolean(dest) &&
              Boolean(nextPlace) &&
              dest !== nextPlace &&
              item.type !== 'flight' &&
              next?.type !== 'flight'
            const isDragging = dragIndex === index
            const isOver = overIndex === index && dragIndex !== index
            return (
              <div
                key={item.id}
                className={`item-row${isDragging ? ' dragging' : ''}${isOver ? ' drag-over' : ''}`}
                draggable={!isGo}
                onDragStart={() => onDragStart(index)}
                onDragOver={(e) => onDragOver(e, index)}
                onDrop={() => onDrop(index)}
                onDragEnd={onDragEnd}
              >
                <article
                  className={`item${isGo ? ' go-item' : ''}${item.done ? ' done' : ''}${editingId === item.id ? ' editing' : ''}`}
                >
                  {!isGo && (
                    <div className="reorder-col">
                      <span className="drag-handle" title="拖曳調整順序" aria-hidden>
                        ⠿
                      </span>
                      <button
                        type="button"
                        className="reorder-btn"
                        disabled={index === 0}
                        onClick={() => moveItem(day.date, index, index - 1)}
                        aria-label="上移"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="reorder-btn"
                        disabled={index === day.items.length - 1}
                        onClick={() => moveItem(day.date, index, index + 1)}
                        aria-label="下移"
                      >
                        ↓
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    className={`check${item.done ? ' on' : ''}`}
                    onClick={() => toggleItemDone(day.date, item.id)}
                    aria-label={item.done ? '標為未完成' : '標為完成'}
                  >
                    {item.done ? '✓' : ''}
                  </button>
                  <div className="item-body">
                    {!isGo && (
                      <span className="type-tag">{ITEM_TYPE_LABEL[item.type]}</span>
                    )}
                    <p className="item-title">
                      {item.time && <span className="item-time">{item.time}</span>}
                      {item.title}
                    </p>
                    {!isGo && item.note && <p className="item-note">{item.note}</p>}
                  </div>
                  <div className="item-actions">
                    {dest && (
                      <a
                        className={`icon-btn nav${isGo ? ' nav-lg' : ''}`}
                        href={navToUrl(dest)}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Google 導航"
                        title="Google 導航到這裡"
                      >
                        {isGo ? '導航 →' : '導航'}
                      </a>
                    )}
                    {!isGo && (
                      <>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => startEdit(item)}
                          aria-label="編輯"
                        >
                          編
                        </button>
                        <button
                          type="button"
                          className="icon-btn danger"
                          onClick={() => {
                            if (confirm(`刪除「${item.title}」？`)) {
                              if (editingId === item.id) cancelEdit()
                              removeItem(day.date, item.id)
                            }
                          }}
                          aria-label="刪除"
                        >
                          刪
                        </button>
                      </>
                    )}
                  </div>
                </article>
                {showLeg && (
                  <div className="leg-distance">
                    <span className="leg-line" aria-hidden />
                    <a
                      className="leg-badge leg-nav"
                      href={directionsUrl(dest, nextPlace)}
                      target="_blank"
                      rel="noreferrer"
                      title="在 Google Maps 看這段路線與車程"
                    >
                      這段路線（Google Maps）
                    </a>
                    <span className="leg-line" aria-hidden />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!isGo && (
        <form id="item-form" className="add-form" onSubmit={handleSubmit}>
          <h3>{editingId ? '✎ 編輯行程' : '＋ 新增行程'}</h3>
          <div className="field">
            <label htmlFor="item-title">名稱</label>
            <input
              id="item-title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="例如：熊本城、桂花拉麵"
              required
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="item-type">類型</label>
              <select
                id="item-type"
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, type: e.target.value as ItemType }))
                }
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {ITEM_TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="item-time">時間（選填）</label>
              <input
                id="item-time"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                placeholder="10:00"
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="item-maps">導航地點（建議日文）</label>
            <input
              id="item-maps"
              value={form.mapsQuery}
              onChange={(e) => setForm((f) => ({ ...f, mapsQuery: e.target.value }))}
              placeholder="留空則用名稱，如 熊本城"
            />
          </div>
          <div className="field">
            <label htmlFor="item-note">備註（選填）</label>
            <input
              id="item-note"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="營業時間、票價…"
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="submit-btn">
              {editingId ? '儲存修改' : '加入今天'}
            </button>
            {editingId && (
              <button type="button" className="cancel-btn" onClick={cancelEdit}>
                取消編輯
              </button>
            )}
          </div>
        </form>
      )}
    </section>
  )
}
