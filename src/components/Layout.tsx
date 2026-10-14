import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Blocks, BookOpen, Calculator, ExternalLink, FileText, Home, LineChart } from 'lucide-react'
import BrandMark from './BrandMark'

const NAV = [
  { to: '/', label: '首页', icon: Home },
  { to: '/designer', label: '磁件设计', icon: Calculator },
  { to: '/schemes', label: '磁集成方案', icon: Blocks },
  { to: '/curves', label: '磁件特性', icon: LineChart },
  { to: '/derivations', label: '磁路模型', icon: BookOpen },
  { to: '/report', label: '设计报告', icon: FileText },
]

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 border-b border-neutral-700 bg-neutral-950/85 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 h-14 flex items-center gap-6">
          <div className="flex items-center gap-2 shrink-0">
            <BrandMark className="w-8 h-8" />
            <div className="leading-tight">
              <div className="text-sm font-semibold text-neutral-100">磁集成 LLC 变压器设计</div>
              <div className="text-[10px] text-neutral-500 tracking-wide">
                MAGNETIC-INTEGRATED TRANSFORMER DESIGN
              </div>
            </div>
          </div>
          <nav className="flex items-center gap-1 overflow-x-auto">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-teal-500/15 text-teal-300'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
                  }`
                }
              >
                <Icon size={14} />
                {label}
              </NavLink>
            ))}
          </nav>
          <a
            href="https://www.llc.power-knowledge.tech"
            target="_blank"
            rel="noreferrer"
            className="ml-auto hidden lg:flex items-center gap-1 text-[11px] text-neutral-500 hover:text-teal-300 shrink-0"
            title="LLC 电路设计与理论推导请用参考站"
          >
            LLC 电路设计 <ExternalLink size={11} />
          </a>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-neutral-700 bg-neutral-950/60">
        <div className="mx-auto max-w-7xl px-4 py-5 text-[11px] text-neutral-500 leading-relaxed">
          <div className="flex items-center gap-2 mb-1">
            <BrandMark className="w-4 h-4" />
            <span>磁集成 LLC 变压器设计工具 · v{__APP_VERSION__}</span>
          </div>
          <div>
            职责边界：LLC 拓扑原理、FHA 增益推导、ZVS 条件与谐振腔参数选取由参考站
            <a
              href="https://www.llc.power-knowledge.tech"
              target="_blank"
              rel="noreferrer"
              className="mx-1 text-teal-400/80 hover:text-teal-300"
            >
              llc.power-knowledge.tech
            </a>
            覆盖；本工具只负责把这些参数落到磁芯上（磁路分配 / 气隙 / 漏感 / 匝数与损耗）。
          </div>
          <div className="mt-1">
            理论依据来自本地文献库 8 篇学位论文（见「磁路模型」页）。磁路与损耗模型均为工程近似，
            定型前请以有限元仿真与样机实测为准。
          </div>
        </div>
      </footer>
    </div>
  )
}
