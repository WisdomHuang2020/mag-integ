/**
 * 磁集成 LLC 变压器设计工具 —— 共享类型与默认值
 *
 * 设计模型说明（避免与参考项目 llc-design-tool 混淆）：
 *  - 谐振腔部分沿用标准 FHA（基波近似）模型，与 llc-design-tool 一致；
 *  - **磁集成部分为本工具新增**：在标准 LLC 参数（Lr/Cr/Lm）确定后，
 *    进一步求解磁件结构（磁芯选型、匝数、主/副磁芯气隙、磁通密度、损耗）。
 */

export type Topology = 'half-bridge' | 'full-bridge'
export type Rectifier = 'full-wave-ct' | 'full-bridge'

/**
 * 磁集成方案分类。
 * 依据：王鑫《高频 LLC 变换器的平面磁集成变压器设计》(北京交通大学, 2020) 2.4.1 节
 * 对四类方案的归纳与对比，该文最终选用「磁芯组合集成」。
 */
export type MagScheme =
  | 'core-combination' // 磁芯组合集成：磁芯A为主磁芯、磁芯B为副磁芯；主磁芯气隙控（副边漏感小），副磁芯气隙控原边漏感 ⇒ 即控制 Lr
  | 'side-leg-decouple' // 磁芯边柱解耦集成：原副边绕中柱，边柱绕等匝数绕组
  | 'external-inductor' // 电感磁芯外挂，磁路解耦集成
  | 'transformer-grouping' // 变压器成组（大变压器拆分为多个小变压器，原边串、副边并）

export const SCHEME_LABEL: Record<MagScheme, string> = {
  'core-combination': '磁芯组合集成（主磁芯 + 副磁芯）',
  'side-leg-decouple': '磁芯边柱解耦集成',
  'external-inductor': '电感磁芯外挂（磁路解耦）',
  'transformer-grouping': '变压器成组',
}

/** 设计输入 */
export interface DesignInputs {
  // ── 电气规格 ──
  vinMin: number // V
  vinNom: number // V
  vinMax: number // V
  vout: number // V
  pout: number // W
  fr: number // 谐振频率 kHz
  topology: Topology
  rectifier: Rectifier
  vf: number // 整流管正向压降 V

  // ── 谐振腔设计偏好 ──
  kTarget: number // 电感比 k = Lm/Lr（典型 3~8，越大励磁损耗越低但增益范围越窄）
  qMargin: number // Q 降额系数（典型 0.90~0.95）

  /**
   * 谐振腔参数直接覆盖（0 = 不覆盖，由本工具按规格反推）。
   * 用途：本工具的 Q 只按「感容分界点增益」判据取值，**不含 ZVS 死区约束**
   * （那属于 LLC 电路设计，见参考站）。若你已在 LLC 工具中完成完整设计
   * （含 Qmax2 死区约束），请把它的 Lr / Lm / n 直接填在这里，本工具据此做磁件设计。
   */
  lrOverride: number // µH
  lmOverride: number // µH
  nOverride: number // 匝比

  /** 散热条件：决定等效对流换热系数 h（W/m²·K） */
  coolingMode: 'natural' | 'fan' | 'forced'

  // ── 磁件参数 ──
  coreMaterialId: string
  coreAe: number // 磁芯有效截面积 mm²
  coreVe: number // 磁芯有效体积 cm³
  coreLe: number // 磁芯有效磁路长度 mm
  coreAw: number // 磁芯窗口面积 mm²
  bTarget: number // 工作磁通密度设计目标 T
  currentDensity: number // 电流密度 A/mm²
  fillFactor: number // 窗口填充系数

  // ── 磁集成方案 ──
  scheme: MagScheme

  // ── 绕组几何（磁集成漏感设计的核心调节量；参考网站无此项）──
  geomWindingWidth: number // 绕组宽度 bw，mm
  geomInsulationGap: number // 原副边绝缘间距 d12，mm —— 调大即增大漏感
  geomPrimaryThickness: number // 原边绕组厚度 d1，mm
  geomSecondaryThickness: number // 副边绕组厚度 d2，mm
  geomMeanTurnLength: number // 平均匝长 lw，mm
  auxAeRatio: number // 副磁芯有效截面积 / 主磁芯（磁芯组合方案）

