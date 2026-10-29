/**
 * 磁件设计器
 *
 * 定位：本页**不做** LLC 电路设计（FHA 增益、ZVS 条件、谐振腔参数选取等
 * 请见参考站 llc.power-knowledge.tech）。本页只回答一个问题：
 *
 *   给定谐振腔要求的 Lr、Lm 与电气规格，如何用一个磁集成变压器把它做出来？
 *
 * 因此结果区的主线是「磁路分配 → 磁件几何 → 气隙/漏感 → 损耗与诊断」，
 * 谐振腔参数仅作为衔接输入，不展开其理论。
 */

import { useMemo, useState } from 'react'
import { computeDesign } from '../lib/computeDesign'
import { CORE_MATERIALS, CORE_SPECS } from '../lib/coreMaterials'
import { DEFAULT_INPUTS, SCHEME_LABEL, type DesignInputs, type MagScheme } from '../lib/types'
import { LossChart } from '../components/LossChart'
import { MagneticSVG } from '../components/MagneticSVG'
import { M, MB } from '../components/Math'
import { AlertTriangle, CheckCircle2, GitCompare, Info, RotateCcw, TriangleAlert } from 'lucide-react'

const STORAGE_KEY = 'magllc.inputs.v2'

function loadInputs(): DesignInputs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...DEFAULT_INPUTS, ...(JSON.parse(raw) as Partial<DesignInputs>) }
  } catch {
    /* 忽略损坏的本地存档 */
  }
  return DEFAULT_INPUTS
}

