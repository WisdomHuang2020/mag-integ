/**
 * 磁芯材料与磁芯规格库
 *
 * ⚠️ 数据诚实性约定：
 *  每个条目都带 `source` 字段，明确标注该数据从哪来。
 *  - 标注「论文」的：取自本地文献库中的学位论文，可直接引用；
 *  - 标注「公开典型值」的：为厂商公开资料的常见值，**使用前请核对最新手册**；
 *  - 凡是本工具没有可靠出处的数值，一律不给，改为由用户输入。
 */

export interface CoreMaterial {
  id: string
  name: string
  vendor: string
  /** 饱和磁通密度 @100 ℃（T） */
  bsat100: number
  /** 居里温度（℃），未知则填 0 */
  curieTemp: number
  /** 材料特性备注 */
  note: string
  /** 数据出处 */
  source: string
}

export const CORE_MATERIALS: CoreMaterial[] = [
  {
    id: 'DMR95',
    name: 'DMR95',
    vendor: '东磁（DMEGC）',
    bsat100: 0.38,
    curieTemp: 0,
    note: '高频低损耗 MnZn 功率铁氧体；论文中作为备选材料。',
    source: '王鑫《高频 LLC 变换器的平面磁集成变压器设计》(北交大 2020) 2.5.2 节：100 ℃ 时 Bs = 380 mT',
  },
  {
    id: 'DMR50',
    name: 'DMR50',
    vendor: '东磁（DMEGC）',
    bsat100: 0,
    curieTemp: 0,
    note: '比损耗在 80 ℃ 附近达到谷值，工作温度宜控制在 80 ℃ 以下；论文最终选用材料。',
    source: '王鑫 2020 硕士论文 2.5.2 节（比损耗—温度/频率/磁密曲线，论文未给出 Bsat 数值）',
  },
  {
    id: 'PC95',
    name: 'PC95',
    vendor: 'TDK',
    bsat100: 0.39,
    curieTemp: 215,
    note: '宽温低损耗 MnZn 铁氧体，功率变换常用。',
    source: '公开典型值（TDK PC95 资料），使用前请核对最新手册',
  },
  {
    id: 'PC90',
    name: 'PC90',
    vendor: 'TDK',
    bsat100: 0.38,
    curieTemp: 215,
    note: '低损耗 MnZn 铁氧体。',
    source: '公开典型值（TDK PC90 资料），使用前请核对最新手册',
  },
]

export function findMaterial(id: string): CoreMaterial | undefined {
  return CORE_MATERIALS.find((m) => m.id === id)
}

export interface CoreSpec {
  id: string
  name: string
  /** 有效截面积 mm² */
  ae: number
  /** 有效体积 cm³ */
  ve: number
  /** 有效磁路长度 mm */
  le: number
  /** 窗口面积 mm²（单边窗口，EE 型按单边计） */
  aw: number
  note: string
  source: string
}

/**
 * 磁芯规格预设。
 * ⚠️ 论文中出现过 EE34A / EE35H 等型号，但论文正文未给出完整尺寸表，
 *    因此这里的数值一律标注为「示例值」——请按实际磁芯手册替换后再用于设计定型。
 *    单位约定：ae 为 mm²、ve 为 **cm³**、le 为 mm、aw 为 mm²。
 *    自洽性检查：ve ≈ ae × le（例如 120 mm² × 74 mm ≈ 8.9 cm³）。
 */
export const CORE_SPECS: CoreSpec[] = [
  {
    id: 'EE34A',
    name: 'EE34A',
    ae: 110,
    ve: 7.8,
    le: 71,
    aw: 150,
    note: '论文中用于磁密/损耗分布对比的磁芯之一。',
    source: '王鑫 2020 硕士论文 2.3 节提及型号；尺寸为示例值，需核对手册',
  },
  {
    id: 'EE35H',
    name: 'EE35H',
    ae: 120,
    ve: 8.9,
    le: 74,
    aw: 170,
    note: '论文中用于磁密/损耗分布对比的磁芯之一。',
    source: '王鑫 2020 硕士论文 2.3 节提及型号；尺寸为示例值，需核对手册',
  },
  {
    id: 'CUSTOM',
    name: '自定义',
    ae: 0,
    ve: 0,
    le: 0,
    aw: 0,
    note: '手动输入磁芯参数。',
    source: '用户输入',
  },
]

export function findCoreSpec(id: string): CoreSpec | undefined {
  return CORE_SPECS.find((c) => c.id === id)
}
