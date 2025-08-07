import { ThemeProvider as NextThemesProvider } from "next-themes"
import { ReactNode } from "react"

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

export function ThemeProvider({ 
  children, 
  defaultTheme = "light",
  enableSystem = true,
  disableTransitionOnChange = false,
  ...props 
}: ThemeProviderProps) {
  return (
    <NextThemesProvider 
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem={enableSystem}
      disableTransitionOnChange={disableTransitionOnChange}
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}