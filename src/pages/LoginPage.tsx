import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
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
        <h1 className="text-xl font-semibold mb-1">Sign In</h1>
        <p className="text-sm text-muted-foreground">Access your portfolio dashboard</p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="text-xs font-medium text-muted-foreground">Email</label>
          <Input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="login-password" className="text-xs font-medium text-muted-foreground">Password</label>
          <Input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Min 8 characters"
            autoComplete="current-password"
          />
        </div>
      </div>

      {login.isError && (
        <p className="text-sm text-destructive">Invalid credentials. Please try again.</p>
      )}

      <Button type="submit" disabled={login.isPending} className="w-full cursor-pointer gap-2">
        {login.isPending ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</>
        ) : 'Sign In'}
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
