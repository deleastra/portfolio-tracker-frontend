import { useState } from 'react'
import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import {
  LogOut, Sun, Moon, BarChart3, ArrowLeftRight, PieChart,
  Sparkles, BarChart2, Menu, X,
} from 'lucide-react'
import { useLogout } from '@/hooks/useAuth'
import { useTheme } from '@/hooks/useTheme'
import { useMarketTickers } from '@/hooks/usePortfolio'
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: tickers } = useMarketTickers()

  const themeIcon = theme === 'dark'
    ? <Sun className="h-4 w-4" />
    : theme === 'light'
    ? <Moon className="h-4 w-4" />
    : <Sparkles className="h-4 w-4" />
  const themeLabel = theme === 'dark' ? 'Light Mode' : theme === 'light' ? 'Dark Mode' : 'Pastel Mode'

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/30 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-56 shrink-0 border-r border-border transition-transform duration-300 md:relative md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{ backgroundColor: 'var(--sidebar-bg)' }}
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-primary/20 flex items-center justify-center shrink-0">
              <BarChart2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="text-xs font-semibold tracking-widest uppercase text-foreground leading-none">
                Precision Ledger
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5 leading-none">
                {theme === 'pastel' ? 'Happy Trading ✦' : 'Institutional Grade'}
              </div>
            </div>
          </div>
          <button
            className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const active =
              to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
                  active
                    ? 'bg-primary/15 text-primary font-medium border-l-2 border-primary -ml-px pl-2.75'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground border-l-2 border-transparent -ml-px pl-2.75'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Theme toggle + Logout */}
        <div className="px-3 py-4 border-t border-border space-y-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {themeIcon}
            {themeLabel}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden md:ml-0">
        {/* Top ticker bar / header */}
        <header className="shrink-0 flex items-center px-4 md:px-6 py-3 border-b border-border bg-card gap-4">
          {/* Mobile hamburger */}
          <button
            className="md:hidden text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          {/* Ticker */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            {(tickers ?? []).map(({ symbol, label, price, day_change_pct }) => (
              <span key={symbol} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-border/60 bg-background/50">
                <span>{label}</span>
                <span className="text-foreground font-medium">{price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className={day_change_pct >= 0 ? 'text-success font-medium' : 'text-destructive font-medium'}>
                  {day_change_pct >= 0 ? '+' : ''}{day_change_pct.toFixed(2)}%
                </span>
              </span>
            ))}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

