import type { AppMode } from '../utils/backup'

const ALL_LINKS = [
  { href: '#overview', label: '總覽' },
  { href: '#days', label: '行程' },
  { href: '#pack', label: '行李', planOnly: true },
  { href: '#budget', label: '預算' },
  { href: '#phrases', label: '日文' },
]

interface Props {
  mode: AppMode
  onToggleMode: () => void
  onOpenBackup: () => void
}

export function SiteNav({ mode, onToggleMode, onOpenBackup }: Props) {
  const links = ALL_LINKS.filter((l) => mode === 'plan' || !l.planOnly)

  return (
    <header className="site-nav">
      <a className="site-nav-brand" href="#overview">
        熊本之旅
      </a>
      <div className="site-nav-right">
        <button
          type="button"
          className={`mode-toggle${mode === 'go' ? ' go' : ''}`}
          onClick={onToggleMode}
          title={mode === 'plan' ? '切換到旅途模式' : '切換到規劃模式'}
        >
          {mode === 'plan' ? '規劃' : '旅途'}
        </button>
        <button
          type="button"
          className="nav-icon-btn"
          onClick={onOpenBackup}
          aria-label="備份與還原"
          title="備份與還原"
        >
          備份
        </button>
        <nav className="site-nav-links" aria-label="頁面導覽">
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}
