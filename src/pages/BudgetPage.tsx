import { useMemo, useState } from 'react'
import type { TripStore } from '../hooks/useTripStore'
import type { BudgetCategory } from '../types'
import type { AppMode } from '../utils/backup'
import { BUDGET_CAT_LABEL } from '../utils/labels'

interface Props {
  store: TripStore
  mode: AppMode
}

const CATS = Object.keys(BUDGET_CAT_LABEL) as BudgetCategory[]

function formatMoney(n: number, currency: string) {
  return `${currency} ${n.toLocaleString('zh-TW')}`
}

export function BudgetPage({ store, mode }: Props) {
  const isGo = mode === 'go'
  const { trip, setTotalBudget, addBudget, removeBudget } = store
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<BudgetCategory>('food')
  const [budgetInput, setBudgetInput] = useState(String(trip.totalBudget))

  const spent = useMemo(
    () => trip.budget.reduce((sum, b) => sum + b.amount, 0),
    [trip.budget],
  )
  const remain = trip.totalBudget - spent

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const t = title.trim()
    const a = Number(amount)
    if (!t || !Number.isFinite(a) || a <= 0) return
    addBudget({ title: t, amount: a, category })
    setTitle('')
    setAmount('')
  }

  function handleBudgetSave(e: React.FormEvent) {
    e.preventDefault()
    const n = Number(budgetInput)
    if (!Number.isFinite(n) || n < 0) return
    setTotalBudget(n)
  }

  return (
    <section id="budget" className="block">
      <header className="block-head">
        <h2>預算</h2>
        <p>{isGo ? '快速記帳' : `本機記帳 · 單位 ${trip.currency}`}</p>
      </header>

      <div className="budget-summary">
        <div className="budget-stat">
          <div className="label">已花</div>
          <div className="value">{formatMoney(spent, trip.currency)}</div>
        </div>
        <div className="budget-stat">
          <div className="label">剩餘</div>
          <div className={`value${remain < 0 ? ' over' : ''}`}>
            {formatMoney(remain, trip.currency)}
          </div>
        </div>
      </div>

      {!isGo && (
        <form className="add-form" onSubmit={handleBudgetSave} style={{ marginBottom: 20 }}>
          <h3>總預算</h3>
          <div className="field">
            <label htmlFor="total-budget">金額（{trip.currency}）</label>
            <input
              id="total-budget"
              type="number"
              min={0}
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
            />
          </div>
          <button type="submit" className="submit-btn">
            更新總預算
          </button>
        </form>
      )}

      {!isGo && <h2 className="section-title">明細</h2>}
      {!isGo &&
        (trip.budget.length === 0 ? (
          <div className="empty-day">尚無記帳</div>
        ) : (
          trip.budget.map((entry) => (
            <div key={entry.id} className="budget-entry">
              <div>
                <div className="title">{entry.title}</div>
                <div className="meta">{BUDGET_CAT_LABEL[entry.category]}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="amount">{formatMoney(entry.amount, trip.currency)}</span>
                <button
                  type="button"
                  className="icon-btn danger"
                  onClick={() => removeBudget(entry.id)}
                  aria-label="刪除"
                >
                  刪
                </button>
              </div>
            </div>
          ))
        ))}

      <form className="add-form" onSubmit={handleAdd}>
        <h3>＋ 記一筆</h3>
        <div className="field">
          <label htmlFor="budget-title">項目</label>
          <input
            id="budget-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：阿蘇巴士"
            required
          />
        </div>
        <div className="field-row">
          <div className="field">
            <label htmlFor="budget-amount">金額</label>
            <input
              id="budget-amount"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="budget-cat">分類</label>
            <select
              id="budget-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value as BudgetCategory)}
            >
              {CATS.map((c) => (
                <option key={c} value={c}>
                  {BUDGET_CAT_LABEL[c]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button type="submit" className="submit-btn">
          記一筆
        </button>
      </form>
    </section>
  )
}
