import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ComparisonProvider } from './context/ComparisonContext'
import { PublicLayout } from './components/layout/PublicLayout'
import { Catalog } from './pages/public/Catalog'
import { Quiz } from './pages/public/Quiz'
import { VehicleDetail } from './pages/public/VehicleDetail'
import { Comparison } from './pages/public/Comparison'

function App() {
  return (
    <ComparisonProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Catalog />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/vehiculos/:id" element={<VehicleDetail />} />
            <Route path="/comparar" element={<Comparison />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ComparisonProvider>
  )
}

export default App
