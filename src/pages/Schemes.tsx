import { Link } from 'react-router-dom'
import type { ReactElement } from 'react'
import { Check, X } from 'lucide-react'

/**
 * 四类磁集成方案的对比。
 * 依据：王鑫《高频 LLC 变换器的平面磁集成变压器设计》(北京交通大学, 2020) 2.4.1 节。
 * 该文对四类方案逐一分析后，选用「磁芯组合集成」。
 */

interface Scheme {
  id: string
  name: string
  structure: string
  pros: string[]
  cons: string[]
  selected?: boolean
  svg: ReactElement
}

const SCHEMES: Scheme[] = [
  {
    id: 'external',
    name: '① 电感磁芯外挂 · 磁路解耦集成',
    structure: '谐振电感磁芯外挂到变压器主磁芯上，与变压器共用一条磁路，但两者磁通不耦合。',
    pros: ['磁路关系简单，便于理解与调试'],
    cons: ['绕组数量未减少', '磁性元件整体高度增加，不满足小型化需求'],
    svg: (
      <svg viewBox="0 0 300 150" className="w-full h-auto">
        <rect x="30" y="40" width="20" height="70" fill="#404040" stroke="#525252" />
        <rect x="110" y="40" width="20" height="70" fill="#404040" stroke="#525252" />
        <rect x="30" y="40" width="100" height="14" fill="#404040" stroke="#525252" />
        <rect x="30" y="96" width="100" height="14" fill="#404040" stroke="#525252" />
        <text x="80" y="30" textAnchor="middle" fill="#a3a3a3" fontSize="10">变压器磁芯</text>
        <rect x="170" y="55" width="20" height="40" fill="#262626" stroke="#f43f5e" strokeDasharray="3 2" />
        <rect x="215" y="55" width="20" height="40" fill="#262626" stroke="#f43f5e" strokeDasharray="3 2" />
        <text x="205" y="45" textAnchor="middle" fill="#f43f5e" fontSize="10">外挂电感磁芯</text>
        <path d="M 130 75 L 168 75" stroke="#737373" strokeWidth="2" />
        <text x="150" y="130" textAnchor="middle" fill="#737373" fontSize="9">共用磁路 · 磁通不耦合</text>
      </svg>
    ),
  },
  {
    id: 'side-leg',
    name: '② 磁芯边柱解耦集成',
    structure: '原副边绕组均绕中柱以增强耦合；两个边柱各绕相同匝数绕组，使边柱绕组在中柱产生的磁通相互抵消。',
    pros: ['适用于 LLC', '原副边耦合强，副边漏感小'],
    cons: ['边柱绕组占用窗口', '电感调节手段有限'],
    svg: (
      <svg viewBox="0 0 300 150" className="w-full h-auto">
        <rect x="40" y="40" width="18" height="70" fill="#404040" stroke="#525252" />
        <rect x="140" y="40" width="20" height="70" fill="#404040" stroke="#525252" />
        <rect x="242" y="40" width="18" height="70" fill="#404040" stroke="#525252" />
        <rect x="40" y="40" width="220" height="12" fill="#404040" stroke="#525252" />
        <rect x="40" y="98" width="220" height="12" fill="#404040" stroke="#525252" />
        <rect x="124" y="55" width="52" height="12" rx="2" fill="#f59e0b" />
        <rect x="124" y="82" width="52" height="12" rx="2" fill="#84cc16" />
        <rect x="34" y="60" width="30" height="10" rx="2" fill="#8b5cf6" />
        <rect x="236" y="60" width="30" height="10" rx="2" fill="#8b5cf6" />
        <text x="150" y="30" textAnchor="middle" fill="#a3a3a3" fontSize="10">中柱：原副边绕组</text>
        <text x="150" y="130" textAnchor="middle" fill="#8b5cf6" fontSize="9">边柱：等匝数绕组（磁通抵消）</text>
      </svg>
    ),
  },
  {
    id: 'core-combination',
    name: '③ 磁芯组合集成（本工具采用的模型）',
    structure:
      '磁芯 A 为主磁芯、磁芯 B 为副磁芯；原边绕在两对磁芯上，副边只绕主磁芯。主磁芯气隙取小以减小副边漏感，通过调节副磁芯气隙使原边漏感满足谐振电感需求。',
    pros: ['原副边漏感易于控制', '绕组数量少', '整体高度低', '公共磁柱磁通相消，铁损低'],
    cons: ['磁路设计需有限元复核', '副磁芯增加一处装配'],
    selected: true,
    svg: (
      <svg viewBox="0 0 300 150" className="w-full h-auto">
        <rect x="30" y="40" width="20" height="70" fill="#404040" stroke="#525252" />
        <rect x="120" y="40" width="20" height="70" fill="#404040" stroke="#525252" />
        <rect x="30" y="40" width="110" height="12" fill="#404040" stroke="#525252" />
        <rect x="30" y="98" width="110" height="12" fill="#404040" stroke="#525252" />
        <rect x="50" y="46" width="70" height="2" fill="#0a0a0a" />
        <text x="85" y="30" textAnchor="middle" fill="#a3a3a3" fontSize="10">主磁芯 A（气隙小）</text>
        <rect x="24" y="62" width="32" height="10" rx="2" fill="#f59e0b" />
        <rect x="24" y="80" width="32" height="10" rx="2" fill="#f59e0b" />
        <text x="12" y="80" fill="#f59e0b" fontSize="9" textAnchor="middle" transform="rotate(-90 12 80)">原边</text>
        <rect x="140" y="62" width="30" height="10" rx="2" fill="#84cc16" />
        <rect x="140" y="80" width="30" height="10" rx="2" fill="#84cc16" />
        <text x="185" y="80" fill="#84cc16" fontSize="9">副边（仅主磁芯）</text>
        <rect x="215" y="50" width="55" height="16" fill="#262626" stroke="#525252" />
        <rect x="215" y="86" width="55" height="16" fill="#262626" stroke="#525252" />
        <rect x="215" y="66" width="55" height="20" fill="#262626" stroke="#525252" />
        <rect x="215" y="70" width="55" height="6" fill="#0a0a0a" stroke="#f43f5e" strokeDasharray="2 2" />
        <text x="242" y="42" textAnchor="middle" fill="#f43f5e" fontSize="9">副磁芯 B（气隙可调→Lr）</text>
      </svg>
    ),
  },
  {
    id: 'grouping',
    name: '④ 变压器成组',
    structure:
      '把单个大功率变压器拆成多个小变压器：原边串联、副边各自构成整流后输出并联。单个变压器匝数与电流减半，窗口需求约减半，总体积基本不变。',
    pros: ['不增加总体积的前提下提高空间利用率', '降低单点高度，利于扁平化布局'],
    cons: ['器件数量增加', '均流与一致性需要设计保证'],
    svg: (
      <svg viewBox="0 0 300 150" className="w-full h-auto">
        <rect x="30" y="45" width="60" height="60" fill="#404040" stroke="#525252" />
        <rect x="110" y="45" width="60" height="60" fill="#404040" stroke="#525252" />
        <text x="60" y="80" textAnchor="middle" fill="#d4d4d4" fontSize="10">T1</text>
        <text x="140" y="80" textAnchor="middle" fill="#d4d4d4" fontSize="10">T2</text>
        <path d="M 10 75 L 30 75" stroke="#f59e0b" strokeWidth="2" />
        <path d="M 90 75 L 110 75" stroke="#f59e0b" strokeWidth="2" />
        <text x="10" y="60" fill="#f59e0b" fontSize="9">原边串联</text>
        <path d="M 60 105 L 60 128 L 140 128 L 140 105" stroke="#84cc16" strokeWidth="2" fill="none" />
        <path d="M 140 128 L 230 128" stroke="#84cc16" strokeWidth="2" />
        <text x="200" y="142" fill="#84cc16" fontSize="9">副边并联输出</text>
        <rect x="170" y="45" width="90" height="60" fill="none" stroke="#525252" strokeDasharray="3 3" />
        <text x="215" y="80" textAnchor="middle" fill="#737373" fontSize="9">整流 + 滤波</text>
      </svg>
    ),
  },
]