  // ── 损耗模型参数 ──
  corePcv: number // 磁芯比损耗 mW/cm³（查手册，目标温度/频率/B 工况）
  coreWaveK: number // 波形修正系数（手册多为正弦标定，方波励磁取 1.25）
  windingRdcPerTurn: number // 单匝直流电阻 μΩ/匝（或用线规估算，见 losses.ts）
  mosfetRdsOn: number // mΩ @25℃
  rdsonTempFactor: number // Rds(on) 温度修正系数
}

/** 磁集成变压器设计结果（本工具新增部分） */
export interface MagneticResult {
  np: number // 原边匝数
  ns: number // 副边匝数
  bPeak: number // 峰值工作磁密 T
  bMargin: number // Bsat / Bpeak 裕量（>1 合格）
  apRequired: number // 所需面积积 cm⁴
  apActual: number // 实际面积积 cm⁴
  lgMain: number // 主磁芯气隙 mm（决定 Lm）
  lgAux: number // 副磁芯气隙 mm（磁芯组合方案下决定 Lr）
  lgMainFeasible: boolean // 主气隙是否有可行解（<0 说明该磁芯已达电感上限）
  lgAuxFeasible: boolean
  leakageUh: number // 变压器固有漏感（折算原边）μH
  auxInductanceUh: number // 需由副磁芯补足的电感 μH
  windowRatio: number // 窗口占用率
  windowOk: boolean
  notes: string[] // 计算过程中的提示（面向工程师）
}

/** 谐振腔计算结果 */
export interface TankResult {
  n: number
  lr: number // μH
  cr: number // nF
  lm: number // μH
  q: number
  k: number
  zr: number // Ω
  rac: number // Ω
  fr: number // kHz
  fmin: number // kHz
  fmax: number // kHz
  gMax: number
  gMin: number
  gNom: number
  qmaxBoundary: number
  qmaxPeak: number
  qmaxTextbook: number
  boundaryFn: number
  ipRms: number // A
  isRms: number // A
  imOff: number // A
  zvsOk: boolean
  gainOk: boolean
}

/** 损耗分项 */
export interface LossItem {
  name: string
  value: number // W
  color: string
}

/** 诊断告警 */
export interface Warning {
  level: 'good' | 'warn' | 'critical'
  text: string
}

/** 完整设计结果 */
export interface DesignResult {
  inputs: DesignInputs
  tank: TankResult
  magnetic: MagneticResult
  losses: LossItem[]
  totalLoss: number
  efficiency: number
  surfaceAreaCm2: number
  tempRiseC: number
  warnings: Warning[]
  feasible: boolean
}

/**
 * 默认输入 —— 对齐参考站 llc.power-knowledge.tech 的默认算例：
 *   400 V(380~420) → 24 V / 96 W，100 kHz，半桥，同步整流，k = 4，Q 降额 0.857
 * 这样本工具的输出可以直接衔接该站的谐振腔设计结果。
 * 磁件侧参数为示例值，使用前请按实际磁芯手册替换。
 */
export const DEFAULT_INPUTS: DesignInputs = {
  vinMin: 380,
  vinNom: 400,
  vinMax: 420,
  vout: 24,
  pout: 96,
  fr: 100,
  topology: 'half-bridge',
  rectifier: 'full-wave-ct',
  vf: 0.5,

  kTarget: 4,
  qMargin: 0.857,

  // 默认不覆盖，由本工具按规格反推（参考站的完整设计含 ZVS 死区约束，其二者的 Lr/Lm 请自行填入）
  lrOverride: 0,
  lmOverride: 0,
  nOverride: 0,

  coolingMode: 'natural',

  coreMaterialId: 'DMR95',
  coreAe: 110,
  // ⚠️ 单位是 cm³。必须与 Ae、le 自洽：Ve ≈ Ae × le = 110 mm² × 71 mm ≈ 7.8 cm³
  coreVe: 7.8,
  coreLe: 71,
  coreAw: 150,
  bTarget: 0.12,
  currentDensity: 4,
  fillFactor: 0.35,

  scheme: 'core-combination',

  // 绕组几何默认值：平面（箔式）绕组的典型量级
  geomWindingWidth: 12,
  geomInsulationGap: 0.4,
  geomPrimaryThickness: 0.6,
  geomSecondaryThickness: 0.3,
  geomMeanTurnLength: 60,
  auxAeRatio: 0.6,

  corePcv: 250,
  coreWaveK: 1.25,
  windingRdcPerTurn: 60,
  mosfetRdsOn: 150,
  rdsonTempFactor: 1.6,
}
