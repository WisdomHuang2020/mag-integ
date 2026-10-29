import { Link } from 'react-router-dom'
import { ArrowRight, Blocks, BookOpen, Calculator, ExternalLink, FileText, LineChart, Ruler, Waves } from 'lucide-react'

const FEATURES = [
  {
    icon: Waves,
    title: '磁路分配：Lr 拆成两路',
    desc: '所需谐振电感 = 变压器固有漏感 + 副磁芯补齐电感。这是磁集成的核心，本工具把它算清并可视化。',
    to: '/designer',
    accent: 'text-primary-light',
  },
  {
    icon: Blocks,
    title: '磁集成方案选型',
    desc: '外挂 / 边柱解耦 / 磁芯组合 / 变压器成组，四类结构逐一对比结构与代价。',
    to: '/schemes',
    accent: 'text-accent',
  },
  {
    icon: Ruler,
    title: '气隙与漏感设计',
    desc: '主磁芯气隙锁定 Lm，副磁芯气隙调节 Lr；漏感由绕组间距与厚度直接决定。',
    to: '/designer',
    accent: 'text-primary-light',
  },
  {
    icon: LineChart,
    title: '磁件特性曲线',
    desc: '漏感随间距变化、电感随气隙变化、交流因子随频率变化——调参时磁件会怎么动，一目了然。',
    to: '/curves',
    accent: 'text-accent',
  },
  {
    icon: BookOpen,
    title: '磁路模型与公式',
    desc: '每条公式标注「文献 / 公开公式 / 工程近似」，并写明假设与失效边界。',
    to: '/derivations',
    accent: 'text-primary-light',
  },
  {
    icon: FileText,
    title: '磁件设计报告',
    desc: '含磁路分配、几何尺寸、气隙、损耗与诊断的完整报告，可打印或存 PDF。',
    to: '/report',
    accent: 'text-accent',
  },
]

/** Hero 背景：网格底纹 + 磁路抽象示意（纯装饰，不承载信息） */
function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.07]"
        viewBox="0 0 1200 600"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="mg-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#mg-grid)" className="text-primary-light" />

        {/* 主磁芯轮廓 + 中柱气隙 */}
        <g className="text-primary-light" stroke="currentColor" fill="none" strokeWidth="2">
          <rect x="430" y="180" width="340" height="240" rx="8" opacity="0.35" />
          <line x1="600" y1="180" x2="600" y2="270" opacity="0.45" />
          <line x1="600" y1="330" x2="600" y2="420" opacity="0.45" />
          <circle cx="600" cy="300" r="26" opacity="0.5">
            <animate attributeName="r" values="26;32;26" dur="5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0.2;0.5" dur="5s" repeatCount="indefinite" />
          </circle>
          <rect x="360" y="285" width="70" height="30" rx="15" opacity="0.4" />
          <rect x="770" y="285" width="70" height="30" rx="15" opacity="0.4" />
        </g>
      </svg>
    </div>
  )
}

