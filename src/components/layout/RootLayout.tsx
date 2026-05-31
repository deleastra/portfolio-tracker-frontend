import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { useLogout } from '@/hooks/useAuth'

const NAV_ITEMS = [
  { to: '/', label: 'Portfolio', icon: '◈' },
  { to: '/transactions', label: 'Transactions', icon: '≡' },
  { to: '/analytics', label: 'Analytics', icon: '⟁' },
] as const

export function RootLayout() {
  const logout = useLogout()
  const { location } = useRouterState()

  return (
    <div className="flex h-screen bg-[#0f0f13] text-[#e8e6f0] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col bg-[#17171f] border-r border-[#2e2e3a]">
        {/* Brand */}
        <div className="px-6 py-5 border-b border-[#2e2e3a]">
          <div className="text-sm text-[#9997aa] font-medium tracking-widest uppercase">
            Precision Ledger
          </div>
          <div className="text-xs text-[#5e5c6e] mt-0.5">Institutional Grade</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon }) => {
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
                    ? 'bg-[#7c6dfa]/15 text-[#a99ffc] font-medium'
                    : 'text-[#9997aa] hover:bg-[#1e1e28] hover:text-[#e8e6f0]'
                }`}
              >
                <span className="text-base">{icon}</span>
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-[#2e2e3a]">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-[#9997aa] hover:bg-[#1e1e28] hover:text-[#f87171] transition-colors"
          >
            <span>⎋</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top ticker bar */}
        <header className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b border-[#2e2e3a] bg-[#17171f]">
          <div className="flex items-center gap-6 text-xs text-[#9997aa]">
            <span>S&P 500 <span className="text-[#34d399]">+1.2%</span></span>
            <span>NASDAQ <span className="text-[#34d399]">+0.8%</span></span>
            <span>^NDX <span className="text-[#f87171]">-0.2%</span></span>
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
