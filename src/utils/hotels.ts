import type { DayPlan, Hotel } from '../types'

/** Build accommodation summary from itinerary items typed as hotel. */
export function summarizeHotelsFromDays(days: DayPlan[]): Hotel[] {
  const map = new Map<string, Hotel>()

  for (const day of days) {
    for (const item of day.items) {
      if (item.type !== 'hotel') continue

      const place = (item.mapsQuery || item.title).trim()
      if (!place) continue

      const key = place.toLowerCase()
      const displayName = item.title.replace(/^入住\s*/u, '').trim() || place
      const existing = map.get(key)

      if (existing) {
        if (!existing.nights.includes(day.date)) {
          existing.nights.push(day.date)
        }
        if (item.note && !existing.note) {
          existing.note = item.note
        }
      } else {
        map.set(key, {
          id: `hotel-${key}`,
          name: displayName,
          nights: [day.date],
          mapsQuery: place,
          note: item.note,
        })
      }
    }
  }

  return Array.from(map.values())
    .map((h) => ({
      ...h,
      nights: [...h.nights].sort(),
    }))
    .sort((a, b) => a.nights[0].localeCompare(b.nights[0]))
}

/** Dates that have no hotel item (excludes last day — usually departure). */
export function datesMissingHotel(days: DayPlan[]): string[] {
  if (days.length === 0) return []
  const lastDate = days[days.length - 1]?.date
  return days
    .filter((day) => day.date !== lastDate)
    .filter((day) => !day.items.some((item) => item.type === 'hotel'))
    .map((day) => day.date)
}
