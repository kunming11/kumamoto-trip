export function mapsUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

/** Open Google Maps navigation to a destination (from current location). */
export function navToUrl(
  destination: string,
  travelmode: 'driving' | 'walking' | 'transit' = 'driving',
): string {
  const params = new URLSearchParams({
    api: '1',
    destination,
    travelmode,
  })
  return `https://www.google.com/maps/dir/?${params.toString()}`
}

/** Open Google Maps directions from origin to destination. */
export function directionsUrl(
  origin: string,
  destination: string,
  travelmode: 'driving' | 'walking' | 'transit' = 'driving',
): string {
  const params = new URLSearchParams({
    api: '1',
    origin,
    destination,
    travelmode,
  })
  return `https://www.google.com/maps/dir/?${params.toString()}`
}

export function formatDateLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`)
  const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
  const m = d.getMonth() + 1
  const day = d.getDate()
  return `${m}/${day}（${week}）`
}

export function daysUntil(startDate: string): number {
  const start = new Date(`${startDate}T00:00:00`)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function tripDayCount(start: string, end: string): number {
  const a = new Date(`${start}T00:00:00`)
  const b = new Date(`${end}T00:00:00`)
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)) + 1
}
