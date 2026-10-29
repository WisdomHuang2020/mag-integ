import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Blocks, BookOpen, Calculator, ExternalLink, FileText, Home, LineChart, Menu, X } from 'lucide-react'
import BrandMark from './BrandMark'

const navLinks = [
  { path: '/', label: '首页', icon: Home },
  { path: '/designer', label: '磁件设计', icon: Calculator },
  { path: '/schemes', label: '磁集成方案', icon: Blocks },
  { path: '/curves', label: '磁件特性', icon: LineChart },
  { path: '/derivations', label: '磁路模型', icon: BookOpen },
  { path: '/report', label: '设计报告', icon: FileText },
]

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-surface/95 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 text-text-primary hover:text-primary-light transition-colors shrink-0"
        >
          <BrandMark className="w-7 h-7" />
          <div className="leading-tight">
            <div className="font-bold text-[15px] tracking-tight">磁集成 LLC 变压器</div>
            <div className="text-[9px] text-text-muted tracking-wider hidden sm:block">
              MAGNETIC-INTEGRATED TRANSFORMER
            </div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path
            const Icon = link.icon
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? 'text-primary-light bg-primary-dark/30'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden lg:inline">{link.label}</span>
              </Link>
            )
          })}
        </nav>

        <a
          href="https://www.llc.power-knowledge.tech"
          target="_blank"
          rel="noreferrer"
          className="ml-3 hidden xl:inline-flex items-center gap-1.5 rounded-lg border border-accent/60 bg-accent/15 px-3 py-1.5 text-[12px] font-semibold text-accent shadow-[0_0_14px_-3px_rgba(245,158,11,0.45)] hover:bg-accent hover:text-neutral-950 hover:border-accent hover:shadow-[0_0_20px_-2px_rgba(245,158,11,0.6)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 shrink-0"
          title="LLC 电路设计与理论推导请用参考站"
        >
          LLC 电路设计
          <ExternalLink size={13} />
        </a>

        <button
          className="md:hidden p-2 text-text-secondary hover:text-text-primary"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="切换导航菜单"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-surface border-b border-border">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path
              const Icon = link.icon
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
                    isActive
                      ? 'text-primary-light bg-primary-dark/30'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                </Link>
              )
            })}
            <a
              href="https://www.llc.power-knowledge.tech"
              target="_blank"
              rel="noreferrer"
              className="mt-1 flex items-center gap-3 rounded-md border border-accent/40 bg-accent/10 px-3 py-2.5 text-sm font-medium text-accent hover:bg-accent/20"
            >
              <ExternalLink className="w-5 h-5" />
              LLC 电路设计（参考站）
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
