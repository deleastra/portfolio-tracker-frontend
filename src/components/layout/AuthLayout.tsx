import { Outlet } from '@tanstack/react-router'

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f13]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-xl font-medium text-[#e8e6f0] tracking-tight">
            Precision Ledger
          </div>
          <div className="text-sm text-[#5e5c6e] mt-1">Institutional Grade Tracking</div>
        </div>
        <div className="bg-[#17171f] border border-[#2e2e3a] rounded-xl p-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
