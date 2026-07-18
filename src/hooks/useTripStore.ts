import { useCallback, useEffect, useState } from 'react'
import { INITIAL_TRIP, uid } from '../data/trip'
import type {
  BudgetCategory,
  BudgetEntry,
  ItemType,
  PackCategory,
  PackItem,
  TripState,
} from '../types'
import { TRIP_STORAGE_KEY } from '../utils/backup'

function loadTrip(): TripState {
  try {
    const raw = localStorage.getItem(TRIP_STORAGE_KEY)
    if (!raw) return structuredClone(INITIAL_TRIP)
    const parsed = JSON.parse(raw) as TripState
    if (!parsed.days || !parsed.flights) return structuredClone(INITIAL_TRIP)
    return parsed
  } catch {
    return structuredClone(INITIAL_TRIP)
  }
}

export function useTripStore() {
  const [trip, setTrip] = useState<TripState>(() => loadTrip())

  useEffect(() => {
    localStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify(trip))
  }, [trip])

  const resetTrip = useCallback(() => {
    const fresh = structuredClone(INITIAL_TRIP)
    setTrip(fresh)
    localStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify(fresh))
  }, [])

  const replaceTrip = useCallback((next: TripState) => {
    setTrip(next)
    localStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify(next))
  }, [])

  const toggleItemDone = useCallback((date: string, itemId: string) => {
    setTrip((prev) => ({
      ...prev,
      days: prev.days.map((day) =>
        day.date !== date
          ? day
          : {
              ...day,
              items: day.items.map((item) =>
                item.id === itemId ? { ...item, done: !item.done } : item,
              ),
            },
      ),
    }))
  }, [])

  const addItem = useCallback(
    (
      date: string,
      data: { title: string; type: ItemType; time?: string; note?: string; mapsQuery?: string },
    ) => {
      setTrip((prev) => ({
        ...prev,
        days: prev.days.map((day) =>
          day.date !== date
            ? day
            : {
                ...day,
                items: [
                  ...day.items,
                  {
                    id: uid('item'),
                    title: data.title,
                    type: data.type,
                    time: data.time || undefined,
                    note: data.note || undefined,
                    mapsQuery: data.mapsQuery || data.title,
                    done: false,
                  },
                ],
              },
        ),
      }))
    },
    [],
  )

  const removeItem = useCallback((date: string, itemId: string) => {
    setTrip((prev) => ({
      ...prev,
      days: prev.days.map((day) =>
        day.date !== date
          ? day
          : { ...day, items: day.items.filter((item) => item.id !== itemId) },
      ),
    }))
  }, [])

  const updateItem = useCallback(
    (
      date: string,
      itemId: string,
      data: {
        title: string
        type: ItemType
        time?: string
        note?: string
        mapsQuery?: string
      },
    ) => {
      setTrip((prev) => ({
        ...prev,
        days: prev.days.map((day) =>
          day.date !== date
            ? day
            : {
                ...day,
                items: day.items.map((item) =>
                  item.id !== itemId
                    ? item
                    : {
                        ...item,
                        title: data.title,
                        type: data.type,
                        time: data.time || undefined,
                        note: data.note || undefined,
                        mapsQuery: data.mapsQuery || data.title,
                      },
                ),
              },
        ),
      }))
    },
    [],
  )

  const moveItem = useCallback((date: string, fromIndex: number, toIndex: number) => {
    setTrip((prev) => ({
      ...prev,
      days: prev.days.map((day) => {
        if (day.date !== date) return day
        if (
          fromIndex === toIndex ||
          fromIndex < 0 ||
          toIndex < 0 ||
          fromIndex >= day.items.length ||
          toIndex >= day.items.length
        ) {
          return day
        }
        const items = [...day.items]
        const [moved] = items.splice(fromIndex, 1)
        items.splice(toIndex, 0, moved)
        return { ...day, items }
      }),
    }))
  }, [])

  const togglePack = useCallback((id: string) => {
    setTrip((prev) => ({
      ...prev,
      packing: prev.packing.map((p) =>
        p.id === id ? { ...p, checked: !p.checked } : p,
      ),
    }))
  }, [])

  const addPack = useCallback((name: string, category: PackCategory) => {
    const item: PackItem = {
      id: uid('pack'),
      name,
      category,
      checked: false,
    }
    setTrip((prev) => ({ ...prev, packing: [...prev.packing, item] }))
  }, [])

  const removePack = useCallback((id: string) => {
    setTrip((prev) => ({
      ...prev,
      packing: prev.packing.filter((p) => p.id !== id),
    }))
  }, [])

  const setTotalBudget = useCallback((amount: number) => {
    setTrip((prev) => ({ ...prev, totalBudget: amount }))
  }, [])

  const addBudget = useCallback(
    (data: { title: string; amount: number; category: BudgetCategory; date?: string }) => {
      const entry: BudgetEntry = {
        id: uid('budget'),
        title: data.title,
        amount: data.amount,
        category: data.category,
        date: data.date,
      }
      setTrip((prev) => ({ ...prev, budget: [...prev.budget, entry] }))
    },
    [],
  )

  const removeBudget = useCallback((id: string) => {
    setTrip((prev) => ({
      ...prev,
      budget: prev.budget.filter((b) => b.id !== id),
    }))
  }, [])

  return {
    trip,
    resetTrip,
    replaceTrip,
    toggleItemDone,
    addItem,
    removeItem,
    updateItem,
    moveItem,
    togglePack,
    addPack,
    removePack,
    setTotalBudget,
    addBudget,
    removeBudget,
  }
}

export type TripStore = ReturnType<typeof useTripStore>
