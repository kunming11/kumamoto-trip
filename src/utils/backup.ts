import type { TripState } from '../types'

export const TRIP_STORAGE_KEY = 'kumamoto-trip-v2'
export const MODE_STORAGE_KEY = 'kumamoto-app-mode-v1'

export type AppMode = 'plan' | 'go'

export interface BackupPayload {
  version: 1
  exportedAt: string
  trip: TripState
}

export function isValidTrip(data: unknown): data is TripState {
  if (!data || typeof data !== 'object') return false
  const t = data as TripState
  return (
    typeof t.title === 'string' &&
    typeof t.startDate === 'string' &&
    typeof t.endDate === 'string' &&
    Array.isArray(t.days) &&
    Array.isArray(t.flights) &&
    Array.isArray(t.packing) &&
    Array.isArray(t.budget)
  )
}

export function buildBackup(trip: TripState): BackupPayload {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    trip,
  }
}

export function serializeBackup(trip: TripState): string {
  return JSON.stringify(buildBackup(trip), null, 2)
}

export function parseBackup(raw: string): TripState {
  const trimmed = raw.trim()
  if (!trimmed) throw new Error('內容是空的')

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    throw new Error('不是有效的 JSON')
  }

  // Accept either full backup payload or raw trip object
  if (parsed && typeof parsed === 'object' && 'trip' in (parsed as object)) {
    const payload = parsed as BackupPayload
    if (!isValidTrip(payload.trip)) throw new Error('備份格式不正確（缺少行程資料）')
    return payload.trip
  }

  if (!isValidTrip(parsed)) throw new Error('備份格式不正確')
  return parsed
}

export function downloadBackup(trip: TripState) {
  const text = serializeBackup(trip)
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `kumamoto-trip-backup-${stamp}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/** Index of today's day in trip, or nearest upcoming, or last past day. */
export function resolveTodayDayIndex(days: { date: string }[]): number {
  if (days.length === 0) return 0
  const today = new Date()
  const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const exact = days.findIndex((d) => d.date === key)
  if (exact >= 0) return exact

  const upcoming = days.findIndex((d) => d.date > key)
  if (upcoming >= 0) return upcoming

  return days.length - 1
}
