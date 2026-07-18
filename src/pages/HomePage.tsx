import { useMemo } from 'react'
import type { TripState } from '../types'
import type { AppMode } from '../utils/backup'
import { daysUntil, formatDateLabel, navToUrl, tripDayCount } from '../utils/format'
import { datesMissingHotel, summarizeHotelsFromDays } from '../utils/hotels'

interface Props {
  trip: TripState
  onReset: () => void
  mode: AppMode
}

export function HomePage({ trip, onReset, mode }: Props) {
  const isGo = mode === 'go'
  const countdown = daysUntil(trip.startDate)
  const totalDays = tripDayCount(trip.startDate, trip.endDate)
  const countdownText =
    countdown > 0 ? `還有 ${countdown} 天出發` : countdown === 0 ? '今天出發！' : '旅途進行中／已結束'

  const hotels = useMemo(() => summarizeHotelsFromDays(trip.days), [trip.days])
  const missingHotelDates = useMemo(() => datesMissingHotel(trip.days), [trip.days])

  return (
    <section id="overview" className="block">
      <header className="hero">
        <div className="hero-bg" aria-hidden />
        <h1 className="hero-brand">{trip.title}</h1>
        <p className="hero-sub">{trip.subtitle}</p>
        <a className="hero-cta" href="#days">
          {isGo ? '今天行程 →' : '查看每日行程 →'}
        </a>
      </header>

      <div className="meta-row">
        <span className="chip">
          <strong>
            {formatDateLabel(trip.startDate)} – {formatDateLabel(trip.endDate)}
          </strong>
        </span>
        <span className="chip">
          <strong>{totalDays} 天</strong> 旅程
        </span>
        <span className="chip">
          <strong>{countdownText}</strong>
        </span>
      </div>

      <div className="section">
        <h2 className="section-title">航班</h2>
        {trip.flights.map((f) => (
          <div key={f.id} className="flight-block">
            <div className="flight-label">
              {f.label} · {f.flightNo}
            </div>
            <div className="flight-route">
              <span>
                {f.fromCode} {f.fromName}
              </span>
              <span aria-hidden>→</span>
              <span>
                {f.toCode} {f.toName}
              </span>
            </div>
            <div className="flight-meta">
              {f.airline}
              <br />
              出發 {f.departAt} · 抵達 {f.arriveAt}
            </div>
          </div>
        ))}
      </div>

      <div className="section">
        <h2 className="section-title">住宿</h2>
        <p className="hotel-note" style={{ marginBottom: 12 }}>
          依「行程」裡類型為住宿的項目自動整理
        </p>
        {hotels.length === 0 ? (
          <div className="empty-day">尚未加入住宿 — 到行程新增，類型選「住宿」</div>
        ) : (
          hotels.map((h) => (
            <div key={h.id} className="hotel-block">
              <p className="hotel-name">{h.name}</p>
              <p className="hotel-note">
                {h.nights.length} 晚
                {h.nights.length > 0 &&
                  ` · ${h.nights.map((n) => formatDateLabel(n)).join('、')}`}
                {h.note ? ` · ${h.note}` : ''}
              </p>
              <a
                className="link-btn"
                href={navToUrl(h.mapsQuery)}
                target="_blank"
                rel="noreferrer"
              >
                Google 導航
              </a>
            </div>
          ))
        )}
        {missingHotelDates.length > 0 && (
          <p className="hotel-note" style={{ marginTop: 12 }}>
            尚未安排住宿：
            {missingHotelDates.map((d) => formatDateLabel(d)).join('、')}
          </p>
        )}
      </div>

      <div className="section">
        <h2 className="section-title">頁面導覽</h2>
        <div className="quick-links">
          <a className="quick-link" href="#days">
            <span>每日行程</span>
            <small>{isGo ? '勾選・導航' : '新增景點・一鍵導航'}</small>
          </a>
          {!isGo && (
            <a className="quick-link" href="#pack">
              <span>行李清單</span>
              <small>含登山裝備</small>
            </a>
          )}
          <a className="quick-link" href="#budget">
            <span>預算記帳</span>
            <small>{isGo ? '快速記一筆' : '即時合計'}</small>
          </a>
          <a className="quick-link" href="#phrases">
            <span>日文翻譯</span>
            <small>點一下複製</small>
          </a>
        </div>
      </div>

      {!isGo && (
        <button
          type="button"
          className="reset-btn"
          onClick={() => {
            if (confirm('確定要清除本機修改、恢復預設行程？')) onReset()
          }}
        >
          重置為預設資料
        </button>
      )}
    </section>
  )
}
