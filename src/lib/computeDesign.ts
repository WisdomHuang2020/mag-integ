/**
 * 设计总引擎：电气规格 → 谐振腔参数 → 磁集成磁件 → 损耗与温升 → 诊断
 *
 * 计算顺序（每一步都只依赖前一步的结果，便于逐个核对）：
 *   1. 匝比 n            —— 全桥 n = Vin/(Vout+Vf)；半桥 n = (Vin/2)/(Vout+Vf)（谐振点 M=1）
 *   2. 折算负载 Rac      —— FHA：Rac = 8n²(Vout+Vf)²/(π²Pout)
 *   3. 增益需求 Gmax/Gmin —— G = n(Vout+Vf)/Vin（全工况范围决定调频范围）
 *   4. Q 上限与取值      —— 默认取「感容分界点增益 = Gmax」判据（更保守），再乘降额系数
 *   5. Zr → Lr/Cr/Lm     —— Zr = Q·Rac，Lr = Zr/(2πfr)，Cr = 1/(2πfr·Zr)，Lm = k·Lr
 *   6. fmin / fmax       —— fmin：满载曲线交点；fmax：空载曲线交点
 *   7. 磁件              —— 匝数、气隙、漏感分配、面积积、窗口
 *   8. 损耗与温升
 *   9. 诊断
 */

import type { DesignInputs, DesignResult, TankResult, Warning } from './types'
import {
  boundaryFn,
  fmaxZvs,
  fullLoadGainCrossing,
  magnetizingCurrentOffPeak,
  qmax1Boundary,
  qmax1Peak,
  qmax1Textbook,
} from './llcMath'
import { DEFAULT_GEOMETRY, designMagnetic, primaryTurns } from './magneticDesign'
import { computeLosses } from './losses'
import { findMaterial } from './coreMaterials'

/** FHA 正弦近似下的原边电流有效值 */
export function primaryRmsCurrent(pout: number, vinNom: number, topology: string): number {
  const v = topology === 'half-bridge' ? vinNom / 2 : vinNom
  return (Math.PI * pout) / (2 * Math.SQRT2 * v)
}

/** FHA 口径的副边交流电流有效值（全波整流） */
export function secondaryRmsCurrent(pout: number, vout: number): number {
  return (Math.PI * pout) / (2 * Math.SQRT2 * vout)
}

