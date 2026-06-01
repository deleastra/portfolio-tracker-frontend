import { Outlet } from '@tanstack/react-router'

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-xl font-medium text-foreground tracking-tight">
            Precision Ledger
          </div>
          <div className="text-sm text-muted-foreground mt-1">Institutional Grade Tracking</div>
        </div>
        <div className="card bg-card border border-border rounded-xl shadow-sm">
          <div className="card-body p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
