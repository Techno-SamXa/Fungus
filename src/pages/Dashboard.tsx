import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  AlertTriangle,
  Store
} from "lucide-react"

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    productos: 0,
    tiendaDigital: 0,
    insumos: 0,
    compradores: 12,
    proveedores: 8,
    cotizaciones: 6,
    ventas: 43,
    compras: 3
  })
  const [loading, setLoading] = useState(true)

  // Función para obtener el stock total de productos desde la API local
  const fetchProductsStock = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('http://localhost:8081/products', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        const data = await response.json()
        // Sumar el stock de todos los productos
        return data.reduce((total, product) => total + (product.stock || 0), 0)
      }
    } catch (error) {
      console.error('Error fetching products stock:', error)
    }
    return 0
  }

  // Función para obtener el conteo de productos de WooCommerce
  const fetchWooCommerceCount = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('http://localhost:8081/woocommerce', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        const data = await response.json()
        return data.length || 0
      }
    } catch (error) {
      console.error('Error fetching WooCommerce products count:', error)
    }
    return 0
  }

  // Función para obtener el stock total de insumos desde la API local
  const fetchInsumosStock = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch('http://localhost:8081/insumos', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        const data = await response.json()
        // Sumar el stock de todos los insumos
        return data.reduce((total, insumo) => total + (insumo.stock || 0), 0)
      }
    } catch (error) {
      console.error('Error fetching insumos stock:', error)
    }
    return 0
  }

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    const loadStats = async () => {
      setLoading(true)
      const [productosStock, wooCommerceCount, insumosStock] = await Promise.all([
        fetchProductsStock(),
        fetchWooCommerceCount(),
        fetchInsumosStock()
      ])
      
      setStats(prev => ({
        ...prev,
        productos: productosStock,
        tiendaDigital: wooCommerceCount,
        insumos: insumosStock
      }))
      setLoading(false)
    }

    loadStats()
    
    // Configurar polling para actualización en tiempo real cada 30 segundos
    const interval = setInterval(() => {
      loadStats()
    }, 30000); // 30 segundos
    
    // Limpiar el interval cuando el componente se desmonte
    return () => clearInterval(interval);
  }, [])

  const dashboardModules = [
    {
      title: "Inventario Interno",
      description: "Gestión y control de productos internos en desarrollo y producción",
      icon: <Package className="h-6 w-6" />,
      href: "/productos",
      stats: { label: "unidades en stock", value: stats.productos }
    },
    {
      title: "Tienda Digital",
      description: "Conexión con WooCommerce para gestión de productos online",
      icon: <Store className="h-6 w-6" />,
      href: "/tienda-digital",
      stats: { label: "productos sincronizados", value: stats.tiendaDigital }
    },
    {
      title: "Insumos",
      description: "Control de materiales, sustrato y equipamiento para cultivo",
      icon: <Factory className="h-6 w-6" />,
      href: "/insumos",
      stats: { label: "insumos en stock", value: stats.insumos }
    },
    {
      title: "Compradores",
      description: "Administración de clientes y relaciones comerciales",
      icon: <Users className="h-6 w-6" />,
      href: "/compradores",
      stats: { label: "compradores activos", value: stats.compradores }
    },
    {
      title: "Proveedores",
      description: "Red de proveedores de insumos y servicios especializados",
      icon: <Truck className="h-6 w-6" />,
      href: "/proveedores",
      stats: { label: "proveedores", value: stats.proveedores }
    },
    {
      title: "Cotizaciones",
      description: "Generación y seguimiento de presupuestos comerciales",
      icon: <FileText className="h-6 w-6" />,
      href: "/cotizaciones",
      stats: { label: "cotizaciones abiertas", value: stats.cotizaciones }
    },
    {
      title: "Ventas",
      description: "Registro de transacciones y análisis de rendimiento comercial",
      icon: <ShoppingCart className="h-6 w-6" />,
      href: "/ventas",
      stats: { label: "ventas este mes", value: stats.ventas }
    },
    {
      title: "Compras",
      description: "Gestión de adquisiciones y control de gastos operativos",
      icon: <ShoppingBag className="h-6 w-6" />,
      href: "/compras",
      stats: { label: "órdenes pendientes", value: stats.compras }
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
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (!module.comingSoon && module.href) {
                  console.log('Navigating to:', module.href)
                  navigate(module.href)
                }
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}