export function computeDesign(inputs: DesignInputs): DesignResult {
  const voutVf = inputs.vout + inputs.vf
  const warnings: Warning[] = []

  // ── 1. 匝比（可被覆盖）──
  const nAuto =
    inputs.topology === 'half-bridge' ? inputs.vinNom / 2 / voutVf : inputs.vinNom / voutVf
  const n = inputs.nOverride > 0 ? inputs.nOverride : nAuto

  // ── 2. 折算负载 ──
  const racS = (8 * voutVf * voutVf) / (Math.PI * Math.PI * inputs.pout)
  const rac = n * n * racS

  // ── 3. 增益需求 ──
  // ⚠️ 半桥原边方波幅值为 Vin/2（全桥为 Vin），故增益需求相差一个系数 2：
  //      全桥 G = n(Vout+Vf)/Vin   半桥 G = 2n(Vout+Vf)/Vin
  //    两者在额定点均归一为 G_nom = 1。
  const gainFactor = inputs.topology === 'half-bridge' ? 2 : 1
  const gReq = (vin: number) => (vin > 0 ? (gainFactor * n * voutVf) / vin : NaN)
  const gMax = gReq(inputs.vinMin)
  const gMin = gReq(inputs.vinMax)
  const gNom = gReq(inputs.vinNom)

  // ── 4. Q 上限 ──
  const qmaxBoundary = qmax1Boundary(inputs.kTarget, gMax)
  const qmaxPeak = qmax1Peak(inputs.kTarget, gMax)
  const qmaxTextbook = qmax1Textbook(inputs.kTarget, gMax)
  const q = Number.isFinite(qmaxBoundary) ? inputs.qMargin * qmaxBoundary : NaN

  // ── 5. 谐振腔参数（Lr / Lm 可被直接覆盖，用于衔接 LLC 工具的完整设计结果）──
  // 说明：本工具的 Q 只按「感容分界点增益」判据取值，不含 ZVS 死区约束（Qmax2）。
  //      若已在 LLC 工具中完成含死区约束的完整设计，请用 lrOverride / lmOverride 直接填入其结果，
  //      这样本工具便只承担「把已知的 Lr、Lm 落到磁芯上」这一件事。
  const frHz = inputs.fr * 1e3
  const zr = q * rac
  const lrAuto = Number.isFinite(zr) && zr > 0 ? (zr / (2 * Math.PI * frHz)) * 1e6 : NaN
  const lmAuto = Number.isFinite(lrAuto) ? inputs.kTarget * lrAuto : NaN
  const lrUh = inputs.lrOverride > 0 ? inputs.lrOverride : lrAuto
  const lmUh = inputs.lmOverride > 0 ? inputs.lmOverride : lmAuto
  // Cr 由 Lr 与 fr 反推，保证被覆盖后仍然自洽：Cr = 1/((2πfr)²·Lr)
  const crNf =
    Number.isFinite(lrUh) && lrUh > 0 ? (1 / ((2 * Math.PI * frHz) ** 2 * lrUh * 1e-6)) * 1e9 : NaN

  const bndFn = boundaryFn(inputs.kTarget, q)

  // ── 6. 频率范围 ──
  const fminKhz = inputs.fr * fullLoadGainCrossing(inputs.kTarget, q, gMax)
  const fmaxKhz = fmaxZvs(inputs.fr, inputs.kTarget, gMin)

  // ── 7. 电流 ──
  const ipRms = primaryRmsCurrent(inputs.pout, inputs.vinNom, inputs.topology)
  const isRms = secondaryRmsCurrent(inputs.pout, inputs.vout)
  const imOff = magnetizingCurrentOffPeak(inputs.vinMin, fmaxKhz, lmUh, inputs.topology)

  // ── 8. 磁件 ──
  const material = findMaterial(inputs.coreMaterialId)
  const bsat = material && material.bsat100 > 0 ? material.bsat100 : inputs.bTarget * 4

  const np = primaryTurns(inputs.vinNom, inputs.fr, inputs.bTarget, inputs.coreAe, inputs.topology)
  const ns = Math.max(1, Math.round(np / n))
  const nActual = ns > 0 ? np / ns : NaN

  const geometry = {
    windingWidth: inputs.geomWindingWidth,
    insulationGap: inputs.geomInsulationGap,
    primaryThickness: inputs.geomPrimaryThickness,
    secondaryThickness: inputs.geomSecondaryThickness,
    meanTurnLength: inputs.geomMeanTurnLength,
  }

  const magnetic = designMagnetic({
    inputs,
    geometry,
    np,
    ns,
    lrRequired: Number.isFinite(lrUh) ? lrUh : 0,
    lmTarget: Number.isFinite(lmUh) ? lmUh : 0,
    ipRms,
    isRms,
    bsat,
    muR: 2200,
    auxAeMm2: inputs.coreAe * inputs.auxAeRatio,
    auxLeMm: inputs.coreLe,
  })

  // ── 9. 损耗 ──
  const lossOut = computeLosses(
    {
      fswKhz: inputs.fr,
      ipRms,
      isRms,
      iOut: inputs.pout / inputs.vout,
      imOff,
      vinNom: inputs.vinNom,
      np,
      ns,
      meanTurnLengthMm: geometry.meanTurnLength,
      conductorThicknessMm: geometry.primaryThickness,
      currentDensity: inputs.currentDensity,
      corePcv: inputs.corePcv,
      coreVe: inputs.coreVe,
      coreWaveK: inputs.coreWaveK,
      auxCorePcv: inputs.corePcv,
      auxCoreVe: inputs.coreVe * 0.3,
      mosfetRdsOn: inputs.mosfetRdsOn,
      rdsonTempFactor: inputs.rdsonTempFactor,
      switchCount: inputs.topology === 'half-bridge' ? 1 : 2,
      tFallNs: 20,
      rectifier: inputs.rectifier,
      vf: inputs.vf,
      syncRect: false,
      syncRectRdsOn: 5,
    },
    inputs.pout,
  )

  // ── 温升 ──
  // ΔT = P_magnetic · Rth，Rth = 1/(h·A_s)
  //
  // ① 只算**磁体自身发热**（铁损 + 绕组铜损）。
  //    MOSFET 的导通/关断损耗发热在芯片结上、整流损耗在整流器件上，
  //    算进磁芯温升会凭空替半导体背 1~2 W —— 这是本工具此前的错误。
  // ② A_s ≈ 14·Ve^(2/3)：EE 型磁芯的实测拟合系数。
  //    立方体等效是 6·V^(2/3)、球是 4.84·V^(2/3)，但 EE 磁芯扁平且带窗口内壁，
  //    同体积下表面积显著更大。校核：EE34A（Ve=7.8 cm³）→ 14×3.93 ≈ 55 cm²，
  //    与其外形 34×34×24 mm 的实际外表面（≈56 cm²）吻合。
  // ③ 仍未计入「磁芯→引脚→PCB 铜箔」的导热路径，故对小功率磁件仍偏保守。
  //    ΔT > 150 K 时线性外推已无物理意义，UI 会限幅显示。
  const surfaceAreaCm2 = 14 * Math.pow(Math.max(inputs.coreVe, 0.1), 2 / 3)
  const H_MAP: Record<string, number> = { natural: 15, fan: 40, forced: 80 }
  const H_CONV = H_MAP[inputs.coolingMode] ?? 15
  const rth = 1 / (H_CONV * surfaceAreaCm2 * 1e-4)
  const tempRiseC = lossOut.magneticLoss * rth

  // ── 10. 诊断 ──
  const feasible =
    Number.isFinite(q) &&
    q > 0 &&
    magnetic.bMargin >= 1 &&
    magnetic.windowOk &&
    magnetic.lgMainFeasible &&
    tempRiseC <= 150

  if (!Number.isFinite(q) || q <= 0) {
    warnings.push({ level: 'critical', text: '无法求得有效 Q：请检查规格（Vin 范围、匝比、k 值）是否自相矛盾' })
  }
  // 匝数取整必然使实际匝比偏离目标 n，偏差会直接改变谐振点的电压增益
  if (Number.isFinite(nActual) && n > 0) {
    const dev = Math.abs(nActual - n) / n
    if (dev > 0.05) {
      warnings.push({
        level: 'warn',
        text: `实际匝比 ${nActual.toFixed(3)}（${np}:${ns}）与目标 ${n.toFixed(3)} 偏差 ${(dev * 100).toFixed(1)}%，会使谐振点输出电压偏离设定值，必要时调整匝数或微调母线电压`,
      })
    }
  }
  if (magnetic.bMargin > 0 && magnetic.bMargin < 1) {
    warnings.push({ level: 'critical', text: `峰值磁密 ${(magnetic.bPeak * 1000).toFixed(0)} mT 超过 Bsat ${(bsat * 1000).toFixed(0)} mT，磁芯必然饱和` })
  } else if (magnetic.bMargin < 1.2) {
    warnings.push({ level: 'warn', text: `磁密裕量仅 ${magnetic.bMargin.toFixed(2)} 倍，建议留 1.2 倍以上` })
  }
  if (magnetic.leakageUh > (Number.isFinite(lrUh) ? lrUh : 0)) {
    warnings.push({ level: 'warn', text: `变压器固有漏感 ${magnetic.leakageUh.toFixed(1)} µH 已超过所需 Lr，需加大原副边间距降低漏感` })
  } else if (magnetic.auxInductanceUh > 0) {
    warnings.push({ level: 'good', text: `漏感提供 ${magnetic.leakageUh.toFixed(1)} µH，副磁芯需补 ${magnetic.auxInductanceUh.toFixed(1)} µH（副磁芯气隙 ${magnetic.lgAux.toFixed(2)} mm）` })
  }
  if (!magnetic.windowOk) {
    warnings.push({ level: 'critical', text: `窗口占用 ${(magnetic.windowRatio * 100).toFixed(0)}%，超出可用窗口` })
  }
  if (!fmaxKhz || !Number.isFinite(fmaxKhz)) {
    warnings.push({ level: 'warn', text: '空载降不到 Gmin（k 偏大或 Vin 范围过宽），调频范围无法覆盖' })
  }
  if (lossOut.efficiency > 0.97) {
    warnings.push({ level: 'good', text: `预估效率 ${(lossOut.efficiency * 100).toFixed(1)}%，损耗模型口径下表现良好` })
  } else if (lossOut.efficiency < 0.9) {
    warnings.push({ level: 'warn', text: `预估效率 ${(lossOut.efficiency * 100).toFixed(1)}%，偏低，建议核查磁芯比损耗与绕组交流因子` })
  }
  if (tempRiseC > 150) {
    warnings.push({
      level: 'critical',
      text: `损耗 ${lossOut.totalLoss.toFixed(1)} W 在该磁芯表面积与当前散热条件下热流密度过高（ΔT>150 K，超出模型可信范围）：请把散热条件切到「风扇」或「强制风冷」，或加大磁芯 / 降低损耗`,
    })
  } else if (tempRiseC > 60) {
    warnings.push({ level: 'warn', text: `估算温升 ${tempRiseC.toFixed(0)} K，需确认实际散热条件（自然对流 / 风冷 / 散热器）` })
  }

  const tank: TankResult = {
    n: Number.isFinite(nActual) ? nActual : n,
    lr: lrUh,
    cr: crNf,
    lm: lmUh,
    q,
    k: inputs.kTarget,
    zr,
    rac,
    fr: inputs.fr,
    fmin: fminKhz,
    fmax: fmaxKhz,
    gMax,
    gMin,
    gNom,
    qmaxBoundary,
    qmaxPeak,
    qmaxTextbook,
    boundaryFn: bndFn,
    ipRms,
    isRms,
    imOff,
    zvsOk: imOff > 0 && Number.isFinite(fmaxKhz),
    gainOk: Number.isFinite(fminKhz) && fminKhz <= inputs.fr,
  }

  return {
    inputs,
    tank,
    magnetic,
    losses: lossOut.items,
    totalLoss: lossOut.totalLoss,
    efficiency: lossOut.efficiency,
    surfaceAreaCm2,
    tempRiseC,
    warnings,
    feasible,
  }
}

export { DEFAULT_GEOMETRY }
