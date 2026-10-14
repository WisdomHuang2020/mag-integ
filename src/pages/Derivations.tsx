/**
 * 磁路与磁件公式
 *
 * 定位：**不重复 FHA 增益推导**（那属于 LLC 电路理论，见参考站 llc.power-knowledge.tech/derivations）。
 * 本页只列「从 Lr / Lm 到实际磁件」这一步用到的公式，并标注每条的分类与出处。
 */

import { MB } from '../components/Math'

interface FormulaRow {
  name: string
  tex: string
  source: string
  kind: '文献' | '公开公式' | '工程近似'
  note: string
}

const MAGNETIC: FormulaRow[] = [
  {
    name: '原边匝数（法拉第定律）',
    tex: 'N_p=\\frac{V_{in}}{4\\,f_{sw}\\,B_m\\,A_e}',
    source: '方波励磁下的法拉第定律；系数 4 来自方波（正弦为 4.44）',
    kind: '公开公式',
    note: '全桥 V_in 取母线电压；半桥取 V_in/2。Bm 为峰值工作磁密，需低于 Bsat 并留 1.2 倍以上裕量。',
  },
  {
    name: '励磁电感与气隙（正推）',
    tex: 'L_m=\\frac{\\mu_0 N_p^2 A_e}{l_g+l_e/\\mu_r}',
    source: '带气隙磁芯的磁路欧姆定律（理想式）',
    kind: '工程近似',
    note: '未计边缘效应（fringing）。气隙越大，实际电感越高于此式的计算值。',
  },
  {
    name: '主磁芯气隙（反推，锁定 Lm）',
    tex: 'l_{g,A}=\\frac{\\mu_0 N_p^2 A_e}{L_m}-\\frac{l_e}{\\mu_r}',
    source: '上式对 lg 反解',
    kind: '公开公式',
    note: '本工具用它算出「主磁芯气隙」。结果为负 ⇒ 该匝数下磁芯自身电感已偏小，需增大 Ae 或提高 k。',
  },
  {
    name: '漏感（磁场能量法二维解）',
    tex: 'L_k=\\mu_0 N_p^2\\frac{l_w}{b_w}\\left(\\frac{d_1}{3}+d_{12}+\\frac{d_2}{3}\\right)',
    source: '王鑫(2020) 第 4 章以磁场能量法计算漏感；本式为其二维矩形绕组解析形式',
    kind: '文献',
    note: 'lw 平均匝长、bw 绕组宽度、d1/d2 原副边厚度、d12 绝缘间距。忽略端部效应，用于方案对比足够。',
  },
  {
    name: '磁集成电感分配（核心等式）',
    tex: 'L_r=L_{k,\\text{漏感}}+L_{aux}(l_{g,B})',
    source: '王鑫(2020) 2.4.1 节 (4)：主磁芯气隙取小以减小副边漏感，调副磁芯气隙使原边漏感满足谐振电感需求',
    kind: '文献',
    note: '这是本工具磁件设计的主线：先算固有漏感，缺口全部由副磁芯承担，再由 Laux 反推副磁芯气隙。',
  },
  {
    name: '副磁芯气隙（反推，调节 Lr）',
    tex: 'l_{g,B}=\\frac{\\mu_0 N_p^2 A_{e,B}}{L_{aux}}-\\frac{l_{e,B}}{\\mu_r}',
    source: '同主磁芯气隙式，作用于副磁芯',
    kind: '公开公式',
    note: 'Ae,B 由「副磁芯截面积比」输入决定。比值越小，所需气隙越大、漏磁越显著，需有限元复核。',
  },
  {
    name: '面积积',
    tex: 'A_p=A_eA_w=\\frac{P_o\\times10^4}{K_f\\,f_{sw}\\,B_m\\,K_u\\,J}',
    source: '面积积法（Ap method）标准式，方波 Kf = 4',
    kind: '公开公式',
    note: '单位：Ap 为 cm⁴，J 为 A/cm²。用于粗判磁芯规格是否够用。',
  },
  {
    name: '窗口占用校验',
    tex: 'N_p\\frac{I_{p,rms}}{J}+N_s\\frac{I_{s,rms}}{J}\\le K_u A_w',
    source: '按设计电流密度反推所需铜截面',
    kind: '公开公式',
    note: '占用率超过 100% 即无法绕下，需降低电流密度、增大窗口或改用多股线。',
  },
  {
    name: '峰值磁密复核',
    tex: 'B_m=\\frac{V_{in}}{4\\,f_{sw}\\,N_p\\,A_e}',
    source: '与匝数式互逆',
    kind: '公开公式',
    note: '匝数取整后必须用它复核，确认仍低于 Bsat（工作温度下）。',
  },
]

