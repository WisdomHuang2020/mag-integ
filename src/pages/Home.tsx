import { Link } from 'react-router-dom'
import { ArrowRight, Blocks, BookOpen, ExternalLink, FileText, LineChart, Ruler, Waves } from 'lucide-react'

const FEATURES = [
  {
    icon: Waves,
    title: '磁路分配：Lr 拆成两路',
    desc: '所需谐振电感 = 变压器固有漏感 + 副磁芯补齐电感。这是磁集成的核心，本工具把它算清并可视化。',
    to: '/designer',
  },
  {
    icon: Blocks,
    title: '磁集成方案选型',
    desc: '外挂 / 边柱解耦 / 磁芯组合 / 变压器成组，四类结构逐一对比结构与代价。',
    to: '/schemes',
  },
  {
    icon: Ruler,
    title: '气隙与漏感设计',
    desc: '主磁芯气隙锁定 Lm，副磁芯气隙调节 Lr；漏感由绕组间距与厚度直接决定。',
    to: '/designer',
  },
  {
    icon: LineChart,
    title: '磁件特性曲线',
    desc: '漏感随间距变化、电感随气隙变化、交流因子随频率变化——调参时磁件会怎么动，一目了然。',
    to: '/curves',
  },
  {
    icon: BookOpen,
    title: '磁路模型与公式',
    desc: '每条公式标注「文献 / 公开公式 / 工程近似」，并写明假设与失效边界。',
    to: '/derivations',
  },
  {
    icon: FileText,
    title: '磁件设计报告',
    desc: '含磁路分配、几何尺寸、气隙、损耗与诊断的完整报告，可打印或存 PDF。',
    to: '/report',
  },
]

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <section className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-[11px] text-teal-300">
          <Waves size={12} /> 磁集成 · 平面变压器 · 磁路设计
        </span>
        <h1 className="mt-5 text-3xl sm:text-4xl font-bold text-neutral-100 leading-tight">
          磁集成 LLC 变压器设计
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[13px] leading-relaxed text-neutral-400">
          谐振腔参数已经定了，接下来怎么把它<strong className="text-neutral-300">做进一个磁芯里</strong>？
          本工具专注这一步：把 Lr 与 Lm 拆到两条磁路上，算出气隙、匝数、窗口与损耗。
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/designer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-500 px-4 py-2 text-[13px] font-medium text-neutral-950 hover:bg-teal-400 transition-colors"
          >
            开始磁件设计 <ArrowRight size={14} />
          </Link>
          <Link
            to="/schemes"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 px-4 py-2 text-[13px] text-neutral-300 hover:border-neutral-500 hover:text-neutral-100 transition-colors"
          >
            先看磁集成方案
          </Link>
        </div>
      </section>

      {/* ── 与参考站的分工，写在最显眼位置 ── */}
      <section className="mt-12 rounded-xl border border-amber-500/25 bg-amber-500/[0.05] p-5">
        <h2 className="text-[13px] font-semibold text-amber-200">先说清楚边界：本工具不重复 LLC 电路设计</h2>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px] leading-relaxed">
          <div className="rounded-lg border border-neutral-800 bg-neutral-950/40 p-3">
            <div className="font-medium text-neutral-300 mb-1.5">这些请用参考站</div>
            <ul className="space-y-1 text-neutral-400">
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
              className="mt-2 inline-flex items-center gap-1 text-teal-400 hover:text-teal-300"
            >
              llc.power-knowledge.tech <ExternalLink size={11} />
            </a>
          </div>
          <div className="rounded-lg border border-teal-500/25 bg-teal-500/[0.04] p-3">
            <div className="font-medium text-teal-200 mb-1.5">这些才是本工具要做的</div>
            <ul className="space-y-1 text-neutral-300">
              <li>· 把 Lr 拆成「固有漏感 + 副磁芯电感」</li>
              <li>· 主磁芯气隙锁 Lm / 副磁芯气隙调 Lr</li>
              <li>· 绕组几何 → 漏感的定量关系</li>
              <li>· 匝数、窗口、磁密、面积积核算</li>
              <li>· 磁集成特有的损耗（含副磁芯铁损）与诊断</li>
            </ul>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-neutral-500">
          默认算例与参考站保持一致（400 V → 24 V / 96 W，100 kHz 半桥，k = 4，Q 降额 0.857），
          两边的结果可以直接衔接。
        </p>
      </section>

      <section className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map(({ icon: Icon, title, desc, to }) => (
          <Link
            key={title}
            to={to}
            className="group rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 hover:border-teal-500/40 hover:bg-neutral-900/70 transition-colors"
          >
            <span className="inline-grid place-items-center w-9 h-9 rounded-lg bg-teal-500/10 text-teal-400">
              <Icon size={17} />
            </span>
            <h3 className="mt-3 text-[13px] font-semibold text-neutral-200">{title}</h3>
            <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-500">{desc}</p>
          </Link>
        ))}
      </section>

      <section className="mt-12 rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
        <h2 className="text-[13px] font-semibold text-neutral-200">一个绕不开的判据</h2>
        <p className="mt-2 text-[12px] leading-relaxed text-neutral-400">
          王鑫(2020) 2.4.1 节指出：直接拿变压器原边漏感充当谐振电感，
          <strong className="text-neutral-200">只适用于谐振电感远小于励磁电感的场合</strong>；
          谐振电感需求一大，副边漏感就会失控，不再满足 LLC 的工作需求。
          所以本工具的磁件设计卡会直接把两个数摆在一起——
          <span className="mx-1 text-amber-400">固有漏感</span>与
          <span className="mx-1 text-teal-400">所需 Lr</span>
          ，缺口有多大、副磁芯要补多少，一眼可见。
        </p>
        <Link to="/designer" className="mt-3 inline-flex items-center gap-1 text-[12px] text-teal-400 hover:text-teal-300">
          在设计器里看这个缺口 <ArrowRight size={13} />
        </Link>
      </section>
    </div>
  )
}