export default function Schemes() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-neutral-100">磁集成方案对比</h1>
        <p className="mt-2 max-w-3xl text-[12px] leading-relaxed text-neutral-400">
          把谐振电感与变压器集成起来有多条技术路线。下面四类归纳自王鑫
          《高频 LLC 变换器的平面磁集成变压器设计》（北京交通大学，2020）2.4.1 节；
          该文在逐一分析后选用了第 ③ 类「磁芯组合集成」，本工具的气隙—漏感分配模型也对应这一方案。
        </p>
      </header>

      <div className="space-y-5">
        {SCHEMES.map((s) => (
          <section
            key={s.id}
            className={`rounded-xl border p-5 ${
              s.selected ? 'border-teal-500/40 bg-teal-500/[0.04]' : 'border-neutral-800 bg-neutral-900/40'
            }`}
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-[14px] font-semibold text-neutral-100">{s.name}</h2>
              {s.selected && (
                <span className="rounded-full border border-teal-500/40 bg-teal-500/10 px-2.5 py-0.5 text-[10px] text-teal-300">
                  本工具采用
                </span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="rounded-lg border border-neutral-800 bg-neutral-950/50 p-3">{s.svg}</div>
              <div className="space-y-3">
                <p className="text-[12px] leading-relaxed text-neutral-300">{s.structure}</p>
                <div>
                  <div className="text-[11px] font-medium text-emerald-400 mb-1">优点</div>
                  <ul className="space-y-1">
                    {s.pros.map((p) => (
                      <li key={p} className="flex gap-1.5 text-[11px] text-neutral-400">
                        <Check size={12} className="mt-0.5 shrink-0 text-emerald-500" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-[11px] font-medium text-rose-400 mb-1">代价 / 局限</div>
                  <ul className="space-y-1">
                    {s.cons.map((c) => (
                      <li key={c} className="flex gap-1.5 text-[11px] text-neutral-400">
                        <X size={12} className="mt-0.5 shrink-0 text-rose-500" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900/40 p-5">
        <h2 className="text-[13px] font-semibold text-neutral-200">一个来自文献的关键判据</h2>
        <p className="mt-2 text-[12px] leading-relaxed text-neutral-400">
          王鑫(2020) 2.4.1 节指出：直接利用变压器原边漏感充当谐振电感，<strong className="text-neutral-200">仅适用于谐振电感远小于励磁电感的场合</strong>；
          当谐振电感需求较大时，这种做法的代价是副边漏感显著增大，不满足 LLC 的工作需求。
          本工具的「磁件设计」卡会直接给出「固有漏感」与「所需 Lr」两个数值——
          当前者小于后者时，缺口就必须由副磁芯（或外挂电感）承担，这正是磁集成的意义所在。
        </p>
        <Link to="/designer" className="mt-3 inline-block text-[12px] text-teal-400 hover:text-teal-300">
          在设计器中验证这一判据 →
        </Link>
      </div>
    </div>
  )
}
