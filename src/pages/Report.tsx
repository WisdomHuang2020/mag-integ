import { useMemo } from 'react'
import { computeDesign } from '../lib/computeDesign'
import { CORE_MATERIALS } from '../lib/coreMaterials'
import { DEFAULT_INPUTS, SCHEME_LABEL, type DesignInputs } from '../lib/types'
import { ExternalLink, Printer, ShieldAlert } from 'lucide-react'

const STORAGE_KEY = 'magllc.inputs.v2'

export default function Report() {
  const inputs = useMemo<DesignInputs>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return { ...DEFAULT_INPUTS, ...(JSON.parse(raw) as Partial<DesignInputs>) }
    } catch {
      /* 忽略损坏存档 */
    }
    return DEFAULT_INPUTS
  }, [])

  const r = useMemo(() => computeDesign(inputs), [inputs])
  const t = r.tank
  const m = r.magnetic
  const material = CORE_MATERIALS.find((c) => c.id === inputs.coreMaterialId)
  const now = new Date().toLocaleString('zh-CN')

  const leakageShare = t.lr > 0 ? Math.min(1, m.leakageUh / t.lr) : 0
  const leakageOver = m.leakageUh > t.lr

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-5 print:hidden">
        <h1 className="text-xl font-semibold text-slate-100">磁件设计报告</h1>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3.5 py-2 text-[12px] font-medium text-slate-950 hover:bg-cyan-400 transition-colors"
        >
          <Printer size={14} /> 打印 / 存为 PDF
        </button>
      </div>

      <article className="rounded-xl border border-slate-800 bg-slate-900/40 p-6 print:border-slate-300 print:bg-white">
        <header className="border-b border-slate-800 pb-4 print:border-slate-300">
          <h2 className="text-lg font-semibold text-slate-100 print:text-black">磁集成 LLC 变压器磁件设计报告</h2>
          <p className="mt-1 text-[11px] text-slate-500">
            生成时间：{now} · 工具版本 v0.2.0 · 本地计算，未上传任何数据
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            范围声明：本报告只覆盖磁件设计（磁路分配 / 气隙 / 漏感 / 匝数 / 损耗）。
            LLC 电路理论、FHA 增益与谐振腔参数选取见参考站 llc.power-knowledge.tech。
          </p>
        </header>

        <Section title="一、输入">
          <Table
            rows={[
              ['输入电压范围', `${inputs.vinMin} ~ ${inputs.vinMax} V（额定 ${inputs.vinNom} V）`],
              ['输出电压 / 功率', `${inputs.vout} V / ${inputs.pout} W`],
              ['谐振频率 fr', `${inputs.fr} kHz`],
              ['原边拓扑 / 整流', `${inputs.topology === 'half-bridge' ? '半桥' : '全桥'} / ${inputs.rectifier === 'full-wave-ct' ? '全波中心抽头' : '全桥整流'}`],
              ['整流压降 Vf', `${inputs.vf} V`],
              ['电感比 k / Q 降额', `${inputs.kTarget} / ${inputs.qMargin}`],
              ['磁集成方案', SCHEME_LABEL[inputs.scheme]],
              ['副磁芯截面积比 Ae,B/Ae,A', `${inputs.auxAeRatio}`],
              ['磁芯材料', material ? `${material.name}（${material.vendor}）` : inputs.coreMaterialId],
              ['磁芯参数 Ae / Ve / le / Aw', `${inputs.coreAe} mm² / ${inputs.coreVe} cm³ / ${inputs.coreLe} mm / ${inputs.coreAw} mm²`],
              ['工作磁密目标 / 电流密度', `${inputs.bTarget} T / ${inputs.currentDensity} A/mm²`],
              ['窗口填充系数 Ku', `${inputs.fillFactor}`],
              ['绕组几何 bw / lw / d₁ / d₁₂ / d₂', `${inputs.geomWindingWidth} / ${inputs.geomMeanTurnLength} / ${inputs.geomPrimaryThickness} / ${inputs.geomInsulationGap} / ${inputs.geomSecondaryThickness} mm`],
              ['磁芯比损耗 Pcv / 波形系数', `${inputs.corePcv} mW/cm³ / ${inputs.coreWaveK}`],
              ['MOSFET Rds(on) / 温度系数', `${inputs.mosfetRdsOn} mΩ / ${inputs.rdsonTempFactor}`],
            ]}
          />
        </Section>

        <Section title="二、磁路分配（本报告主线）">
          <table className="w-full text-[12px]">
            <tbody>
              <tr className="border-b border-slate-800/60 print:border-slate-200">
                <td className="py-1.5 pr-4 text-slate-500 print:text-slate-700 w-[46%]">谐振电感需求 Lr</td>
                <td className="py-1.5 tabular text-slate-200 print:text-black font-medium">{fmt(t.lr)} µH</td>
              </tr>
              <tr className="border-b border-slate-800/60 print:border-slate-200">
                <td className="py-1.5 pr-4 text-slate-500 print:text-slate-700">├ 变压器固有漏感 Lk（由绕组几何决定）</td>
                <td className="py-1.5 tabular text-amber-400 print:text-black">
                  {fmt(m.leakageUh)} µH（占 {(leakageShare * 100).toFixed(1)}%）
                </td>
              </tr>
              <tr className="border-b border-slate-800/60 print:border-slate-200">
                <td className="py-1.5 pr-4 text-slate-500 print:text-slate-700">└ 副磁芯补齐电感 Laux（由副气隙调节）</td>
                <td className="py-1.5 tabular text-teal-300 print:text-black">{fmt(leakageOver ? 0 : m.auxInductanceUh)} µH</td>
              </tr>
              <tr className="border-b border-slate-800/60 print:border-slate-200">
                <td className="py-1.5 pr-4 text-slate-500 print:text-slate-700">励磁电感 Lm（由主磁芯气隙锁定）</td>
                <td className="py-1.5 tabular text-slate-200 print:text-black font-medium">{fmt(t.lm)} µH</td>
              </tr>
            </tbody>
          </table>
          {leakageOver && (
            <p className="mt-2 text-[11px] text-rose-400 print:text-black">
              ⚠ 固有漏感已超过所需 Lr，说明绕组间距偏大或匝数偏多——须缩小间距，否则谐振频率会偏低。
            </p>
          )}
        </Section>

        <Section title="三、磁件几何">
          <Table
            rows={[
              ['原边 / 副边匝数', `${m.np} / ${m.ns} 匝（实际匝比 ${fmt(t.n, 3)}）`],
              ['峰值工作磁密 Bm', `${(m.bPeak * 1000).toFixed(0)} mT`],
              ['磁密裕量 Bsat/Bm', `${fmt(m.bMargin)} ×`],
              ['主磁芯气隙 lg,A（锁定 Lm）', `${fmt(m.lgMain, 3)} mm`],
              ['副磁芯气隙 lg,B（调节 Lr）', `${fmt(m.lgAux, 3)} mm`],
              ['面积积 Ap 实际 / 需求', `${fmt(m.apActual, 3)} / ${fmt(m.apRequired, 3)} cm⁴`],
              ['窗口占用率', `${(m.windowRatio * 100).toFixed(0)} %（${m.windowOk ? '合格' : '超限'}）`],
              ['原边 / 副边电流有效值', `${fmt(t.ipRms, 2)} / ${fmt(t.isRms, 2)} A`],
            ]}
          />
        </Section>

        <Section title="四、损耗与效率">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-800 print:border-slate-300">
                <th className="py-1.5 font-medium">分项</th>
                <th className="py-1.5 font-medium text-right">损耗 (W)</th>
                <th className="py-1.5 font-medium text-right">占比</th>
              </tr>
            </thead>
            <tbody>
              {r.losses.map((l) => (
                <tr key={l.name} className="border-b border-slate-800/60 print:border-slate-200">
                  <td className="py-1.5 text-slate-300 print:text-black">{l.name}</td>
                  <td className="py-1.5 text-right tabular text-slate-200 print:text-black">{l.value.toFixed(3)}</td>
                  <td className="py-1.5 text-right tabular text-slate-400">
                    {r.totalLoss > 0 ? ((l.value / r.totalLoss) * 100).toFixed(1) : '0.0'}%
                  </td>
                </tr>
              ))}
              <tr className="font-medium">
                <td className="py-2 text-slate-200 print:text-black">合计</td>
                <td className="py-2 text-right tabular text-cyan-300 print:text-black">{r.totalLoss.toFixed(3)}</td>
                <td className="py-2 text-right text-slate-400">100%</td>
              </tr>
            </tbody>
          </table>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Metric label="预估效率" value={`${(r.efficiency * 100).toFixed(2)} %`} />
            <Metric label="温升估算（自然对流 h≈15 W/m²K）" value={fmtTemp(r.tempRiseC)} />
          </div>
        </Section>

        <Section title="五、设计诊断">
          {r.warnings.length === 0 ? (
            <p className="text-[12px] text-slate-400">未发现明显问题。</p>
          ) : (
            <ul className="space-y-1.5">
              {r.warnings.map((w, i) => (
                <li key={i} className="text-[12px] text-slate-300 print:text-black">
                  <span
                    className={
                      w.level === 'critical' ? 'text-rose-400' : w.level === 'warn' ? 'text-amber-400' : 'text-emerald-400'
                    }
                  >
                    ●
                  </span>{' '}
                  {w.text}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <div className="mt-6 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-3 print:border-slate-300 print:bg-white">
          <ShieldAlert size={15} className="mt-0.5 shrink-0 text-amber-400" />
          <p className="text-[11px] leading-relaxed text-amber-200/90 print:text-black">
            本报告由工程近似模型生成：气隙公式未计边缘效应，漏感为二维矩形绕组解析近似，
            损耗按手册比损耗与 Dowell 单层模型估算，温升用等效表面积单热阻。
            用于方案筛选与参数初定，<strong>定型前必须以有限元仿真与样机实测为准</strong>。
          </p>
        </div>
      </article>

      <p className="mt-4 text-center text-[11px] text-slate-500 print:hidden">
        LLC 谐振腔参数与电路理论见{' '}
        <a
          href="https://www.llc.power-knowledge.tech"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-0.5 text-cyan-400 hover:text-cyan-300"
        >
          llc.power-knowledge.tech <ExternalLink size={10} />
        </a>
      </p>
    </div>
  )
}

function fmt(v: number, d = 2) {
  return Number.isFinite(v) ? v.toFixed(d) : '—'
}

function fmtTemp(v: number) {
  if (!Number.isFinite(v)) return '—'
  return v > 150 ? '> 150 °C（超出模型范围）' : `${v.toFixed(0)} °C`
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h3 className="text-[13px] font-semibold text-slate-200 print:text-black mb-2">{title}</h3>
      {children}
    </section>
  )
}

function Table({ rows }: { rows: [string, string][] }) {
  return (
    <table className="w-full text-[12px]">
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k} className="border-b border-slate-800/60 print:border-slate-200">
            <td className="py-1.5 pr-4 text-slate-500 print:text-slate-700 align-top w-[46%]">{k}</td>
            <td className="py-1.5 tabular text-slate-200 print:text-black">{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 print:border-slate-300 print:bg-white">
      <div className="text-[11px] text-slate-500 print:text-slate-700">{label}</div>
      <div className="tabular text-[15px] font-semibold text-slate-100 print:text-black">{value}</div>
    </div>
  )
}
