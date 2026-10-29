import type { ReactNode } from 'react'
import Header from './Header'
import Footer from './Footer'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-bg">
      <Header />
      {/* pt-16 补 fixed header 的 64px 高度，避免内容被压在导航下面 */}
      <main className="flex-1 pt-16">{children}</main>
      <Footer />
    </div>
  )
}
