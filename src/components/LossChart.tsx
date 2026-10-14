import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { LossItem } from '../lib/types'

/** 损耗分项饼图 */
export function LossChart({ items, height = 260 }: { items: LossItem[]; height?: number }) {
  const data = items.filter((x) => x.value > 0 && Number.isFinite(x.value))
  if (data.length === 0) {
    return <div className="grid place-items-center h-[260px] text-neutral-500 text-sm">无有效损耗分项</div>
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={52}
          outerRadius={86}
          paddingAngle={2}
          stroke="#0a0a0a"
        >
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: '#171717', border: '1px solid #404040', borderRadius: 8, fontSize: 12 }}
          formatter={(v: number, n: string) => [`${v.toFixed(2)} W`, n]}
        />
        <Legend
          verticalAlign="bottom"
          height={54}
          wrapperStyle={{ fontSize: 11, color: '#a3a3a3' }}
          formatter={(v: string, entry) => {
            const val = (entry?.payload as LossItem | undefined)?.value ?? 0
            const total = data.reduce((s, x) => s + x.value, 0)
            return `${v}  ${val.toFixed(2)}W (${total > 0 ? ((val / total) * 100).toFixed(0) : 0}%)`
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