const LOSS: FormulaRow[] = [
  {
    name: '磁芯损耗（比损耗法）',
    tex: 'P_{core}=P_{cv}\\cdot V_e\\cdot K_{wave}',
    source: '王鑫(2020) 3.1.1 节：磁芯损耗由磁滞、涡流、剩余损耗构成，方波与正弦标定的差异主要来自涡流与剩余损耗',
    kind: '文献',
    note: 'Pcv 为工作频率/磁密/温度下从手册查得的比损耗（mW/cm³）。论文口径取 Kwave = 1.25。',
  },
  {
    name: '绕组交流因子（Dowell）',
    tex: 'F_r=\\frac{\\Delta}{2}\\cdot\\frac{\\sinh\\Delta+\\sin\\Delta}{\\cosh\\Delta-\\cos\\Delta},\\quad \\Delta=\\frac{h}{\\delta},\\quad \\delta=\\sqrt{\\frac{\\rho}{\\pi f\\mu_0}}',
    source: 'Dowell 箔式绕组模型（公开）；δ 为趋肤深度',
    kind: '工程近似',
    note: '仅对单层/分层箔式绕组有效。多层并联绕组需按孔隙率修正，或用有限元/阻抗分析仪校核。',
  },
  {
    name: '绕组直流电阻',
    tex: 'R_{dc}=\\frac{\\rho_{Cu}\\,N\\,l_w}{A_{cu}},\\quad A_{cu}=\\frac{I_{rms}}{J}',
    source: '电阻率法；ρCu = 1.72×10⁻⁸ Ω·m',
    kind: '公开公式',
    note: '按设计电流密度反推所需铜截面，与实际线规选型配合。',
  },
  {
    name: '温升估算',
    tex: '\\Delta T=P_{loss}\\cdot\\frac{1}{h\\,A_s},\\quad A_s\\approx6V_e^{2/3}',
    source: '等效外表面积 + 对流换热系数（h ≈ 15 W/m²·K，自然对流含辐射量级）',
    kind: '工程近似',
    note: '单一热阻，无热点分层。ΔT 超过 150 K 时线性外推已无物理意义（本工具会直接限幅显示）。',
  },
]

export default function Derivations() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-7">
        <h1 className="text-xl font-semibold text-slate-100">磁路与磁件公式</h1>
        <p className="mt-2 text-[12px] leading-relaxed text-slate-400">
          本页只列「从 Lr / Lm 到实际磁件」这一步用到的公式。
          <strong className="text-slate-300">FHA 增益方程的推导、输入阻抗与感容分界</strong>
          属于 LLC 电路理论，已在参考站
          <a
            href="https://www.llc.power-knowledge.tech/derivations"
            target="_blank"
            rel="noreferrer"
            className="mx-1 underline decoration-cyan-400/50 hover:text-cyan-300"
          >
            llc.power-knowledge.tech/derivations
          </a>
          完整给出，此处不再重复。
        </p>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-[11px] text-slate-500">
          <span>
            <span className="mr-1 rounded bg-emerald-500/10 px-1.5 text-emerald-400">文献</span>
            取自本地文献库论文
          </span>
          <span>
            <span className="mr-1 rounded bg-cyan-500/10 px-1.5 text-cyan-400">公开公式</span>
            教材 / 厂商资料的标准形式
          </span>
          <span>
            <span className="mr-1 rounded bg-amber-500/10 px-1.5 text-amber-400">工程近似</span>
            写明假设与失效边界
          </span>
        </div>
      </header>

      <Section title="一、磁路与磁件几何" rows={MAGNETIC} />
      <Section title="二、损耗与温升" rows={LOSS} />

      <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-[13px] font-semibold text-slate-200">三、本工具未建模的部分（明确声明）</h2>
        <ul className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-slate-400">
          <li>· <span className="text-slate-300">边缘效应</span>：气隙公式按理想磁路计算，未含 fringing 修正——实际电感会高于计算值。</li>
          <li>· <span className="text-slate-300">分布电容</span>：未建模。高频下原副边分布电容影响共模噪声与谐振，需另行评估。</li>
          <li>· <span className="text-slate-300">绕组排布</span>：漏感公式假设矩形绕组截面，未区分交错/分层排布带来的差异。</li>
          <li>· <span className="text-slate-300">多相均流</span>：两相交错并联下的均流机理与磁集成均流结构未纳入本版。</li>
          <li>· <span className="text-slate-300">热点与热阻分层</span>：温升为单一热阻估算，无热网络与热点温度。</li>
        </ul>
      </section>

      <section className="mt-5 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-[13px] font-semibold text-slate-200">四、结论的文献来源</h2>
        <p className="mt-2 text-[12px] leading-relaxed text-slate-400">
          磁集成方案分类与气隙—漏感分配思路，取自本地 8 篇学位论文（已建为可检索的 RAG 知识库）：
        </p>
        <ol className="mt-2 space-y-1 text-[12px] text-slate-400 list-decimal list-inside">
          <li>《高频 LLC 变换器的平面磁集成变压器设计》王鑫，北京交通大学，2020 —— 本工具主依据</li>
          <li>《两相交错并联 LLC 谐振变换器的磁集成理论与方法研究》武艳秋</li>
          <li>《磁集成 LLC 谐振变换器的分析和设计》班鹏程</li>
          <li>《基于磁集成的小型化 LLC 变换器》金怿伟</li>
          <li>《磁集成 LLC 直流变压器的分析与设计》段晨旭</li>
          <li>《基于磁集成的分数匝 LLC 变换器研究》孙战</li>
          <li>《复合式 LLC 谐振变换器中磁集成谐振电感的研究》张立飞</li>
          <li>《两级式宽输出磁集成谐振变换器的研究》辛撼帷</li>
        </ol>
      </section>
    </div>
  )
}

function Section({ title, rows }: { title: string; rows: FormulaRow[] }) {
  return (
    <section className="mt-7">
      <h2 className="text-[13px] font-semibold text-slate-200 mb-3">{title}</h2>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.name} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12px] font-medium text-slate-200">{r.name}</span>
              <KindTag kind={r.kind} />
            </div>
            <MB tex={r.tex} />
            <div className="mt-1 text-[11px] text-slate-500">
              <span className="text-slate-400">出处：</span>
              {r.source}
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              <span className="text-slate-400">说明：</span>
              {r.note}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function KindTag({ kind }: { kind: FormulaRow['kind'] }) {
  const cls =
    kind === '文献'
      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      : kind === '公开公式'
        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  return <span className={`rounded border px-1.5 py-0.5 text-[10px] ${cls}`}>{kind}</span>
}
