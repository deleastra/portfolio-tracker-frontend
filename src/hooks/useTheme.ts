import { useState, useEffect, useCallback } from "react"

export type Theme = "light" | "dark" | "pastel"

const THEME_CYCLE: Theme[] = ["light", "dark", "pastel"]

function applyTheme(theme: Theme) {
  const root = document.documentElement
  // Dark is the CSS default (:root), so it needs no extra class.
  // Light and pastel need their own class applied.
  root.classList.remove("light", "pastel")
  if (theme === "light") root.classList.add("light")
  else if (theme === "pastel") root.classList.add("pastel")
  root.setAttribute("data-theme", theme)
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("theme") as Theme | null
    return stored ?? "dark"
  })

  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem("theme", theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const idx = THEME_CYCLE.indexOf(prev)
      return THEME_CYCLE[(idx + 1) % THEME_CYCLE.length]
    })
  }, [])

  return { theme, toggleTheme }
}
