/**
 * 品牌标记 —— 与本站 public/favicon.svg 完全同源。
 *
 * 造型：磁芯中柱 + 原副边绕组 + 气隙。
 * 语义：一个磁芯上同时承载励磁电感与谐振电感 —— 这就是「磁集成」。
 *
 * ⚠️ 与 public/favicon.svg 使用同一套形状数据：改一处必须同步另一处。
 * 主形用站群统一 teal #14b8a6；amber 点落在中柱气隙处，为站群固定标记。
 */
export default function BrandMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#0a0a0a" />
      {/* 磁芯中柱（上下两段，中间留作气隙） */}
      <rect x="14.6" y="6" width="2.8" height="7.4" rx="1.4" fill="#14b8a6" />
      <rect x="14.6" y="18.6" width="2.8" height="7.4" rx="1.4" fill="#14b8a6" />
      {/* 左侧绕组（原边） */}
      <rect x="6" y="14.6" width="6" height="2.8" rx="1.4" fill="#14b8a6" />
      {/* 右侧绕组（副边） */}
      <rect x="20" y="14.6" width="6" height="2.8" rx="1.4" fill="#14b8a6" />
      {/* 气隙 */}
      <circle cx="16" cy="16" r="2.2" fill="#f59e0b" />
    </svg>
  )
}
