import { Routes, Route, Navigate } from 'react-router-dom'
import Shell from './components/Shell'
import Projects from './pages/Projects'
import People from './pages/People'
import Products from './pages/Products'
import Perspective from './pages/Perspective'
import NotFound from './pages/NotFound'

function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Navigate to="/projects" replace />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/people" element={<People />} />
        <Route path="/products" element={<Products />} />
        <Route path="/perspective" element={<Perspective />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Shell>
  )
}

export default App
