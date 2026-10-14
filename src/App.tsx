import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Designer from './pages/Designer'
import Schemes from './pages/Schemes'
import Derivations from './pages/Derivations'
import Curves from './pages/Curves'
import Report from './pages/Report'

export default function App() {
  return (
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
  )
}
