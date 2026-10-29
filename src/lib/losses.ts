/**
 * 损耗模型
 *
 * 分项与依据：
 *  1. 磁芯损耗  —— 手册比损耗法：P = Pcv · Ve · K_wave
 *     依据：王鑫(2020) 3.1.1 节。该文指出方波励磁与正弦标定的差异主要来自涡流与剩余损耗，
 *     故引入波形修正系数 K_wave（论文实测口径取 1.25）。
 *     （Steinmetz 三参数拟合式需 iGSE 处理任意波形，本工具不内置，避免给出无出处的系数。）
 *  2. 绕组直流电阻 —— 电阻率法：Rdc = ρ·N·lw / Acu，Acu = I_rms / J
 *  3. 绕组交流因子 —— Dowell 箔式绕组单层模型：Fr = (Δ/2)·(sinhΔ + sinΔ)/(coshΔ − cosΔ)
 *     Δ = h/δ（导体厚度/趋肤深度），δ = √(ρ/(π·f·μ0))
 *     ⚠️ 多层并联绕组请用有限元或阻抗分析仪校核 —— 本式仅对单层/分层箔式绕组有效。
 *  4. 开关管：导通损耗 Ip²·Rds(on)·k_T；ZVS 开通损耗≈0，关断损耗 ½·Vin·I_off·t_f·fsw
 *  5. 整流：二极管 Vf·Iout，或同步整流 Is²·Rds(on)
 *  6. 副磁芯（承担 Lr 的那部分）按同法计入磁芯损耗
 */

import type { LossItem } from './types'

export const RHO_CU = 1.72e-8 // 铜电阻率 Ω·m @20℃

/** 趋肤深度 δ = √(ρ/(π·f·μ0))，返回 mm */
export function skinDepth(fHz: number, rho = RHO_CU): number {
  if (!(fHz > 0)) return NaN
  const mu0 = 4 * Math.PI * 1e-7
  return Math.sqrt(rho / (Math.PI * fHz * mu0)) * 1e3
}

/** Dowell 箔式绕组单层交流因子 Fr(Δ)，Δ = h/δ */
export function dowellFr(delta: number): number {
  if (!(delta > 0)) return 1
  if (delta > 20) return delta / 2 // 数值溢出保护：大 Δ 时渐近 Δ/2
  return (delta / 2) * ((Math.sinh(delta) + Math.sin(delta)) / (Math.cosh(delta) - Math.cos(delta)))
}

/** 单绕组直流电阻（Ω）：R = ρ·N·lw/Acu，Acu = I_rms/J */
export function windingDcResistance(
  turns: number,
  meanTurnLengthMm: number,
  irms: number,
  jAmm2: number,
): number {
  if (!(turns > 0) || !(jAmm2 > 0) || !(irms > 0)) return 0
  const lw = meanTurnLengthMm * 1e-3
  const acu = (irms / jAmm2) * 1e-6 // mm² → m²
  return (RHO_CU * turns * lw) / acu
}

export interface LossArgs {
  fswKhz: number
  ipRms: number
  isRms: number
  iOut: number
  imOff: number
  vinNom: number

  // 绕组
  np: number
  ns: number
  meanTurnLengthMm: number
  conductorThicknessMm: number // 箔厚/线厚，用于 Dowell
  currentDensity: number

  // 磁芯（主）
  corePcv: number // mW/cm³
  coreVe: number // cm³
  coreWaveK: number

  // 副磁芯（承担 Lr）
  auxCorePcv: number
  auxCoreVe: number

  // 开关
  mosfetRdsOn: number // mΩ @25℃
  rdsonTempFactor: number
  switchCount: number // 同时导通的原边管数（全桥 2，半桥 1）
  tFallNs: number // 关断下降时间 ns

  // 整流
  rectifier: 'full-wave-ct' | 'full-bridge'
  vf: number
  syncRect: boolean
  syncRectRdsOn: number // mΩ
}

