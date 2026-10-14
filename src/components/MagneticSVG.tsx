/**
 * 磁集成结构示意图（磁芯组合集成方案）
 *
 * 依据：王鑫(2020) 图 2-15「磁芯组合解耦集成结构图」的文字描述 ——
 *  磁芯 A 为主磁芯、磁芯 B 为副磁芯；原边绕在两对磁芯上，副边只绕在主磁芯上；
 *  主磁芯气隙较小（减小副边漏感），副磁芯气隙用于把原边漏感调到谐振电感需求量。
 *
 * 这是一个示意性结构图（非按比例），用于说明磁路分工，不代替工程图纸。
 */

import type { MagneticResult } from '../lib/types'

interface Props {
  magnetic?: MagneticResult
  scheme?: string
}

export function MagneticSVG({ magnetic, scheme }: Props) {
  const showAux = scheme === 'core-combination' || scheme === undefined
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
      <svg viewBox="0 0 460 300" className="w-full h-auto">
        <defs>
          <linearGradient id="coreGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
          <linearGradient id="cuGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>

        {/* ── 主磁芯（EE 型，中柱 + 两侧柱） ── */}
        <g>
          <rect x="70" y="40" width="26" height="160" rx="3" fill="url(#coreGrad)" stroke="#475569" />
          <rect x="214" y="40" width="26" height="160" rx="3" fill="url(#coreGrad)" stroke="#475569" />
          <rect x="70" y="40" width="170" height="24" rx="3" fill="url(#coreGrad)" stroke="#475569" />
          <rect x="70" y="176" width="170" height="24" rx="3" fill="url(#coreGrad)" stroke="#475569" />
          {/* 主磁芯气隙（小） */}
          <rect x="96" y="40" width="118" height="4" fill="#0b1220" />
          <rect x="96" y="196" width="118" height="4" fill="#0b1220" />
          <text x="155" y="30" textAnchor="middle" fill="#94a3b8" fontSize="11">
            主磁芯 A（EE 型）
          </text>
          <text x="155" y="222" textAnchor="middle" fill="#64748b" fontSize="10">
            主气隙 lg,A ↑Lm
          </text>
        </g>

        {/* ── 原边绕组（绕在两对磁芯上） ── */}
        <g>
          <rect x="62" y="70" width="42" height="16" rx="3" fill="url(#cuGrad)" />
          <rect x="62" y="100" width="42" height="16" rx="3" fill="url(#cuGrad)" />
          <rect x="62" y="130" width="42" height="16" rx="3" fill="url(#cuGrad)" />
          <text x="30" y="112" textAnchor="middle" fill="#f59e0b" fontSize="10">
            原边
          </text>
          <text x="30" y="124" textAnchor="middle" fill="#f59e0b" fontSize="10">
            Np
          </text>
        </g>

        {/* ── 副边绕组（只绕主磁芯） ── */}
        <g>
          <rect x="246" y="88" width="36" height="14" rx="3" fill="#84cc16" />
          <rect x="246" y="114" width="36" height="14" rx="3" fill="#84cc16" />
          <text x="300" y="102" fill="#84cc16" fontSize="10">
            副边 Ns
          </text>
          <text x="300" y="116" fill="#84cc16" fontSize="10">
            （仅主磁芯）
          </text>
        </g>

        {/* ── 副磁芯 B（可调气隙） ── */}
        {showAux && (
          <g>
            <rect x="330" y="60" width="70" height="22" rx="3" fill="url(#coreGrad)" stroke="#475569" />
            <rect x="330" y="140" width="70" height="22" rx="3" fill="url(#coreGrad)" stroke="#475569" />
            <rect x="330" y="82" width="70" height="58" rx="3" fill="url(#coreGrad)" stroke="#475569" />
            {/* 副磁芯气隙（可调，大） */}
            <rect x="330" y="82" width="70" height="10" fill="#0b1220" stroke="#f43f5e" strokeDasharray="2 2" />
            <text x="365" y="50" textAnchor="middle" fill="#94a3b8" fontSize="11">
              副磁芯 B
            </text>
            <text x="365" y="180" textAnchor="middle" fill="#f43f5e" fontSize="10">
              副气隙 lg,B → Lr
            </text>
            <path d="M 300 120 L 328 120" stroke="#475569" strokeWidth="2" markerEnd="url(#arrow)" />
          </g>
        )}

        {/* ── 标注 ── */}
        <g fontSize="10" fill="#64748b">
          <text x="20" y="262">磁路分工：</text>
          <text x="20" y="278">
            主磁芯承担励磁（Lm ↔ 主气隙），副磁芯承担谐振电感（Lr ↔ 副气隙），
          </text>
          <text x="20" y="292">公共磁柱上两路交变磁通方向相反 ⇒ 交变磁密降低 ⇒ 铁损下降。</text>
        </g>
      </svg>

      {magnetic && (
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
          <Stat label="主气隙 lg,A" value={`${fmt(magnetic.lgMain)} mm`} ok={magnetic.lgMainFeasible} />
          <Stat label="副气隙 lg,B" value={`${fmt(magnetic.lgAux)} mm`} ok={magnetic.lgAuxFeasible} />
          <Stat label="固有漏感" value={`${fmt(magnetic.leakageUh)} µH`} />
          <Stat label="副磁芯补偿" value={`${fmt(magnetic.auxInductanceUh)} µH`} />
        </div>
      )}
    </div>
  )
}

function fmt(v: number, d = 2) {
  return Number.isFinite(v) ? v.toFixed(d) : '—'
}

function Stat({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="rounded border border-slate-800 bg-slate-950/60 px-2 py-1.5">
      <div className="text-slate-500">{label}</div>
      <div className={`tabular font-medium ${ok === false ? 'text-rose-400' : 'text-slate-200'}`}>
        {value}
      </div>
    </div>
  )
}
