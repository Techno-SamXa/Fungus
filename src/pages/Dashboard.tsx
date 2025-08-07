import { DashboardCard } from "@/components/dashboard/DashboardCard"
import { 
  Package,
  Factory,
  Users,
  Truck,
  FileText,
  ShoppingCart,
  ShoppingBag,
  Calendar,
  BarChart3,
  TrendingUp,
  DollarSign,
  AlertTriangle
} from "lucide-react"

const dashboardModules = [
  {
    title: "Productos",
    description: "Gestión completa de hongos medicinales y comestibles en producción",
    icon: <Package className="h-6 w-6" />,
    href: "/productos",
    stats: { label: "productos activos", value: 24 }
  },
  {
    title: "Insumos",
    description: "Control de materiales, sustrato y equipamiento para cultivo",
    icon: <Factory className="h-6 w-6" />,
    href: "/insumos",
    stats: { label: "insumos en stock", value: 156 }
  },
  {
    title: "Compradores",
    description: "Administración de clientes y relaciones comerciales",
    icon: <Users className="h-6 w-6" />,
    href: "/compradores",
    stats: { label: "compradores activos", value: 12 }
  },
  {
    title: "Proveedores",
    description: "Red de proveedores de insumos y servicios especializados",
    icon: <Truck className="h-6 w-6" />,
    href: "/proveedores",
    stats: { label: "proveedores", value: 8 }
  },
  {
    title: "Cotizaciones",
    description: "Generación y seguimiento de presupuestos comerciales",
    icon: <FileText className="h-6 w-6" />,
    href: "/cotizaciones",
    stats: { label: "cotizaciones abiertas", value: 6 }
  },
  {
    title: "Ventas",
    description: "Registro de transacciones y análisis de rendimiento comercial",
    icon: <ShoppingCart className="h-6 w-6" />,
    href: "/ventas",
    stats: { label: "ventas este mes", value: 43 }
  },
  {
    title: "Compras",
    description: "Gestión de adquisiciones y control de gastos operativos",
    icon: <ShoppingBag className="h-6 w-6" />,
    href: "/compras",
    stats: { label: "órdenes pendientes", value: 3 }
  },
  {
    title: "Calendarización",
    description: "Planificación de ciclos de cultivo y programación de tareas",
    icon: <Calendar className="h-6 w-6" />,
    comingSoon: true
  },
  {
    title: "Reportes",
    description: "Análisis detallado de producción, ventas y rentabilidad",
    icon: <BarChart3 className="h-6 w-6" />,
    comingSoon: true
  }
]

export default function Dashboard() {
  return (
    <div className="flex-1 space-y-8 p-8">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Panel de Control
        </h1>
        <p className="text-muted-foreground text-lg">
          Gestión integral de producción de hongos medicinales y comestibles
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="dashboard-card p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Ventas del Mes</p>
              <p className="text-2xl font-bold text-primary">$24,580</p>
            </div>
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-2 flex items-center text-xs text-muted-foreground">
            <TrendingUp className="mr-1 h-3 w-3 text-emerald-500" />
            +12% respecto al mes anterior
          </div>
        </div>

        <div className="dashboard-card p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Producción Activa</p>
              <p className="text-2xl font-bold text-primary">8 lotes</p>
            </div>
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-2 flex items-center text-xs text-muted-foreground">
            3 listos para cosecha esta semana
          </div>
        </div>

        <div className="dashboard-card p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Cotizaciones</p>
              <p className="text-2xl font-bold text-primary">6</p>
            </div>
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-2 flex items-center text-xs text-muted-foreground">
            2 requieren seguimiento urgente
          </div>
        </div>

        <div className="dashboard-card p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Nivel de Stock</p>
              <p className="text-2xl font-bold text-warning">Bajo</p>
            </div>
            <AlertTriangle className="h-5 w-5 text-warning" />
          </div>
          <div className="mt-2 flex items-center text-xs text-muted-foreground">
            Revisar sustrato y materiales
          </div>
        </div>
      </div>

      {/* Main Dashboard Cards */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Módulos de Gestión</h2>
          <p className="text-sm text-muted-foreground">
            Acceda a las diferentes áreas del sistema
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {dashboardModules.map((module) => (
            <DashboardCard
              key={module.title}
              title={module.title}
              description={module.description}
              icon={module.icon}
              href={module.href}
              comingSoon={module.comingSoon}
              stats={module.stats}
              onClick={() => {
                if (!module.comingSoon && module.href) {
                  // Navigation logic would go here
                  console.log(`Navigating to ${module.href}`)
                }
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}