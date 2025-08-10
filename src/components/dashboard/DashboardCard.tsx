import { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardCardProps {
  title: string
  description: string
  icon: ReactNode
  href?: string
  comingSoon?: boolean
  stats?: {
    label: string
    value: string | number
  }
  className?: string
  onClick?: (e: React.MouseEvent) => void
}

export function DashboardCard({
  title,
  description,
  icon,
  href,
  comingSoon = false,
  stats,
  className,
  onClick,
}: DashboardCardProps) {
  const isDisabled = comingSoon

  const handleClick = (e: React.MouseEvent) => {
    if (!isDisabled && onClick) {
      onClick(e)
    }
  }

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden border transition-all duration-200",
        isDisabled ? "dashboard-card-coming-soon cursor-not-allowed" : "dashboard-card interactive-hover cursor-pointer",
        className
      )}
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-lg transition-colors",
              isDisabled 
                ? "bg-warning/20 text-warning-foreground/60" 
                : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
            )}>
              {icon}
            </div>
            <div className="space-y-1">
              <CardTitle className={cn(
                "text-lg font-semibold",
                isDisabled && "text-muted-foreground"
              )}>
                {title}
              </CardTitle>
              {stats && !isDisabled && (
                <div className="text-sm text-muted-foreground">
                  <span className="text-primary font-medium">{stats.value}</span> {stats.label}
                </div>
              )}
            </div>
          </div>
          
          {comingSoon ? (
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-warning-foreground/60" />
              <Badge variant="outline" className="bg-warning/10 text-warning-foreground border-warning/20">
                Próximamente
              </Badge>
            </div>
          ) : (
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <CardDescription className={cn(
          "text-sm leading-relaxed",
          isDisabled && "text-muted-foreground/60"
        )}>
          {description}
        </CardDescription>
        
        {!isDisabled && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-4 h-8 px-0 text-primary hover:text-primary font-medium"
          >
            Acceder
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        )}
      </CardContent>
      
      {/* Decorative gradient overlay for enabled cards */}
      {!isDisabled && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
      )}
    </Card>
  )
}