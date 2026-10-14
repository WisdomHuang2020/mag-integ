/**
 * 磁集成变压器磁件设计
 *
 * 设计依据（每条公式都能对上出处，不凭印象）：
 *  - 匝数：法拉第定律（方波励磁）V = 4·f·N·B·Ae
 *  - 励磁电感：Lm = μ0·Np²·Ae / (lg + le/μr)  ⇒ 由目标 Lm 反推主磁芯气隙
 *  - 漏感：矩形（箔式）绕组两绕组经典模型
 *      Lk = μ0·Np²·(lw/bw)·d_eq,  d_eq = d1/3 + d12 + d2/3
 *    这是王鑫(2020)所述「磁场能量法」在二维矩形绕组、忽略端部效应下的解析结果。
 *  - 磁集成（磁芯组合集成）：所需 Lr = 变压器固有漏感 Lk + 副磁芯电感 Laux，
 *    再由 Laux 反推副磁芯气隙 —— 对应论文 2.4.1 节 (4)「通过调节副磁芯气隙使原边漏感
 *    满足谐振电感需求」的记述。
 */

import type { DesignInputs, MagneticResult } from './types'

export const MU0 = 4 * Math.PI * 1e-7

/** 绕组几何（漏感估算用） */
export interface MagneticGeometry {
  /** 绕组宽度（沿漏磁通路径方向）mm */
  windingWidth: number
  /** 原副边绝缘间距 mm */
  insulationGap: number
  /** 原边绕组总厚度 mm */
  primaryThickness: number
  /** 副边绕组总厚度 mm */
  secondaryThickness: number
  /** 平均匝长 mm */
  meanTurnLength: number
}

export const DEFAULT_GEOMETRY: MagneticGeometry = {
  windingWidth: 12,
  insulationGap: 0.4,
  primaryThickness: 0.6,
  secondaryThickness: 0.3,
  meanTurnLength: 60,
}

/** 原边匝数（方波，法拉第定律）：N = V / (4·f·B·Ae) */
export function primaryTurns(
  vinNom: number,
  fKhz: number,
  bT: number,
  aeMm2: number,
  topology: string,
): number {
  const v = topology === 'half-bridge' ? vinNom / 2 : vinNom
  const f = fKhz * 1e3
  const ae = aeMm2 * 1e-6
  if (!(f > 0) || !(bT > 0) || !(ae > 0)) return 0
  return Math.max(1, Math.ceil(v / (4 * f * bT * ae)))
}

/** 由实际取整匝数反算峰值工作磁密 B = V/(4·f·N·Ae) */
export function peakFluxDensity(
  vinNom: number,
  fKhz: number,
  np: number,
  aeMm2: number,
  topology: string,
): number {
  const v = topology === 'half-bridge' ? vinNom / 2 : vinNom
  const f = fKhz * 1e3
  const ae = aeMm2 * 1e-6
  if (!(f > 0) || !(np > 0) || !(ae > 0)) return 0
  return v / (4 * f * np * ae)
}

/**
 * 由目标电感反推所需气隙（理想磁路式，未计边缘效应/磁芯窗口泄漏）。
 * Lm = μ0·N²·Ae/(lg + le/μr)  ⇒  lg = μ0·N²·Ae/Lm − le/μr
 * @returns 气隙 mm；返回负值表示该匝数下磁芯本身已超过目标电感（不可行）
 */
export function airGapForInductance(
  targetUh: number,
  np: number,
  aeMm2: number,
  leMm: number,
  muR: number,
): number {
  const l = targetUh * 1e-6
  const ae = aeMm2 * 1e-6
  const le = leMm * 1e-3
  if (!(l > 0) || !(np > 0) || !(ae > 0)) return NaN
  return (MU0 * np * np * ae / l - le / muR) * 1e3
}

/** 正演：给定气隙求电感（与上式互逆，供展示/复核） */
export function inductanceFromGap(
  gapMm: number,
  np: number,
  aeMm2: number,
  leMm: number,
  muR: number,
): number {
  const lg = Math.max(gapMm, 0) * 1e-3
  const ae = aeMm2 * 1e-6
  const le = leMm * 1e-3
  if (!(np > 0) || !(ae > 0)) return 0
  return (MU0 * np * np * ae / (lg + le / muR)) * 1e6
}

/** 变压器固有漏感（折算原边）：Lk = μ0·Np²·(lw/bw)·(d1/3 + d12 + d2/3) */
export function leakageInductance(np: number, g: MagneticGeometry): number {
  const lw = g.meanTurnLength * 1e-3
  const bw = g.windingWidth * 1e-3
  const dEq = (g.primaryThickness / 3 + g.insulationGap + g.secondaryThickness / 3) * 1e-3
  if (!(np > 0) || !(bw > 0)) return 0
  return ((MU0 * np * np * lw * dEq) / bw) * 1e6
}

/** 面积积 Ap = Ae·Aw（cm⁴） */
export function areaProduct(aeMm2: number, awMm2: number): number {
  return (aeMm2 * awMm2) / 1e4
}

