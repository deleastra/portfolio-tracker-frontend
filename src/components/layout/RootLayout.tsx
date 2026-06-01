import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { LogOut, Sun, Moon, BarChart3, ArrowLeftRight, PieChart, Sparkles } from 'lucide-react'
import { useLogout } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { Button } from '@/components/ui/button'

const NAV_ITEMS = [
  { to: '/', label: 'Portfolio', icon: PieChart },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
] as const

export function RootLayout() {
  const logout = useLogout()
  const { location } = useRouterState()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col bg-card border-r border-border">
        {/* Brand */}
        <div className="px-6 py-5 border-b border-border">
          <div className="text-sm text-muted-foreground font-medium tracking-widest uppercase">
            Precision Ledger
          </div>
          <div className="text-xs text-muted-foreground/60 mt-0.5">Institutional Grade</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const active =
              to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Theme toggle + Logout */}
        <div className="px-3 py-4 border-t border-border space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : theme === 'pastel' ? <Moon className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            {theme === 'dark' ? 'Light Mode' : theme === 'pastel' ? 'Dark Mode' : 'Pastel Mode'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top ticker bar */}
        <header className="flex-shrink-0 flex items-center px-6 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <span>S&P 500 <span className="text-success">+1.2%</span></span>
            <span>NASDAQ <span className="text-success">+0.8%</span></span>
            <span>^NDX <span className="text-destructive">-0.2%</span></span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