export default function Designer() {
  const [inputs, setInputs] = useState<DesignInputs>(loadInputs)

  const update = <K extends keyof DesignInputs>(key: K, value: DesignInputs[K]) => {
    setInputs((prev) => {
      const next = { ...prev, [key]: value }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* 存储不可用时静默降级 */
      }
      return next
    })
  }

  const r = useMemo(() => computeDesign(inputs), [inputs])
  const t = r.tank
  const m = r.magnetic

  // 磁集成达成度：固有漏感对所需 Lr 的贡献比例
  const leakageShare = t.lr > 0 ? Math.min(1, m.leakageUh / t.lr) : 0
  const leakageOver = m.leakageUh > t.lr

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-5 rounded-xl border border-teal-500/25 bg-teal-500/[0.05] px-4 py-3">
        <p className="text-[12px] leading-relaxed text-teal-100/90">
          <strong className="text-teal-200">本页只做磁集成变压器的磁件设计。</strong>
          LLC 拓扑原理、FHA 增益、ZVS 条件、谐振腔参数选取等，请用参考站
          <a
            href="https://www.llc.power-knowledge.tech/designer"
            target="_blank"
            rel="noreferrer"
            className="mx-1 underline decoration-teal-400/50 hover:text-teal-300"
          >
            llc.power-knowledge.tech
          </a>
          ——把它的谐振腔结果（Lr / Lm / n）拿到这里，由本页负责把它落到磁芯上。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ══════════ 输入区 ══════════ */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-200">输入</h2>
            <button
              onClick={() => setInputs(DEFAULT_INPUTS)}
              className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-teal-300"
            >
              <RotateCcw size={12} /> 恢复默认算例
            </button>
          </div>

          <Group title="① 衔接参数（来自 LLC 设计）">
            <Row>
              <Field label="Vin,min" unit="V" value={inputs.vinMin} onChange={(v) => update('vinMin', v)} />
              <Field label="Vin,nom" unit="V" value={inputs.vinNom} onChange={(v) => update('vinNom', v)} />
            </Row>
            <Row>
              <Field label="Vin,max" unit="V" value={inputs.vinMax} onChange={(v) => update('vinMax', v)} />
              <Field label="Vout" unit="V" value={inputs.vout} onChange={(v) => update('vout', v)} />
            </Row>
            <Row>
              <Field label="Pout" unit="W" value={inputs.pout} onChange={(v) => update('pout', v)} />
              <Field label="谐振频率 fr" unit="kHz" value={inputs.fr} onChange={(v) => update('fr', v)} />
            </Row>
            <Row>
              <Select
                label="原边拓扑"
                value={inputs.topology}
                onChange={(v) => update('topology', v as DesignInputs['topology'])}
                options={[
                  ['half-bridge', '半桥'],
                  ['full-bridge', '全桥'],
                ]}
              />
              <Field label="整流压降 Vf" unit="V" value={inputs.vf} onChange={(v) => update('vf', v)} step={0.1} />
            </Row>
            <Row>
              <Field label="电感比 k = Lm/Lr" value={inputs.kTarget} onChange={(v) => update('kTarget', v)} step={0.5} />
              <Field label="Q 降额系数" value={inputs.qMargin} onChange={(v) => update('qMargin', v)} step={0.01} />
            </Row>
            <Select
              label="散热条件（决定磁体温升的换热系数）"
              value={inputs.coolingMode}
              onChange={(v) => update('coolingMode', v as DesignInputs['coolingMode'])}
              options={[
                ['natural', '自然对流（h ≈ 15 W/m²·K）'],
                ['fan', '风扇吹拂（h ≈ 40 W/m²·K）'],
                ['forced', '强制风冷（h ≈ 80 W/m²·K）'],
              ]}
            />

            <details className="rounded-lg border border-neutral-700/70 bg-neutral-950/40 px-2.5 py-2">
              <summary className="cursor-pointer text-[11px] text-teal-400/90 hover:text-teal-300">
                已在 LLC 工具完成设计？直接填入 Lr / Lm / n（可选）
              </summary>
              <div className="mt-2 space-y-2">
                <Row>
                  <Field label="Lr（覆盖）" unit="µH" value={inputs.lrOverride} onChange={(v) => update('lrOverride', v)} />
                  <Field label="Lm（覆盖）" unit="µH" value={inputs.lmOverride} onChange={(v) => update('lmOverride', v)} />
                </Row>
                <Field label="匝比 n（覆盖）" value={inputs.nOverride} onChange={(v) => update('nOverride', v)} step={0.1} />
                <p className="text-[10px] leading-relaxed text-neutral-500">
                  本工具的 Q 只按「感容分界点增益」判据取值，<strong className="text-neutral-400">不含 ZVS 死区约束</strong>
                  （那属于 LLC 电路设计）。若参考站的完整设计已给出确切 Lr / Lm（含死区约束），填在这里更准。
                  填 0 表示由本工具反推。
                </p>
              </div>
            </details>

            <p className="text-[11px] leading-relaxed text-neutral-500">
              这些用于反推 Lr / Lm / n 与绕组电流。本页不展开其理论——FHA 增益、ZVS 条件与 Q 上限判据见参考站。
            </p>
          </Group>

          <Group title="② 磁集成方案">
            <Select
              label="方案"
              value={inputs.scheme}
              onChange={(v) => update('scheme', v as MagScheme)}
              options={(Object.keys(SCHEME_LABEL) as MagScheme[]).map((s) => [s, SCHEME_LABEL[s]])}
            />
            <Field
              label="副磁芯截面积比 Ae,B / Ae,A"
              value={inputs.auxAeRatio}
              onChange={(v) => update('auxAeRatio', v)}
              step={0.05}
            />
            <p className="text-[11px] leading-relaxed text-neutral-500">
              副磁芯（承担 Lr 的那部分）与主磁芯的截面积之比。比值越小，副磁芯所需气隙越大、磁场越易泄漏。
            </p>
          </Group>

          <Group title="③ 绕组几何（决定漏感）">
            <Row>
              <Field label="绕组宽度 bw" unit="mm" value={inputs.geomWindingWidth} onChange={(v) => update('geomWindingWidth', v)} step={0.5} />
              <Field label="平均匝长 lw" unit="mm" value={inputs.geomMeanTurnLength} onChange={(v) => update('geomMeanTurnLength', v)} />
            </Row>
            <Row>
              <Field label="原副边间距 d12" unit="mm" value={inputs.geomInsulationGap} onChange={(v) => update('geomInsulationGap', v)} step={0.05} />
              <Field label="原边厚度 d1" unit="mm" value={inputs.geomPrimaryThickness} onChange={(v) => update('geomPrimaryThickness', v)} step={0.05} />
            </Row>
            <Field label="副边厚度 d2" unit="mm" value={inputs.geomSecondaryThickness} onChange={(v) => update('geomSecondaryThickness', v)} step={0.05} />
            <p className="text-[11px] leading-relaxed text-neutral-500">
              <strong className="text-neutral-400">这是磁集成设计的核心调节手段</strong>：漏感
              Lk ∝ (d1/3 + d12 + d2/3)，拉大原副边间距即可增大漏感，从而减少副磁芯需要补足的电感。
            </p>
          </Group>

          <Group title="④ 磁芯参数">
            <Select
              label="磁芯材料"
              value={inputs.coreMaterialId}
              onChange={(v) => update('coreMaterialId', v)}
              options={CORE_MATERIALS.map((c) => [c.id, `${c.name}（${c.vendor}）`])}
            />
            <Select
              label="磁芯规格（示例值，请按手册替换）"
              value=""
              onChange={(v) => {
                const spec = CORE_SPECS.find((c) => c.id === v)
                if (!spec || spec.ae <= 0) return
                setInputs((prev) => ({ ...prev, coreAe: spec.ae, coreVe: spec.ve, coreLe: spec.le, coreAw: spec.aw }))
              }}
              options={[['', '— 选择以填充下方参数 —'], ...CORE_SPECS.map((c) => [c.id, c.name] as [string, string])]}
            />
            <Row>
              <Field label="Ae" unit="mm²" value={inputs.coreAe} onChange={(v) => update('coreAe', v)} />
              <Field label="Ve" unit="cm³" value={inputs.coreVe} onChange={(v) => update('coreVe', v)} />
            </Row>
            <Row>
              <Field label="le" unit="mm" value={inputs.coreLe} onChange={(v) => update('coreLe', v)} />
              <Field label="Aw" unit="mm²" value={inputs.coreAw} onChange={(v) => update('coreAw', v)} />
            </Row>
            <Row>
              <Field label="工作磁密 Bm" unit="T" value={inputs.bTarget} onChange={(v) => update('bTarget', v)} step={0.01} />
              <Field label="电流密度 J" unit="A/mm²" value={inputs.currentDensity} onChange={(v) => update('currentDensity', v)} step={0.5} />
            </Row>
            <Field label="窗口填充系数 Ku" value={inputs.fillFactor} onChange={(v) => update('fillFactor', v)} step={0.05} />
          </Group>

          <Group title="⑤ 损耗参数">
            <Row>
              <Field label="磁芯比损耗 Pcv" unit="mW/cm³" value={inputs.corePcv} onChange={(v) => update('corePcv', v)} />
              <Field label="波形系数 Kwave" value={inputs.coreWaveK} onChange={(v) => update('coreWaveK', v)} step={0.05} />
            </Row>
            <Row>
              <Field label="MOSFET Rds(on)" unit="mΩ" value={inputs.mosfetRdsOn} onChange={(v) => update('mosfetRdsOn', v)} />
              <Field label="Rds 温度系数" value={inputs.rdsonTempFactor} onChange={(v) => update('rdsonTempFactor', v)} step={0.1} />
            </Row>
          </Group>
        </aside>

        {/* ══════════ 结果区 ══════════ */}
        <section className="lg:col-span-8 space-y-4">
          {/* 关键指标 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KPI
              label="漏感贡献率"
              value={`${(leakageShare * 100).toFixed(1)} %`}
              tone={leakageOver ? 'bad' : leakageShare > 0.35 ? 'good' : 'warn'}
            />
            <KPI
              label="副磁芯需补"
              value={leakageOver ? '0 µH' : `${fmt(m.auxInductanceUh)} µH`}
              tone={leakageOver ? 'warn' : undefined}
            />
            <KPI
              label="磁密裕量"
              value={`${fmt(m.bMargin)} ×`}
              tone={m.bMargin >= 1.2 ? 'good' : m.bMargin >= 1 ? 'warn' : 'bad'}
            />
            <KPI
              label="磁件可行性"
              value={r.feasible ? '可行' : '需调整'}
              tone={r.feasible ? 'good' : 'bad'}
            />
          </div>

          {/* ① 磁路分配 —— 本页的主线 */}
          <Card
            title="① 磁路分配：把 Lr 与 Lm 拆到两条磁路上"
            desc="磁集成的本质是「一个磁芯承担两个电感」。本卡显示这个拆分的具体结果。"
          >
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="space-y-3">
                <AllocBar
                  label="变压器固有漏感 Lk"
                  value={m.leakageUh}
                  total={t.lr}
                  color="#f59e0b"
                  note="由绕组几何决定（间距/厚度/匝数）"
                />
                <AllocBar
                  label="副磁芯电感 Laux"
                  value={leakageOver ? 0 : m.auxInductanceUh}
                  total={t.lr}
                  color="#14b8a6"
                  note="由副磁芯气隙 lg,B 调节"
                />
                <div className="rounded-lg border border-neutral-700 bg-neutral-950/60 px-3 py-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] text-neutral-400">谐振电感需求 Lr</span>
                    <span className="tabular text-[15px] font-semibold text-teal-300">{fmt(t.lr)} µH</span>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between">
                    <span className="text-[11px] text-neutral-400">励磁电感 Lm（由主磁芯气隙锁定）</span>
                    <span className="tabular text-[15px] font-semibold text-neutral-200">{fmt(t.lm)} µH</span>
                  </div>
                </div>
                <MB tex="L_r=L_k(\text{绕组几何})+L_{aux}(l_{g,B})\qquad L_m\leftrightarrow l_{g,A}" />
              </div>
              <MagneticSVG magnetic={m} scheme={inputs.scheme} />
            </div>
          </Card>

          {/* ② 磁件几何 */}
          <Card
            title="② 磁件几何：匝数 / 气隙 / 磁密 / 窗口"
            desc="把上面的磁路分工落实为可制造的尺寸与匝数。"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              <Item label="原边匝数 Np" value={`${m.np} 匝`} />
              <Item label="副边匝数 Ns" value={`${m.ns} 匝`} />
              <Item label="实际匝比" value={fmt(t.n, 3)} />
              <Item label="峰值磁密 Bm" value={`${(m.bPeak * 1000).toFixed(0)} mT`} />
              <Item label="磁密裕量 Bsat/Bm" value={`${fmt(m.bMargin)} ×`} tone={m.bMargin >= 1.2 ? 'good' : m.bMargin >= 1 ? 'warn' : 'bad'} />
              <Item label="主磁芯气隙 lg,A" value={`${fmt(m.lgMain, 3)} mm`} tone={m.lgMainFeasible ? undefined : 'bad'} />
              <Item label="副磁芯气隙 lg,B" value={`${fmt(m.lgAux, 3)} mm`} tone={m.lgAuxFeasible ? undefined : 'bad'} />
              <Item label="面积积 Ap 实际/需求" value={`${fmt(m.apActual, 2)} / ${fmt(m.apRequired, 2)} cm⁴`} tone={m.apActual >= m.apRequired ? 'good' : 'warn'} />
              <Item label="窗口占用率" value={`${(m.windowRatio * 100).toFixed(0)} %`} tone={m.windowOk ? 'good' : 'bad'} />
              <Item label="原边电流 Ip,rms" value={`${fmt(t.ipRms, 2)} A`} />
              <Item label="副边电流 Is,rms" value={`${fmt(t.isRms, 2)} A`} />
              <Item label="关断励磁电流 Im,off" value={`${fmt(t.imOff, 2)} A`} />
            </div>

            {m.notes.length > 0 && (
              <ul className="mt-3 space-y-1">
                {m.notes.map((n, i) => (
                  <li key={i} className="flex gap-2 text-[11px] text-amber-300/90">
                    <TriangleAlert size={12} className="mt-0.5 shrink-0" />
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* ③ 磁集成 vs 分立 */}
          <Card
            title="③ 集成 vs 分立：省下了什么"
            desc="磁集成的收益不在电路，而在磁件的数量与磁路耦合方式。"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="text-left text-neutral-500 border-b border-neutral-800">
                    <th className="py-2 font-medium">对比项</th>
                    <th className="py-2 font-medium">分立方案（独立 Lr 电感 + 变压器）</th>
                    <th className="py-2 font-medium">本方案（磁芯组合集成）</th>
                  </tr>
                </thead>
                <tbody className="text-neutral-300">
                  <tr className="border-b border-neutral-800/60">
                    <td className="py-2 text-neutral-400">磁芯数量</td>
                    <td className="py-2">2 个（Lr 电感磁芯 + 变压器磁芯）</td>
                    <td className="py-2 text-teal-300">2 个（主磁芯 A + 副磁芯 B，共磁路）</td>
                  </tr>
                  <tr className="border-b border-neutral-800/60">
                    <td className="py-2 text-neutral-400">原边绕组</td>
                    <td className="py-2">2 套（电感绕组 + 变压器原边）</td>
                    <td className="py-2 text-teal-300">1 套（原边绕在两对磁芯上）</td>
                  </tr>
                  <tr className="border-b border-neutral-800/60">
                    <td className="py-2 text-neutral-400">Lr 实现方式</td>
                    <td className="py-2">独立电感，Lr 可独立标定</td>
                    <td className="py-2">漏感 + 副磁芯电感，由气隙与绕组间距共同决定</td>
                  </tr>
                  <tr className="border-b border-neutral-800/60">
                    <td className="py-2 text-neutral-400">磁芯磁密</td>
                    <td className="py-2">各自独立，磁通互不影响</td>
                    <td className="py-2 text-teal-300">公共磁柱上两路交变磁通方向相反 ⇒ 交变磁密降低</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-neutral-400">代价</td>
                    <td className="py-2">元件多、高度大、占用 PCB 面积</td>
                    <td className="py-2">Lr 精度依赖绕组工艺一致性，需有限元复核</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-neutral-500">
              <GitCompare size={12} className="mt-0.5 shrink-0" />
              <span>
                「公共磁柱磁通相消 ⇒ 交变磁密降低 ⇒ 铁损下降」这一条来自王鑫(2020) 2.4.1 节对磁集成方式的两类归纳，
                是本方案选择磁芯组合集成的核心理由之一。
              </span>
            </p>
          </Card>

          {/* ④ 损耗 */}
          <Card title="④ 磁件损耗与效率">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-center">
              <LossChart items={r.losses} />
              <div className="space-y-1.5">
                {r.losses.map((l) => {
                  const pct = r.totalLoss > 0 ? (l.value / r.totalLoss) * 100 : 0
                  return (
                    <div key={l.name}>
                      <div className="flex justify-between text-[11px] mb-0.5">
                        <span className="text-neutral-300">{l.name}</span>
                        <span className="tabular text-neutral-400">
                          {l.value.toFixed(2)} W · {pct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: l.color }} />
                      </div>
                    </div>
                  )
                })}
                <div className="pt-2 mt-2 border-t border-neutral-800 flex justify-between text-[12px]">
                  <span className="text-neutral-300">合计</span>
                  <span className="tabular font-medium text-teal-300">{r.totalLoss.toFixed(2)} W</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-neutral-300">效率</span>
                  <span className="tabular font-medium text-emerald-400">{(r.efficiency * 100).toFixed(2)} %</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-neutral-300">磁体温升（仅铁损 + 铜损）</span>
                  <span className={`tabular font-medium ${r.tempRiseC > 150 ? 'text-rose-400' : 'text-neutral-200'}`}>
                    {fmtTemp(r.tempRiseC)}
                  </span>
                </div>
              </div>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-neutral-500">
              磁芯损耗用「手册比损耗 × 体积 × 波形系数」；绕组用 Dowell 箔式单层交流因子（多层并联请另行校核）；
              <strong className="text-neutral-400">副磁芯铁损已单独列出</strong>——这是磁集成方案特有的损耗项，
              分立方案中它对应独立电感的铁损。
            </p>
          </Card>

          {/* ⑤ 诊断 */}
          <Card title="⑤ 磁件设计诊断">
            {r.warnings.length === 0 ? (
              <p className="text-[12px] text-neutral-400">未发现明显问题。</p>
            ) : (
              <ul className="space-y-1.5">
                {r.warnings.map((w, i) => (
                  <li key={i} className="flex gap-2 text-[12px] items-start">
                    {w.level === 'critical' && <AlertTriangle size={14} className="mt-0.5 shrink-0 text-rose-400" />}
                    {w.level === 'warn' && <TriangleAlert size={14} className="mt-0.5 shrink-0 text-amber-400" />}
                    {w.level === 'good' && <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-400" />}
                    <span
                      className={
                        w.level === 'critical' ? 'text-rose-300' : w.level === 'warn' ? 'text-amber-200' : 'text-neutral-300'
                      }
                    >
                      {w.text}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-neutral-800 bg-neutral-900/40 p-3">
              <Info size={14} className="mt-0.5 shrink-0 text-neutral-500" />
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                本页只算磁件。气隙公式为理想磁路式（未计边缘效应），漏感为二维矩形绕组解析近似，
                温升只按<strong className="text-neutral-400">磁体自身发热</strong>（铁损 + 绕组铜损）估算，
                开关管与整流损耗发热在各自器件上，不计入磁芯温升；
                散热面积按 EE 型磁芯拟合（A_s ≈ 14·Ve^(2/3)），未做热网络分层。
                定型前请用有限元复核漏感与磁密分布。
              </p>
            </div>
          </Card>
        </section>
      </div>
    </div>
  )
}

/* ─────────────── 小组件 ─────────────── */

function fmt(v: number, d = 2) {
  return Number.isFinite(v) ? v.toFixed(d) : '—'
}

function fmtTemp(v: number) {
  if (!Number.isFinite(v)) return '—'
  return v > 150 ? '> 150 °C' : `${v.toFixed(0)} °C`
}

/** 磁路分配条：显示某一分量占 Lr 需求的比例 */
function AllocBar({
  label,
  value,
  total,
  color,
  note,
}: {
  label: string
  value: number
  total: number
  color: string
  note: string
}) {
  const pct = total > 0 ? Math.min(100, (value / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1">
        <span className="text-neutral-300">{label}</span>
        <span className="tabular text-neutral-400">
          {fmt(value)} µH · {pct.toFixed(0)}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="mt-0.5 text-[10px] text-neutral-500">{note}</div>
    </div>
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3">
      <div className="text-[11px] font-semibold text-teal-400/90 mb-2 tracking-wide">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>
}

function Field({
  label,
  unit,
  value,
  onChange,
  step,
}: {
  label: string
  unit?: string
  value: number
  onChange: (v: number) => void
  step?: number
}) {
  return (
    <label className="block">
      <span className="text-[11px] text-neutral-400">
        {label}
        {unit && <span className="text-neutral-600"> ({unit})</span>}
      </span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : ''}
        step={step ?? 'any'}
        onChange={(e) => {
          const v = parseFloat(e.target.value)
          onChange(Number.isFinite(v) ? v : 0)
        }}
      />
    </label>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: [string, string][]
}) {
  return (
    <label className="block">
      <span className="text-[11px] text-neutral-400">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  )
}

function KPI({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'warn' | 'bad' }) {
  const color =
    tone === 'good' ? 'text-emerald-400' : tone === 'warn' ? 'text-amber-400' : tone === 'bad' ? 'text-rose-400' : 'text-neutral-100'
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 px-3 py-2.5">
      <div className="text-[11px] text-neutral-500">{label}</div>
      <div className={`tabular text-lg font-semibold ${color}`}>{value}</div>
    </div>
  )
}

function Item({ label, value, tone }: { label: string; value: string; tone?: 'good' | 'warn' | 'bad' }) {
  const color =
    tone === 'good' ? 'text-emerald-400' : tone === 'warn' ? 'text-amber-400' : tone === 'bad' ? 'text-rose-400' : 'text-neutral-200'
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-950/50 px-2.5 py-1.5">
      <div className="text-[10px] text-neutral-500 truncate" title={label}>
        {label}
      </div>
      <div className={`tabular text-[13px] font-medium ${color}`}>{value}</div>
    </div>
  )
}

function Card({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
      <h3 className="text-[13px] font-semibold text-neutral-200">{title}</h3>
      {desc && <p className="mt-1 mb-3 text-[11px] text-neutral-500">{desc}</p>}
      {!desc && <div className="mb-3" />}
      {children}
    </div>
  )
}
