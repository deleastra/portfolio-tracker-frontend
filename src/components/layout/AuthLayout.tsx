import { Outlet } from '@tanstack/react-router'
import { BarChart2, ShieldCheck, BarChart3, ArrowLeftRight, TrendingUp } from 'lucide-react'

const FEATURES = [
  { icon: BarChart3, text: 'Real-time portfolio analytics & risk metrics' },
  { icon: ArrowLeftRight, text: 'Full transaction history with CSV import' },
  { icon: TrendingUp, text: 'Benchmark comparison — S&P 500, Nasdaq & more' },
  { icon: ShieldCheck, text: 'Secure, institutional-grade data handling' },
]

export function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Left brand panel — desktop only */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 py-12 bg-card border-r border-border relative overflow-hidden">
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative z-10 max-w-sm">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <BarChart2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-base font-semibold tracking-wide text-foreground">Precision Ledger</div>
              <div className="text-xs text-muted-foreground">Institutional Grade Tracking</div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-foreground leading-tight mb-4">
            Track your portfolio<br />like a professional.
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed mb-8">
            Advanced analytics, real-time pricing, and institutional-grade risk metrics — all in one place.
          </p>

          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        {/* Mobile brand header */}
        <div className="flex items-center gap-2.5 mb-8 lg:hidden">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <BarChart2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-wide text-foreground">Precision Ledger</div>
            <div className="text-[11px] text-muted-foreground">Institutional Grade Tracking</div>
          </div>
        </div>

        <div className="w-full max-w-sm">
          <div className="rounded-xl border border-border bg-card shadow-lg shadow-foreground/8 p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}