/** 所需面积积（cm⁴）：Ap = Pout·1e4 / (Kf·f·B·Ku·J)，方波 Kf = 4，J 用 A/cm² */
export function requiredAreaProduct(
  pout: number,
  fKhz: number,
  bT: number,
  ku: number,
  jAmm2: number,
): number {
  const f = fKhz * 1e3
  if (!(f > 0) || !(bT > 0) || !(ku > 0) || !(jAmm2 > 0)) return NaN
  const jCm2 = jAmm2 * 100
  return (pout * 1e4) / (4 * f * bT * ku * jCm2)
}

/** 窗口占用：Np·Acu_p + Ns·Acu_s ≤ Ku·Aw */
export function windowUtilization(
  np: number,
  ns: number,
  ipRms: number,
  isRms: number,
  jAmm2: number,
  awMm2: number,
  ku: number,
) {
  const acuP = jAmm2 > 0 ? ipRms / jAmm2 : 0
  const acuS = jAmm2 > 0 ? isRms / jAmm2 : 0
  const used = np * acuP + ns * acuS
  const available = awMm2 * ku
  const ratio = available > 0 ? used / available : Infinity
  return { used, available, ratio, ok: ratio <= 1 }
}

export interface MagneticDesignArgs {
  inputs: DesignInputs
  geometry: MagneticGeometry
  np: number
  ns: number
  /** 谐振腔所需 Lr（μH） */
  lrRequired: number
  /** 目标励磁电感 Lm（μH） */
  lmTarget: number
  ipRms: number
  isRms: number
  /** 材料饱和磁密 @100℃（T） */
  bsat: number
  /** 磁芯相对磁导率（MnZn 铁氧体常取 2200） */
  muR: number
  /** 副磁芯有效截面积 mm² */
  auxAeMm2: number
  /** 副磁芯有效磁路长度 mm */
  auxLeMm: number
}

export function designMagnetic(a: MagneticDesignArgs): MagneticResult {
  const { inputs, geometry, np, ns } = a
  const notes: string[] = []

  // 1) 工作磁密与裕量
  const bPeak = peakFluxDensity(inputs.vinNom, inputs.fr, np, inputs.coreAe, inputs.topology)
  const bMargin = bPeak > 0 ? a.bsat / bPeak : 0
  if (bMargin > 0 && bMargin < 1.2) {
    notes.push(`工作磁密 ${(bPeak * 1000).toFixed(1)} mT 距 Bsat 仅 ${bMargin.toFixed(2)} 倍裕量，建议增大 Ae 或增加匝数`)
  }

  // 2) 主磁芯气隙（决定 Lm）
  const lgMain = airGapForInductance(a.lmTarget, np, inputs.coreAe, inputs.coreLe, a.muR)
  const lgMainFeasible = Number.isFinite(lgMain) && lgMain >= 0
  if (!lgMainFeasible && Number.isFinite(lgMain)) {
    notes.push(`主磁芯开气隙也达不到 Lm=${a.lmTarget.toFixed(1)} µH（需 ${np} 匝下磁芯本身电感已偏小），应增大 Ae 或提高 k`)
  }

  // 3) 固有漏感 → 副磁芯需补足的电感
  const leakageUh = leakageInductance(np, geometry)
  const auxInductanceUh = Math.max(0, a.lrRequired - leakageUh)
  if (leakageUh > a.lrRequired) {
    notes.push(
      `变压器固有漏感 ${leakageUh.toFixed(1)} µH 已超过所需 Lr=${a.lrRequired.toFixed(1)} µH，` +
        `应加大原副边间距或改绕组排布以降低漏感（否则谐振频率会偏低）`,
    )
  }

  // 4) 副磁芯气隙（决定补足电感）
  const lgAux = auxInductanceUh > 0
    ? airGapForInductance(auxInductanceUh, np, a.auxAeMm2, a.auxLeMm, a.muR)
    : 0
  const lgAuxFeasible = Number.isFinite(lgAux) && lgAux >= 0

  // 5) 面积积对比
  const apActual = areaProduct(inputs.coreAe, inputs.coreAw)
  const apRequired = requiredAreaProduct(
    inputs.pout,
    inputs.fr,
    inputs.bTarget,
    inputs.fillFactor,
    inputs.currentDensity,
  )

  // 6) 窗口占用
  const win = windowUtilization(np, ns, a.ipRms, a.isRms, inputs.currentDensity, inputs.coreAw, inputs.fillFactor)
  if (!win.ok) {
    notes.push(`窗口占用 ${(win.ratio * 100).toFixed(0)}%，超出可用窗口，应降低电流密度、增大 Aw 或改用多股线`)
  }

  return {
    np,
    ns,
    bPeak,
    bMargin,
    apRequired,
    apActual,
    lgMain,
    lgAux,
    lgMainFeasible,
    lgAuxFeasible,
    leakageUh,
    auxInductanceUh,
    windowRatio: win.ratio,
    windowOk: win.ok,
    notes,
  }
}
