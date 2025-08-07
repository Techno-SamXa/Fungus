import { useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar"
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
  HelpCircle,
  LogOut
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import fungusLogo from "@/assets/fungus-logo.png"

const navigation = [
  { 
    title: "Productos", 
    url: "/productos", 
    icon: Package,
    active: true
  },
  { 
    title: "Insumos", 
    url: "/insumos", 
    icon: Factory,
    active: true
  },
  { 
    title: "Compradores", 
    url: "/compradores", 
    icon: Users,
    active: true
  },
  { 
    title: "Proveedores", 
    url: "/proveedores", 
    icon: Truck,
    active: true
  },
  { 
    title: "Cotizaciones", 
    url: "/cotizaciones", 
    icon: FileText,
    active: true
  },
  { 
    title: "Ventas", 
    url: "/ventas", 
    icon: ShoppingCart,
    active: true
  },
  { 
    title: "Compras", 
    url: "/compras", 
    icon: ShoppingBag,
    active: true
  },
  { 
    title: "Calendarización", 
    url: "/calendario", 
    icon: Calendar,
    active: false,
    comingSoon: true
  },
  { 
    title: "Reportes", 
    url: "/reportes", 
    icon: BarChart3,
    active: false,
    comingSoon: true
  },
]

const bottomNavigation = [
  { 
    title: "Ayuda", 
    url: "/ayuda", 
    icon: HelpCircle,
    active: true
  },
  { 
    title: "Cerrar sesión", 
    url: "/logout", 
    icon: LogOut,
    active: true,
    isLogout: true
  },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const isCollapsed = state === "collapsed"

  const isActive = (path: string) => currentPath === path || (path === "/" && currentPath === "/")

  const getNavClassName = (item: any) => {
    if (!item.active) {
      return "text-muted-foreground cursor-not-allowed opacity-60"
    }
    if (isActive(item.url)) {
      return "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
    }
    if (item.isLogout) {
      return "text-destructive hover:bg-destructive/10 hover:text-destructive"
    }
    return "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
  }

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <img 
              src={fungusLogo} 
              alt="Fungus Mycelium" 
              className="h-6 w-6 brightness-0 invert"
            />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <h1 className="text-lg font-semibold text-sidebar-foreground">
                Fungus Mycelium
              </h1>
              <p className="text-xs text-sidebar-foreground/60">
                Dashboard de Gestión
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/60 mb-2">
            {!isCollapsed ? "Gestión Principal" : ""}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    className={`${getNavClassName(item)} transition-colors relative`}
                    disabled={!item.active}
                  >
                    {item.active ? (
                      <NavLink to={item.url} className="flex items-center gap-3 w-full">
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!isCollapsed && (
                          <div className="flex items-center justify-between w-full">
                            <span className="truncate">{item.title}</span>
                            {item.comingSoon && (
                              <Badge variant="outline" className="text-xs bg-warning/10 text-warning-foreground border-warning/20">
                                Próximamente
                              </Badge>
                            )}
                          </div>
                        )}
                      </NavLink>
                    ) : (
                      <div className="flex items-center gap-3 w-full">
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!isCollapsed && (
                          <div className="flex items-center justify-between w-full">
                            <span className="truncate">{item.title}</span>
                            <Badge variant="outline" className="text-xs bg-warning/10 text-warning-foreground border-warning/20">
                              Próximamente
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto pt-4">
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {bottomNavigation.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      className={`${getNavClassName(item)} transition-colors`}
                    >
                      <NavLink to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        {!isCollapsed && <span className="truncate">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}