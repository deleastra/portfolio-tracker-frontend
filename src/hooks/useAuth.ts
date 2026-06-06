import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/lib/apiClient'
import { setTokens, clearTokens, getAccessToken, initAuth } from '@/lib/api'
import type { LoginRequest, RegisterRequest } from '@/types'
import { useNavigate } from '@tanstack/react-router'

export function useIsAuthenticated() {
  return !!getAccessToken()
}

/**
 * Call once at app root. Silently attempts to rehydrate the access token
 * from the httpOnly refresh-token cookie so the user stays logged in after
 * a page reload. Returns isInitializing=true until the attempt completes.
 */
export function useInitAuth() {
  const [isInitializing, setIsInitializing] = useState(true)
  useEffect(() => {
    initAuth().finally(() => setIsInitializing(false))
  }, [])
  return { isInitializing }
}

export function useLogin() {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (body: LoginRequest) => authApi.login(body),
    onSuccess: (data) => {
      setTokens(data.access_token)
      navigate({ to: '/' })
    },
  })
}

export function useRegister() {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (body: RegisterRequest) => authApi.register(body),
    onSuccess: (data) => {
      setTokens(data.access_token)
      navigate({ to: '/' })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return () => {
    authApi.logout().finally(() => {
      clearTokens()
      queryClient.clear()
      navigate({ to: '/login' })
    })
  }
}
