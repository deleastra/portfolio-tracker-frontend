import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useLogin } from '@/hooks/useAuth'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const login = useLogin()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    login.mutate({ email, password })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-[#e8e6f0] mb-1">Sign In</h1>
        <p className="text-sm text-[#5e5c6e]">Access your portfolio dashboard</p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-[#9997aa] mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full bg-[#22222e] border border-[#2e2e3a] rounded-lg px-3 py-2.5 text-sm text-[#e8e6f0] placeholder-[#5e5c6e] focus:outline-none focus:border-[#7c6dfa] transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-[#9997aa] mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full bg-[#22222e] border border-[#2e2e3a] rounded-lg px-3 py-2.5 text-sm text-[#e8e6f0] placeholder-[#5e5c6e] focus:outline-none focus:border-[#7c6dfa] transition-colors"
          />
        </div>
      </div>

      {login.isError && (
        <p className="text-sm text-[#f87171]">Invalid credentials. Please try again.</p>
      )}

      <button
        type="submit"
        disabled={login.isPending}
        className="w-full bg-[#7c6dfa] hover:bg-[#9488fb] disabled:opacity-50 text-white font-medium text-sm py-2.5 rounded-lg transition-colors"
      >
        {login.isPending ? 'Signing in…' : 'Sign In'}
      </button>

      <p className="text-center text-sm text-[#5e5c6e]">
        No account?{' '}
        <Link to="/register" className="text-[#7c6dfa] hover:text-[#9488fb]">
          Create one
        </Link>
      </p>
    </form>
  )
}
