"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return (
    <div className="p-2.5 w-10 h-10 bg-black/5 dark:bg-white/5 rounded-xl border border-black/10 dark:border-white/5 opacity-50" />
  )

  const isDark = (theme === 'system' ? resolvedTheme : theme) === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="p-2.5 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl border border-black/10 dark:border-white/5 transition-colors group relative overflow-hidden"
    >
      <div className="relative h-5 w-5">
        <Sun className={`h-5 w-5 text-amber-500 transition-all duration-300 ${isDark ? 'scale-0 -rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'}`} />
        <Moon className={`absolute top-0 left-0 h-5 w-5 text-blue-400 transition-all duration-300 ${isDark ? 'scale-100 rotate-0 opacity-100' : 'scale-0 rotate-90 opacity-0'}`} />
      </div>
      <span className="sr-only">Cambiar a {isDark ? 'modo claro' : 'modo oscuro'}</span>
    </button>
  )
}

