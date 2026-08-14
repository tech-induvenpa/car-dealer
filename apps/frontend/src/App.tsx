import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ComparisonProvider } from './context/ComparisonContext'
import { PublicLayout } from './components/layout/PublicLayout'
import { AdminLayout } from './components/admin/AdminLayout'
import { RequireAuth } from './components/admin/RequireAuth'
import { Catalog } from './pages/public/Catalog'
import { Quiz } from './pages/public/Quiz'
import { VehicleDetail } from './pages/public/VehicleDetail'
import { Comparison } from './pages/public/Comparison'
import { AdminLogin } from './pages/admin/Login'
import { AdminDashboard } from './pages/admin/Dashboard'
import { AdminVehicleTable } from './pages/admin/VehicleTable'
import { VehicleFormPage } from './pages/admin/VehicleForm'
import { AdminLeads } from './pages/admin/Leads'

function App() {
  return (
    <AuthProvider>
      <ComparisonProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Catalog />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/vehiculos/:id" element={<VehicleDetail />} />
              <Route path="/comparar" element={<Comparison />} />
            </Route>

            <Route path="/admin/login" element={<AdminLogin />} />
            <Route element={<RequireAuth />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/vehiculos" element={<AdminVehicleTable />} />
                <Route path="/admin/vehiculos/nuevo" element={<VehicleFormPage />} />
                <Route path="/admin/vehiculos/:id/editar" element={<VehicleFormPage />} />
                <Route path="/admin/leads" element={<AdminLeads />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ComparisonProvider>
    </AuthProvider>
  )
}

export default App
