import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useRegister } from '@/hooks/useAuth'

export function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const register = useRegister()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    register.mutate({ email, password })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-[#e8e6f0] mb-1">Create Account</h1>
        <p className="text-sm text-[#5e5c6e]">Start tracking your portfolio</p>
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
            minLength={8}
            placeholder="Min 8 characters"
            className="w-full bg-[#22222e] border border-[#2e2e3a] rounded-lg px-3 py-2.5 text-sm text-[#e8e6f0] placeholder-[#5e5c6e] focus:outline-none focus:border-[#7c6dfa] transition-colors"
          />
        </div>
      </div>

      {register.isError && (
        <p className="text-sm text-[#f87171]">Registration failed. Please try again.</p>
      )}

      <button
        type="submit"
        disabled={register.isPending}
        className="w-full bg-[#7c6dfa] hover:bg-[#9488fb] disabled:opacity-50 text-white font-medium text-sm py-2.5 rounded-lg transition-colors"
      >
        {register.isPending ? 'Creating account…' : 'Create Account'}
      </button>

      <p className="text-center text-sm text-[#5e5c6e]">
        Already have an account?{' '}
        <Link to="/login" className="text-[#7c6dfa] hover:text-[#9488fb]">
          Sign in
        </Link>
      </p>
    </form>
  )
}
