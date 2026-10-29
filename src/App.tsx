import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Designer from './pages/Designer'
import Schemes from './pages/Schemes'
import Derivations from './pages/Derivations'
import Curves from './pages/Curves'
import Report from './pages/Report'

// 路由模式按托管环境选择，同一份构建产物适配两处（与站群 llc / ahb / ipfc 一致）：
//  • 正式站（自有域名 mag-integ.power-knowledge.tech）由 nginx 提供 SPA 回退
//    （try_files $uri $uri/ /index.html），可用 BrowserRouter 得到不带 # 的干净 URL
//    （/designer、/schemes …）。首页即 https://…/ 而不是 …/#/。
//  • GitHub Pages 是子路径托管（/mag-integ/）且没有服务端回退，
//    深链接直接访问/刷新会 404，故那里保持 HashRouter。
const isGitHubPages =
  typeof window !== 'undefined' && /\.github\.io$/i.test(window.location.hostname)

// 兼容历史分享的 #/xxx 链接：先改写成浏览器路由，再交给 Router 解析。
// 若不做这一步，从旧链接进来会停在首页（BrowserRouter 看不到 hash 里的路径）。
if (!isGitHubPages && typeof window !== 'undefined' && window.location.hash.startsWith('#/')) {
  window.history.replaceState(null, '', window.location.hash.slice(1))
}

const Router = isGitHubPages ? HashRouter : BrowserRouter

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/designer" element={<Designer />} />
          <Route path="/schemes" element={<Schemes />} />
          <Route path="/derivations" element={<Derivations />} />
          <Route path="/curves" element={<Curves />} />
          <Route path="/report" element={<Report />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  )
}
