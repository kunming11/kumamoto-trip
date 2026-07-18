import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { DayRoutePoint } from '../hooks/useDayDistances'
import type { SegmentDistance } from '../utils/geo'
import { formatKm, formatMinutes } from '../utils/geo'
import { directionsUrl, navToUrl } from '../utils/format'

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

interface Props {
  points: DayRoutePoint[]
  segments: SegmentDistance[]
  loading: boolean
  error: string | null
  missing: string[]
}

export function DayMap({ points, segments, loading, error, missing }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const layerRef = useRef<L.LayerGroup | null>(null)

  // Keep the map container always mounted so Leaflet can init reliably.
  useEffect(() => {
    const el = mapRef.current
    if (!el) return

    const map = L.map(el, {
      zoomControl: true,
      attributionControl: true,
    }).setView([32.8, 130.7], 9)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 18,
    }).addTo(map)

    layerRef.current = L.layerGroup().addTo(map)
    mapInstance.current = map

    // Fix blank tiles when container size was 0 at init
    const resize = () => map.invalidateSize()
    requestAnimationFrame(resize)
    const t1 = window.setTimeout(resize, 100)
    const t2 = window.setTimeout(resize, 400)
    window.addEventListener('resize', resize)

    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.removeEventListener('resize', resize)
      map.remove()
      mapInstance.current = null
      layerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapInstance.current
    const layer = layerRef.current
    if (!map || !layer) return

    layer.clearLayers()

    if (points.length === 0) {
      map.setView([32.8, 130.7], 9)
      requestAnimationFrame(() => map.invalidateSize())
      return
    }

    const latLngs: L.LatLngExpression[] = points.map((p) => [
      p.coords.lat,
      p.coords.lon,
    ])

    points.forEach((p, idx) => {
      const nav = navToUrl(p.query)
      L.marker([p.coords.lat, p.coords.lon])
        .bindPopup(
          `<strong>${idx + 1}. ${p.title}</strong><br/><a href="${nav}" target="_blank" rel="noreferrer">Google 導航到這裡</a>`,
        )
        .addTo(layer)
    })

    if (latLngs.length >= 2) {
      L.polyline(latLngs, {
        color: '#e04e1c',
        weight: 3,
        opacity: 0.85,
      }).addTo(layer)
      map.fitBounds(L.latLngBounds(latLngs).pad(0.25))
    } else {
      map.setView(latLngs[0], 13)
    }

    requestAnimationFrame(() => map.invalidateSize())
    window.setTimeout(() => map.invalidateSize(), 150)
  }, [points])

  const showHint = !loading && !error && points.length < 2

  return (
    <div className="day-map-panel">
      <div className="day-map-head">
        <h3>當日路線與距離</h3>
        {loading && <span className="map-status">計算中…</span>}
        {error && <span className="map-status error">{error}</span>}
      </div>

      <div className="day-map-canvas-wrap">
        <div ref={mapRef} className="day-map-canvas" />
        {showHint && (
          <div className="day-map-overlay">
            同一天至少 2 個有地名的行程，才會標出路線與距離。
          </div>
        )}
        {loading && (
          <div className="day-map-overlay soft">正在定位景點…</div>
        )}
      </div>

      {segments.length > 0 && (
        <ul className="distance-list">
          {segments.map((seg) => (
            <li key={`${seg.fromId}-${seg.toId}`}>
              <div className="dist-route">
                {seg.fromTitle} → {seg.toTitle}
              </div>
              <div className="dist-nums">
                {seg.driveKm != null ? (
                  <>
                    <strong>車程 {formatKm(seg.driveKm)}</strong>
                    {seg.driveMinutes != null && (
                      <span>・{formatMinutes(seg.driveMinutes)}</span>
                    )}
                    <span className="dist-straight">
                      （直線 {formatKm(seg.straightKm)}）
                    </span>
                  </>
                ) : (
                  <strong>直線距離 {formatKm(seg.straightKm)}</strong>
                )}
              </div>
              <a
                className="gmaps-nav-btn"
                href={directionsUrl(seg.fromQuery, seg.toQuery)}
                target="_blank"
                rel="noreferrer"
              >
                用 Google Maps 導航這段
              </a>
            </li>
          ))}
        </ul>
      )}

      {missing.length > 0 && (
        <p className="map-missing">
          找不到座標：{missing.join('、')}（可編輯行程，改用日文地名）
        </p>
      )}
    </div>
  )
}
