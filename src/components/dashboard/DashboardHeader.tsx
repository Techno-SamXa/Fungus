import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Settings, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function DashboardHeader() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="h-8 w-8" />
        <div className="h-6 w-px bg-border" />
        <div className="flex flex-col">
          <h2 className="text-lg font-semibold">Dashboard Principal</h2>
          <p className="text-xs text-muted-foreground">
            Panel de control - Fungus Mycelium
          </p>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          Sistema Activo
        </Badge>
        
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Bell className="h-4 w-4" />
        </Button>
        
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
        
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}