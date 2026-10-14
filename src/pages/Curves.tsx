/**
 * 磁件特性曲线
 *
 * 定位：**不放 LLC 增益/阻抗曲线**（那是电路侧内容，见参考站 llc.power-knowledge.tech）。
 * 本页只画「磁件设计」自身的规律曲线 —— 这些曲线在 LLC 电路工具里是没有的，
 * 它们回答的是「调什么参数、磁件会怎么变」。
 */

import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { MU0, inductanceFromGap, leakageInductance } from '../lib/magneticDesign'
import { dowellFr, skinDepth } from '../lib/losses'
import { DEFAULT_INPUTS } from '../lib/types'

export default function Curves() {
  const inp = DEFAULT_INPUTS

  // 与默认算例衔接的磁件参数（可调）
  const [np, setNp] = useState(38)
  const [bw, setBw] = useState(inp.geomWindingWidth)
  const [lw, setLw] = useState(inp.geomMeanTurnLength)
  const [d1, setD1] = useState(inp.geomPrimaryThickness)
  const [d2, setD2] = useState(inp.geomSecondaryThickness)
  const [muR] = useState(2200)

  // 所需 Lr 的参考值（用默认算例的谐振腔量级）
  const [lrTarget, setLrTarget] = useState(60)

  // ── 图 1：漏感随原副边间距变化 ──
  const gapSweep = useMemo(() => {
    const arr: { d12: number; lk: number }[] = []
    for (let d12 = 0.1; d12 <= 2.001; d12 += 0.05) {
      const lk = leakageInductance(np, {
        windingWidth: bw,
        insulationGap: d12,
        primaryThickness: d1,
        secondaryThickness: d2,
        meanTurnLength: lw,
      })
      arr.push({ d12: Number(d12.toFixed(2)), lk: Number(lk.toFixed(2)) })
    }
    return arr
  }, [np, bw, lw, d1, d2])

  // ── 图 2：电感随气隙变化（主磁芯与副磁芯）──
  const gapInductance = useMemo(() => {
    const arr: { lg: number; main: number; aux: number }[] = []
    const auxAe = inp.coreAe * inp.auxAeRatio
    for (let lg = 0; lg <= 5.001; lg += 0.1) {
      arr.push({
        lg: Number(lg.toFixed(2)),
        main: Number(inductanceFromGap(lg, np, inp.coreAe, inp.coreLe, muR).toFixed(1)),
        aux: Number(inductanceFromGap(lg, np, auxAe, inp.coreLe, muR).toFixed(1)),
      })
    }
    return arr
  }, [np, inp.coreAe, inp.coreLe, inp.auxAeRatio, muR])

  // ── 图 3：绕组交流因子随频率变化（Dowell）──
  const frSweep = useMemo(() => {
    const arr: { f: number; fr: number; delta: number }[] = []
    const h = inp.geomPrimaryThickness
    for (let f = 20; f <= 500.0001; f += 10) {
      const d = skinDepth(f * 1e3)
      const delta = d > 0 ? h / d : 0
      arr.push({
        f: Number(f.toFixed(0)),
        fr: Number(dowellFr(delta).toFixed(3)),
        delta: Number(delta.toFixed(3)),
      })
    }
    return arr
  }, [inp.geomPrimaryThickness])

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-neutral-100">磁件特性曲线</h1>
        <p className="mt-2 text-[12px] leading-relaxed text-neutral-400">
          只画磁件自身的规律：<strong className="text-neutral-300">调绕组间距 → 漏感怎么变</strong>、
          <strong className="text-neutral-300">调气隙 → 电感怎么变</strong>、
          <strong className="text-neutral-300">升频率 → 交流电阻怎么涨</strong>。
          LLC 的增益曲线与阻抗相位属于电路侧内容，请见参考站。
        </p>
      </header>

      <Controls
        np={np}
        setNp={setNp}
        bw={bw}
        setBw={setBw}
        lw={lw}
        setLw={setLw}
        d1={d1}
        setD1={setD1}
        d2={d2}
        setD2={setD2}
        lrTarget={lrTarget}
        setLrTarget={setLrTarget}
      />

      <Panel
        title="① 漏感 Lk 随原副边间距 d₁₂ 的变化 —— 漏感设计的直接手段"
        note={`Lk = μ0·Np²·(lw/bw)·(d₁/3 + d₁₂ + d₂/3)，Np = ${np} 匝。橙线为当前谐振腔所需的 Lr 参考值，交点即目标间距。`}
      >
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={gapSweep} margin={{ top: 10, right: 20, bottom: 6, left: -14 }}>
            <CartesianGrid stroke="#262626" strokeDasharray="3 3" />
            <XAxis dataKey="d12" type="number" domain={[0.1, 2]} stroke="#737373" tick={{ fontSize: 11 }} label={{ value: '原副边间距 d₁₂ (mm)', position: 'insideBottomRight', offset: -2, fill: '#737373', fontSize: 11 }} />
            <YAxis stroke="#737373" tick={{ fontSize: 11 }} label={{ value: 'Lk (µH)', angle: -90, position: 'insideLeft', fill: '#737373', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#171717', border: '1px solid #404040', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#a3a3a3' }}
              formatter={(v: number) => [`${v} µH`, 'Lk']}
              labelFormatter={(v) => `d₁₂ = ${v} mm`}
            />
            <ReferenceLine
              y={lrTarget}
              stroke="#f59e0b"
              strokeDasharray="5 4"
              label={{ value: `所需 Lr ≈ ${lrTarget} µH`, fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }}
            />
            <Line type="monotone" dataKey="lk" stroke="#14b8a6" strokeWidth={2.2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Panel>

      <Panel
        title="② 电感随气隙的变化 —— 主磁芯锁 Lm、副磁芯调 Lr"
        note={`L = μ0·Np²·Ae/(lg + le/μr)，其中主磁芯 Ae = ${inp.coreAe} mm²、副磁芯 Ae = ${(inp.coreAe * inp.auxAeRatio).toFixed(0)} mm²（比值 ${inp.auxAeRatio}）。`}
      >
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={gapInductance} margin={{ top: 10, right: 20, bottom: 6, left: -14 }}>
            <CartesianGrid stroke="#262626" strokeDasharray="3 3" />
            <XAxis dataKey="lg" type="number" domain={[0, 5]} stroke="#737373" tick={{ fontSize: 11 }} label={{ value: '气隙 lg (mm)', position: 'insideBottomRight', offset: -2, fill: '#737373', fontSize: 11 }} />
            <YAxis stroke="#737373" tick={{ fontSize: 11 }} label={{ value: 'L (µH)', angle: -90, position: 'insideLeft', fill: '#737373', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#171717', border: '1px solid #404040', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#a3a3a3' }}
              formatter={(v: number, n: string) => [`${v} µH`, n === 'main' ? '主磁芯' : '副磁芯']}
              labelFormatter={(v) => `lg = ${v} mm`}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: '#a3a3a3' }} formatter={(v: string) => (v === 'main' ? '主磁芯（锁 Lm）' : '副磁芯（调 Lr）')} />
            <Line type="monotone" dataKey="main" stroke="#ef4444" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="aux" stroke="#14b8a6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <p className="mt-1 text-[11px] text-neutral-500">
          注意气隙越大电感下降越快，且 0 附近极陡——这正是「副磁芯气隙用于精细调节 Lr」的原因。
        </p>
      </Panel>

      <Panel
        title="③ 绕组交流因子 Fr 随频率的变化 —— 高频下铜损为何陡增"
        note={`Dowell 箔式单层模型：Fr = (Δ/2)·(sinhΔ + sinΔ)/(coshΔ − cosΔ)，Δ = h/δ，导体厚度 h = ${d1} mm。δ 为趋肤深度。`}
      >
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={frSweep} margin={{ top: 10, right: 20, bottom: 6, left: -14 }}>
            <CartesianGrid stroke="#262626" strokeDasharray="3 3" />
            <XAxis dataKey="f" type="number" domain={[20, 500]} stroke="#737373" tick={{ fontSize: 11 }} label={{ value: '频率 f (kHz)', position: 'insideBottomRight', offset: -2, fill: '#737373', fontSize: 11 }} />
            <YAxis yAxisId="l" stroke="#737373" tick={{ fontSize: 11 }} label={{ value: 'Fr = Rac/Rdc', angle: -90, position: 'insideLeft', fill: '#737373', fontSize: 11 }} />
            <YAxis yAxisId="r" orientation="right" stroke="#737373" tick={{ fontSize: 11 }} label={{ value: 'Δ = h/δ', angle: 90, position: 'insideRight', fill: '#737373', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#171717', border: '1px solid #404040', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#a3a3a3' }}
              labelFormatter={(v) => `f = ${v} kHz`}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: '#a3a3a3' }} formatter={(v: string) => (v === 'fr' ? '交流因子 Fr' : '穿透率 Δ')} />
            <Line yAxisId="l" type="monotone" dataKey="fr" stroke="#f59e0b" strokeWidth={2.2} dot={false} />
            <Line yAxisId="r" type="monotone" dataKey="delta" stroke="#737373" strokeWidth={1.4} strokeDasharray="4 3" dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <p className="mt-1 text-[11px] text-neutral-500">
          Fr 在 Δ≈1（导体厚度接近趋肤深度）之后开始明显上升。平面变压器要压铜损，就得在这个频率上把箔厚压到 δ 量级。
        </p>
      </Panel>
    </div>
  )
}

function Panel({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
      <h2 className="text-[13px] font-semibold text-neutral-200">{title}</h2>
      {note && <p className="mt-1 mb-3 text-[11px] text-neutral-500">{note}</p>}
      {children}
    </section>
  )
}

function Controls(props: {
  np: number
  setNp: (v: number) => void
  bw: number
  setBw: (v: number) => void
  lw: number
  setLw: (v: number) => void
  d1: number
  setD1: (v: number) => void
  d2: number
  setD2: (v: number) => void
  lrTarget: number
  setLrTarget: (v: number) => void
}) {
  const items: [string, number, (v: number) => void, number, number, number, string][] = [
    ['匝数 Np', props.np, props.setNp, 4, 120, 1, '匝'],
    ['绕组宽度 bw', props.bw, props.setBw, 4, 40, 0.5, 'mm'],
    ['平均匝长 lw', props.lw, props.setLw, 20, 160, 1, 'mm'],
    ['原边厚度 d₁', props.d1, props.setD1, 0.1, 2, 0.05, 'mm'],
    ['副边厚度 d₂', props.d2, props.setD2, 0.1, 2, 0.05, 'mm'],
    ['所需 Lr 参考', props.lrTarget, props.setLrTarget, 5, 200, 1, 'µH'],
  ]
  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
      <div className="text-[11px] font-semibold text-teal-400/90 mb-3">曲线参数（独立于设计器，便于做单变量扫描）</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {items.map(([label, value, setter, min, max, step, unit]) => (
          <label key={label} className="block">
            <span className="text-[11px] text-neutral-400">
              {label} <span className="text-neutral-600">({value} {unit})</span>
            </span>
            <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => setter(parseFloat(e.target.value))} />
          </label>
        ))}
      </div>
    </section>
  )
}
