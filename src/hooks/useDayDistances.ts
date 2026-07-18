import { useEffect, useState } from 'react'
import type { ItineraryItem } from '../types'
import {
  computeSegments,
  geocodeMany,
  type Coords,
  type SegmentDistance,
} from '../utils/geo'

export interface DayRoutePoint {
  id: string
  title: string
  query: string
  type?: string
  coords: Coords
}

interface DayDistancesState {
  loading: boolean
  error: string | null
  points: DayRoutePoint[]
  segments: SegmentDistance[]
  missing: string[]
}

export function useDayDistances(items: ItineraryItem[]): DayDistancesState {
  const [state, setState] = useState<DayDistancesState>({
    loading: false,
    error: null,
    points: [],
    segments: [],
    missing: [],
  })

  const signature = items
    .map((i) => `${i.id}:${i.mapsQuery || i.title}`)
    .join('|')

  useEffect(() => {
    let cancelled = false

    async function run() {
      const withPlace = items.filter((i) => (i.mapsQuery || i.title).trim())
      if (withPlace.length === 0) {
        setState({
          loading: false,
          error: null,
          points: [],
          segments: [],
          missing: [],
        })
        return
      }

      setState((prev) => ({ ...prev, loading: true, error: null }))

      try {
        const geoMap = await geocodeMany(
          withPlace.map((i) => ({
            id: i.id,
            query: (i.mapsQuery || i.title).trim(),
            title: i.title,
          })),
        )

        if (cancelled) return

        const points: DayRoutePoint[] = []
        const missing: string[] = []
        for (const item of withPlace) {
          const coords = geoMap.get(item.id)
          if (coords) {
            points.push({
              id: item.id,
              title: item.title,
              query: (item.mapsQuery || item.title).trim(),
              type: item.type,
              coords,
            })
          } else {
            missing.push(item.title)
          }
        }

        const segments =
          points.length >= 2 ? await computeSegments(points) : []

        if (cancelled) return

        setState({
          loading: false,
          error: null,
          points,
          segments,
          missing,
        })
      } catch {
        if (!cancelled) {
          setState({
            loading: false,
            error: '距離計算失敗，請稍後再試',
            points: [],
            segments: [],
            missing: [],
          })
        }
      }
    }

    void run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- signature captures item places
  }, [signature])

  return state
}
