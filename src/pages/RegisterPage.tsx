import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useRegister } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

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
        <h1 className="text-xl font-semibold mb-1">Create Account</h1>
        <p className="text-sm text-muted-foreground">Start tracking your portfolio</p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <label htmlFor="register-email" className="text-xs font-medium text-muted-foreground">Email</label>
          <Input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="register-password" className="text-xs font-medium text-muted-foreground">Password</label>
          <Input
            id="register-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Min 8 characters"
            autoComplete="new-password"
          />
        </div>
      </div>

      {register.isError && (
        <p className="text-sm text-destructive">Registration failed. Please try again.</p>
      )}

      <Button type="submit" disabled={register.isPending} className="w-full cursor-pointer gap-2">
        {register.isPending ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</>
        ) : 'Create Account'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}
