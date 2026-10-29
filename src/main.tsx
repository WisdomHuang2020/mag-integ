import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// 路由容器在 App.tsx 内按托管环境选择（BrowserRouter / HashRouter），
// 故此处不再包 Router —— 与站群保持一致。
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
