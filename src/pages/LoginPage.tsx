import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useLogin } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
        <h1 className="text-lg font-semibold mb-1">Sign In</h1>
        <p className="text-sm text-muted-foreground">Access your portfolio dashboard</p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Password</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </div>
      </div>

      {login.isError && (
        <p className="text-sm text-destructive">Invalid credentials. Please try again.</p>
      )}

      <Button type="submit" disabled={login.isPending} className="w-full">
        {login.isPending ? 'Signing in…' : 'Sign In'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        No account?{' '}
        <Link to="/register" className="text-primary hover:underline">
          Create one
        </Link>
      </p>
    </form>
  )
}
