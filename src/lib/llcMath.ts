/**
 * LLC 谐振腔数学（基波近似 FHA）
 *
 * 归一化约定：
 *   fn = fsw / fr          归一化频率
 *   k  = Lm / Lr           电感比
 *   Q  = Zr / Rac          品质因数，Zr = √(Lr/Cr)，Rac = 8n²Vout²/(π²Pout)
 *
 * 全部为纯函数，无副作用。
 */

/** FHA 电压增益：M(fn) = 1 / √[ (1 + (1/k)(1 − 1/fn²))² + (Q(fn − 1/fn))² ] */
export function gainM(fn: number, k: number, q: number): number {
  const a = 1 + (1 / k) * (1 - 1 / (fn * fn))
  const b = q * (fn - 1 / fn)
  return 1 / Math.sqrt(a * a + b * b)
}

/** 谐振腔输入阻抗（以 Zr 归一化）：Zin/Zr = j(fn − 1/fn) + j·k·fn/(1 + j·k·fn·Q) */
export function inputImpedanceNorm(
  fn: number,
  k: number,
  q: number,
): { re: number; im: number; mag: number; phase: number } {
  const d = 1 + fn * fn * k * k * q * q
  const re = (fn * fn * k * k * q) / d
  const im = fn - 1 / fn + (fn * k) / d
  return {
    re,
    im,
    mag: Math.sqrt(re * re + im * im),
    phase: (Math.atan2(im, re) * 180) / Math.PI,
  }
}

/**
 * 感性区 / 容性区分界点（Im(Zin) = 0）的归一化频率。
 * 令 x = fn²，解 k²Q²x² + (1 + k − k²Q²)x − 1 = 0 取正根。
 * fn < fn_b 为容性区（不能稳定工作）；fn > fn_b 为感性区（可 ZVS）。
 */
export function boundaryFn(k: number, q: number): number {
  const a = k * k * q * q
  if (!(a > 0) || !(k > 0)) return NaN
  const b = 1 + k - a
  const disc = b * b + 4 * a
  const x = (-b + Math.sqrt(disc)) / (2 * a)
  return x > 0 ? Math.sqrt(x) : NaN
}

/** 感性区内可达的增益上限 = 分界点处的增益 */
export function boundaryGain(k: number, q: number): number {
  const fn = boundaryFn(k, q)
  return Number.isFinite(fn) ? gainM(fn, k, q) : NaN
}

/** 在 fn ∈ [0.3, 1.0] 数值寻优求峰值增益 */
export function peakGain(k: number, q: number): number {
  let maxM = 0
  for (let fn = 0.3; fn <= 1.0; fn += 0.005) {
    const m = gainM(fn, k, q)
    if (m > maxM) maxM = m
  }
  return maxM
}

/** 「感容分界点增益 = Gmax」判据下的 Q 上限（二分求解，更保守，保证感性区内够得着） */
export function qmax1Boundary(k: number, gMax: number): number {
  if (!(k > 0) || !(gMax > 1)) return NaN
  let lo = 1e-4
  let hi = 20
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2
    if (boundaryGain(k, mid) > gMax) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

/** 「峰值增益 = Gmax」判据下的 Q 上限（只保证增益数值，不保证落在感性区） */
export function qmax1Peak(k: number, gMax: number): number {
  if (!(k > 0) || !(gMax > 0)) return NaN
  let lo = 0.001
  let hi = 5
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (peakGain(k, mid) > gMax) lo = mid
    else hi = mid
    if (hi - lo < 1e-6) break
  }
  return (lo + hi) / 2
}

/**
 * 教材闭式解：Qmax = 1/(k·Gmax) · √( k + Gmax²/(Gmax² − 1) )
 * 实为「感容分界点增益 = Gmax」判据的精确解析解。
 */
export function qmax1Textbook(k: number, gMax: number): number {
  const denom = gMax * gMax - 1
  if (!(k > 0) || !(denom > 0)) return NaN
  return (1 / (k * gMax)) * Math.sqrt(k + (gMax * gMax) / denom)
}

/**
 * 满载增益曲线上 M = target 的交点频率（取感性区一侧，即峰值右侧）。
 * 物理含义：满载 + 最低母线所需的最低开关频率（全工况最坏）。
 */
export function fullLoadGainCrossing(k: number, q: number, target: number): number {
  const fnLower = 1 / Math.sqrt(1 + k)
  const step = 0.001
  let fnPeak = fnLower + step
  let mPeak = -Infinity
  for (let fn = fnLower + step; fn <= 1; fn += step) {
    const m = gainM(fn, k, q)
    if (m > mPeak) {
      mPeak = m
      fnPeak = fn
    }
  }
  if (mPeak <= target) return fnPeak
  let lo = fnPeak
  let hi = 1
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (gainM(mid, k, q) >= target) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

/**
 * 空载（Q→0）增益曲线与 M = Gmin 的交点频率 —— 调频上限 fmax。
 * fmax = fr·√[ Gmin / (Gmin(k+1) − k) ]，需 Gmin ≥ k/(k+1)，否则降不到 Gmin。
 */
export function fmaxZvs(fr: number, k: number, gMin: number): number {
  const den = gMin * (k + 1) - k
  if (!(den > 1e-9) || !(fr > 0)) return Infinity
  return fr * Math.sqrt(Math.max(0.001, gMin / den))
}

/** 关断时刻励磁电流峰值 Im_off（ZVS 换流唯一能量来源）：Vin/(coeff·fmax·Lm) */
export function magnetizingCurrentOffPeak(
  vinMin: number,
  fmaxKhz: number,
  lmUh: number,
  topology: string,
): number {
  const coeff = topology === 'half-bridge' ? 8 : 4
  const f = Number.isFinite(fmaxKhz) && fmaxKhz > 0 ? fmaxKhz : 0
  if (!(f > 0) || !(lmUh > 0) || !(vinMin > 0)) return 0
  // 单位：Vin[V] / (coeff · f[Hz] · Lm[H])，这里 f 以 kHz、Lm 以 µH 输入 ⇒ 换算系数
  return vinMin / (coeff * f * 1e3 * lmUh * 1e-6)
}

/** 死区内完成 C_oss 充放电所需时间 t_ZVS = coeff·fmax·Lm·Ctot（与 Vin 无关） */
export function zvsCrossTime(
  fmaxHz: number,
  lmH: number,
  cossZvsF: number,
  topology: string,
): number {
  const coeff = topology === 'half-bridge' ? 8 : 4
  return coeff * fmaxHz * lmH * cossZvsF
}

/** 把数值吸附到最近 E 系列标称值（用于电容选型） */
export function nearestE(value: number, series: number[]): number {
  const exponent = Math.floor(Math.log10(value))
  const mantissa = value / Math.pow(10, exponent)
  let closest = series[0]
  let minDiff = Math.abs(mantissa - closest)
  for (const v of series) {
    const diff = Math.abs(mantissa - v)
    if (diff < minDiff) {
      minDiff = diff
      closest = v
    }
  }
  return closest * Math.pow(10, exponent)
}

export const E12 = [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2]
export const E24 = [
  1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2,
  6.8, 7.5, 8.2, 9.1,
]
