import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { PublicLayout } from './components/layout/PublicLayout'
import { AdminLayout } from './components/admin/AdminLayout'
import { RequireAuth } from './components/admin/RequireAuth'
import { Catalog } from './pages/public/Catalog'
import { VehicleDetail } from './pages/public/VehicleDetail'
import { Comparison } from './pages/public/Comparison'
import { Assistant } from './pages/public/Assistant'
import { AdminLogin } from './pages/admin/Login'
import { AdminDashboard } from './pages/admin/Dashboard'
import { AdminVehicleTable } from './pages/admin/VehicleTable'
import { VehicleFormPage } from './pages/admin/VehicleForm'
import { AdminLeads } from './pages/admin/Leads'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            {/* CEB-83: la Conversación es la home. El catálogo baja a ruta
                propia — sigue existiendo para quien quiere husmear sin que le
                vendan, y como red de seguridad si el Agente no responde. */}
            <Route path="/" element={<Assistant />} />
            <Route path="/catalogo" element={<Catalog />} />
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
    </AuthProvider>
  )
}

export default App