export interface LossOut {
  items: LossItem[]
  totalLoss: number
  /**
   * 磁体自身损耗（铁损 + 绕组铜损），**不含**开关管与整流的损耗。
   *
   * 为什么必须单独拆出来：温升是按「这个发热体 → 这个散热面」算的。
   * MOSFET 的导通/关断损耗发热在芯片结上、整流的损耗发热在整流器件上，
   * 把它们算进磁芯的温升里会凭空替半导体背掉 1~2 W，导致温升严重高估。
   */
  magneticLoss: number
  /** 半导体损耗（开关管导通 + 关断 + 整流），供参考，不参与磁体温升 */
  semiconductorLoss: number
  efficiency: number
  detail: {
    core: number
    cuPrimary: number
    cuSecondary: number
    conduction: number
    switching: number
    rectifier: number
    auxCore: number
    acFactor: number
    skinDepthMm: number
  }
}

const COLORS = {
  core: '#ef4444',
  cuP: '#f59e0b',
  cuS: '#84cc16',
  cond: '#0d9488',
  sw: '#8b5cf6',
  rect: '#ec4899',
  aux: '#14b8a6',
}

export function computeLosses(a: LossArgs, pout: number): LossOut {
  const f = a.fswKhz * 1e3
  const delta =
    Number.isFinite(skinDepth(f)) && skinDepth(f) > 0 ? a.conductorThicknessMm / skinDepth(f) : 0
  const fr = dowellFr(delta)

  // 1) 主磁芯
  const core = (a.corePcv * a.coreVe * a.coreWaveK) / 1000

  // 2) 原边铜损（含交流因子）
  const rdcP = windingDcResistance(a.np, a.meanTurnLengthMm, a.ipRms, a.currentDensity)
  const cuPrimary = a.ipRms * a.ipRms * rdcP * fr

  // 3) 副边铜损
  const rdcS = windingDcResistance(a.ns, a.meanTurnLengthMm, a.isRms, a.currentDensity)
  const cuSecondary = a.isRms * a.isRms * rdcS * fr

  // 4) 开关管导通
  const rds = (a.mosfetRdsOn / 1000) * a.rdsonTempFactor
  const conduction = a.ipRms * a.ipRms * rds * a.switchCount

  // 5) 关断损耗（ZVS 开通损耗视为 0）
  const switching = 0.5 * a.vinNom * a.imOff * (a.tFallNs * 1e-9) * f * a.switchCount

  // 6) 整流损耗
  const rectifier = a.syncRect
    ? a.isRms * a.isRms * (a.syncRectRdsOn / 1000)
    : (a.rectifier === 'full-wave-ct' ? 1 : 2) * a.vf * a.iOut

  // 7) 副磁芯（承担 Lr 的电感磁芯）
  const auxCore = (a.auxCorePcv * a.auxCoreVe * a.coreWaveK) / 1000

  const items: LossItem[] = [
    { name: '主磁芯铁损', value: core, color: COLORS.core },
    { name: '原边铜损', value: cuPrimary, color: COLORS.cuP },
    { name: '副边铜损', value: cuSecondary, color: COLORS.cuS },
    { name: '开关管导通', value: conduction, color: COLORS.cond },
    { name: '开关关断', value: switching, color: COLORS.sw },
    { name: '整流损耗', value: rectifier, color: COLORS.rect },
    { name: '副磁芯铁损', value: auxCore, color: COLORS.aux },
  ].filter((x) => x.value > 0 && Number.isFinite(x.value))

  const totalLoss = items.reduce((s, x) => s + x.value, 0)
  // 磁体自身发热 = 主磁芯铁损 + 原边铜损 + 副边铜损 + 副磁芯铁损
  const magneticLoss = core + cuPrimary + cuSecondary + auxCore
  // 半导体发热 = 开关管导通 + 关断 + 整流
  const semiconductorLoss = conduction + switching + rectifier
  const efficiency = pout > 0 && pout + totalLoss > 0 ? pout / (pout + totalLoss) : 0

  return {
    items,
    totalLoss,
    magneticLoss,
    semiconductorLoss,
    efficiency,
    detail: {
      core,
      cuPrimary,
      cuSecondary,
      conduction,
      switching,
      rectifier,
      auxCore,
      acFactor: fr,
      skinDepthMm: skinDepth(f),
    },
  }
}