/** Hero 右侧：磁集成结构示意（简化静态版，装饰用） */
function HeroDiagram() {
  return (
    <svg viewBox="0 0 460 300" className="w-full max-w-[480px] h-auto" aria-hidden="true">
      <defs>
        <linearGradient id="mgHeroCoreGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#404040" />
          <stop offset="100%" stopColor="#262626" />
        </linearGradient>
      </defs>

      {/* 主磁芯 */}
      <rect x="70" y="40" width="26" height="160" rx="3" fill="url(#mgHeroCoreGrad)" stroke="#525252" />
      <rect x="214" y="40" width="26" height="160" rx="3" fill="url(#mgHeroCoreGrad)" stroke="#525252" />
      <rect x="70" y="40" width="170" height="24" rx="3" fill="url(#mgHeroCoreGrad)" stroke="#525252" />
      <rect x="70" y="176" width="170" height="24" rx="3" fill="url(#mgHeroCoreGrad)" stroke="#525252" />
      <rect x="96" y="40" width="118" height="4" fill="#0a0a0a" />
      <rect x="96" y="196" width="118" height="4" fill="#0a0a0a" />
      <text x="155" y="30" textAnchor="middle" fill="#a3a3a3" fontSize="11">
        主磁芯 A
      </text>
      <text x="155" y="222" textAnchor="middle" fill="#737373" fontSize="10">
        主气隙 lg,A → Lm
      </text>

      {/* 原边绕组 */}
      <rect x="62" y="70" width="42" height="16" rx="3" fill="#14b8a6" />
      <rect x="62" y="100" width="42" height="16" rx="3" fill="#14b8a6" />
      <rect x="62" y="130" width="42" height="16" rx="3" fill="#14b8a6" />
      <text x="34" y="112" textAnchor="middle" fill="#14b8a6" fontSize="10">
        原边 Np
      </text>

      {/* 副边绕组 */}
      <rect x="246" y="88" width="36" height="14" rx="3" fill="#f59e0b" />
      <rect x="246" y="114" width="36" height="14" rx="3" fill="#f59e0b" />
      <text x="300" y="102" fill="#f59e0b" fontSize="10">
        副边 Ns
      </text>

      {/* 副磁芯 */}
      <rect x="330" y="60" width="70" height="22" rx="3" fill="url(#mgHeroCoreGrad)" stroke="#525252" />
      <rect x="330" y="140" width="70" height="22" rx="3" fill="url(#mgHeroCoreGrad)" stroke="#525252" />
      <rect x="330" y="82" width="70" height="58" rx="3" fill="url(#mgHeroCoreGrad)" stroke="#525252" />
      <rect x="330" y="82" width="70" height="10" fill="#0a0a0a" stroke="#f59e0b" strokeDasharray="2 2" />
      <text x="365" y="50" textAnchor="middle" fill="#a3a3a3" fontSize="11">
        副磁芯 B
      </text>
      <text x="365" y="182" textAnchor="middle" fill="#f59e0b" fontSize="10">
        副气隙 lg,B → Lr
      </text>
      <path d="M 300 120 L 326 120" stroke="#525252" strokeWidth="2" />
    </svg>
  )
}

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* ══════════ Hero ══════════ */}
      <section className="relative w-full bg-bg overflow-hidden border-b border-border">
        <HeroBackground />
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-24 lg:py-28">
          <div className="flex flex-col lg:flex-row items-center gap-10 xl:gap-16">
            <div className="flex-1 max-w-3xl">
              <div className="flex items-center gap-2 mb-6 fade-up fade-up-1">
                <div className="w-10 h-10 rounded-lg bg-primary-dark/40 flex items-center justify-center">
                  <Waves className="w-5 h-5 text-primary-light" />
                </div>
                <span className="text-primary-light font-medium text-sm tracking-wider uppercase">
                  Magnetic Integration
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary tracking-tight leading-tight mb-6 fade-up fade-up-2">
                磁集成 LLC
                <br />
                <span className="text-gradient">变压器设计</span>
              </h1>

              <p className="text-lg md:text-xl text-text-secondary leading-relaxed mb-6 max-w-2xl fade-up fade-up-3">
                谐振腔参数已经定了，怎么把它做进一个磁芯里？
                本工具专注这一步：把 Lr 与 Lm 拆到两条磁路上，算出气隙、匝数、窗口与损耗。
              </p>

              <div className="flex flex-wrap gap-4 fade-up fade-up-4">
                <Link
                  to="/designer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-light transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Calculator className="w-4 h-4" />
                  开始磁件设计
                </Link>
                <Link
                  to="/schemes"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-surface-elevated text-text-primary border border-border rounded-lg font-medium text-sm hover:border-border-light hover:bg-surface transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Blocks className="w-4 h-4" />
                  先看磁集成方案
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="hidden lg:flex flex-1 items-center justify-center max-w-xl fade-up fade-up-3">
              <HeroDiagram />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ 边界声明 ══════════ */}
      <section className="mx-auto max-w-6xl px-4 pt-12 w-full">
        <div className="rounded-xl border border-accent/25 bg-accent/[0.05] p-5">
          <h2 className="text-[13px] font-semibold text-accent">先说清楚边界：本工具不重复 LLC 电路设计</h2>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px] leading-relaxed">
            <div className="rounded-lg border border-border bg-bg/40 p-3">
              <div className="font-medium text-text-primary mb-1.5">这些请用参考站</div>
              <ul className="space-y-1 text-text-secondary">
                <li>· 谐振基础、LLC 拓扑与工作原理</li>
                <li>· ZVS 条件、关键波形</li>
                <li>· FHA 增益方程推导、输入阻抗</li>
                <li>· 增益曲线与感容分界</li>
                <li>· 谐振腔参数（Lr / Cr / Lm / Q / k）选取</li>
              </ul>
              <a
                href="https://www.llc.power-knowledge.tech"
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-primary-light hover:text-accent transition-colors"
              >
                llc.power-knowledge.tech <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="rounded-lg border border-primary/30 bg-primary/[0.04] p-3">
              <div className="font-medium text-primary-light mb-1.5">这些才是本工具要做的</div>
              <ul className="space-y-1 text-text-primary">
                <li>· 把 Lr 拆成「固有漏感 + 副磁芯电感」</li>
                <li>· 主磁芯气隙锁 Lm / 副磁芯气隙调 Lr</li>
                <li>· 绕组几何 → 漏感的定量关系</li>
                <li>· 匝数、窗口、磁密、面积积核算</li>
                <li>· 磁集成特有的损耗（含副磁芯铁损）与诊断</li>
              </ul>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-text-muted">
            默认算例与参考站保持一致（400 V → 24 V / 96 W，100 kHz 半桥，k = 4，Q 降额 0.857），
            两边的结果可以直接衔接。
          </p>
        </div>
      </section>

      {/* ══════════ 特性卡 ══════════ */}
      <section className="mx-auto max-w-6xl px-4 py-12 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc, to, accent }) => (
            <Link
              key={title}
              to={to}
              className="group rounded-xl border border-border bg-surface p-4 hover:border-primary-light/40 hover:bg-surface-elevated transition-colors"
            >
              <span className="inline-grid place-items-center w-9 h-9 rounded-lg bg-primary-dark/30">
                <Icon size={17} className={accent} />
              </span>
              <h3 className="mt-3 text-[13px] font-semibold text-text-primary">{title}</h3>
              <p className="mt-1.5 text-[11px] leading-relaxed text-text-muted">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ══════════ 核心判据 ══════════ */}
      <section className="mx-auto max-w-6xl px-4 pb-12 w-full">
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-[13px] font-semibold text-text-primary">一个绕不开的判据</h2>
          <p className="mt-2 text-[12px] leading-relaxed text-text-secondary">
            王鑫(2020) 2.4.1 节指出：直接拿变压器原边漏感充当谐振电感，
            <strong className="text-text-primary">只适用于谐振电感远小于励磁电感的场合</strong>；
            谐振电感需求一大，副边漏感就会失控，不再满足 LLC 的工作需求。
            所以本工具的磁件设计卡会直接把两个数摆在一起——
            <span className="mx-1 text-accent">固有漏感</span>与
            <span className="mx-1 text-primary-light">所需 Lr</span>
            ，缺口有多大、副磁芯要补多少，一眼可见。
          </p>
          <Link
            to="/designer"
            className="mt-3 inline-flex items-center gap-1 text-[12px] text-primary-light hover:text-accent transition-colors"
          >
            在设计器里看这个缺口 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
