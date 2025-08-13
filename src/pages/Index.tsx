import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/AppSidebar"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"
import { Routes, Route, Navigate } from "react-router-dom"
import Dashboard from "./Dashboard"
import Productos from "./Productos"
import TiendaDigital from "./TiendaDigital"
import Insumos from "./Insumos"
import Compradores from "./Compradores"
import Ventas from "./Ventas"
import Proveedores from "./Proveedores"
import Compras from "./Compras"
import Cotizaciones from "./Cotizaciones"

const Index = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/productos" element={<Productos />} />
              <Route path="/tienda-digital" element={<TiendaDigital />} />
              <Route path="/insumos" element={<Insumos />} />
              <Route path="/compradores" element={<Compradores />} />
              <Route path="/ventas" element={<Ventas />} />
              <Route path="/proveedores" element={<Proveedores />} />
              <Route path="/compras" element={<Compras />} />
              <Route path="/cotizaciones" element={<Cotizaciones />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
