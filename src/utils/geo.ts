export interface Coords {
  lat: number
  lon: number
  label: string
}

export interface SegmentDistance {
  fromId: string
  toId: string
  fromTitle: string
  toTitle: string
  fromQuery: string
  toQuery: string
  straightKm: number
  driveKm: number | null
  driveMinutes: number | null
}

const GEO_CACHE_KEY = 'kumamoto-geo-cache-v1'

function loadCache(): Record<string, Coords> {
  try {
    const raw = localStorage.getItem(GEO_CACHE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, Coords>) : {}
  } catch {
    return {}
  }
}

function saveCache(cache: Record<string, Coords>) {
  localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(cache))
}

function cacheKey(query: string): string {
  return query.trim().toLowerCase()
}

/** Haversine straight-line distance in km */
export function haversineKm(a: Coords, b: Coords): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export function formatKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

export function formatMinutes(min: number): string {
  if (min < 60) return `約 ${Math.round(min)} 分`
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return m === 0 ? `約 ${h} 小時` : `約 ${h} 小時 ${m} 分`
}

async function geocodePhoton(query: string): Promise<Coords | null> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=3&lang=default`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = (await res.json()) as {
    features?: Array<{
      geometry: { coordinates: [number, number] }
      properties: { name?: string; country?: string; city?: string; state?: string }
    }>
  }
  const features = data.features ?? []
  // Prefer Japan results for this trip
  const preferred =
    features.find((f) => f.properties.country === 'Japan' || f.properties.country === '日本') ??
    features[0]
  if (!preferred) return null
  const [lon, lat] = preferred.geometry.coordinates
  return {
    lat,
    lon,
    label: preferred.properties.name ?? query,
  }
}

async function geocodeOpenMeteo(query: string): Promise<Coords | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=ja&format=json`
  const res = await fetch(url)
  if (!res.ok) return null
  const data = (await res.json()) as {
    results?: Array<{
      latitude: number
      longitude: number
      name: string
      country_code?: string
    }>
  }
  const results = data.results ?? []
  const preferred = results.find((r) => r.country_code === 'JP') ?? results[0]
  if (!preferred) return null
  return {
    lat: preferred.latitude,
    lon: preferred.longitude,
    label: preferred.name,
  }
}

export async function geocode(query: string): Promise<Coords | null> {
  const key = cacheKey(query)
  if (!key) return null
  const cache = loadCache()
  if (cache[key]) return cache[key]

  const variants = [
    query,
    query.replace(/\s+/g, ' '),
    // Help Japan place search
    `${query} 日本`,
    `${query} 熊本`,
    `${query} 鹿児島`,
  ]

  let coords: Coords | null = null
  for (const variant of variants) {
    try {
      coords = await geocodePhoton(variant)
    } catch {
      coords = null
    }
    if (coords) break
    try {
      coords = await geocodeOpenMeteo(variant)
    } catch {
      coords = null
    }
    if (coords) break
    await new Promise((r) => setTimeout(r, 200))
  }

  if (coords) {
    cache[key] = coords
    saveCache(cache)
  }
  return coords
}

export async function driveDistance(
  a: Coords,
  b: Coords,
): Promise<{ km: number; minutes: number } | null> {
  const url = `https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=false`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as {
      code?: string
      routes?: Array<{ distance: number; duration: number }>
    }
    if (data.code !== 'Ok' || !data.routes?.[0]) return null
    const route = data.routes[0]
    return {
      km: route.distance / 1000,
      minutes: route.duration / 60,
    }
  } catch {
    return null
  }
}

export async function geocodeMany(
  queries: Array<{ id: string; query: string; title: string }>,
): Promise<Map<string, Coords>> {
  const map = new Map<string, Coords>()
  for (const item of queries) {
    const coords = await geocode(item.query)
    if (coords) {
      map.set(item.id, { ...coords, label: item.title })
    }
    // Be polite to free geocoders
    await new Promise((r) => setTimeout(r, 350))
  }
  return map
}

export async function computeSegments(
  points: Array<{
    id: string
    title: string
    query: string
    coords: Coords
    type?: string
  }>,
): Promise<SegmentDistance[]> {
  const segments: SegmentDistance[] = []
  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i]
    const to = points[i + 1]
    const straightKm = haversineKm(from.coords, to.coords)
    const isFlight = from.type === 'flight' || to.type === 'flight'
    const drive = isFlight ? null : await driveDistance(from.coords, to.coords)
    segments.push({
      fromId: from.id,
      toId: to.id,
      fromTitle: from.title,
      toTitle: to.title,
      fromQuery: from.query,
      toQuery: to.query,
      straightKm,
      driveKm: drive?.km ?? null,
      driveMinutes: drive?.minutes ?? null,
    })
    if (!isFlight) await new Promise((r) => setTimeout(r, 200))
  }
  return segments
}
