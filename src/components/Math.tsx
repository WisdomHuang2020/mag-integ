import katex from 'katex'
import { useMemo } from 'react'

/** 行内公式 */
export function M({ children, tex }: { children?: string; tex?: string }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex ?? children ?? '', { throwOnError: false, displayMode: false })
    } catch {
      return tex ?? children ?? ''
    }
  }, [tex, children])
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}

/** 块级公式 */
export function MB({ children, tex }: { children?: string; tex?: string }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex ?? children ?? '', { throwOnError: false, displayMode: true })
    } catch {
      return tex ?? children ?? ''
    }
  }, [tex, children])
  return (
    <div
      className="my-3 overflow-x-auto rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
