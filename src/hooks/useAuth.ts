import { useMutation, useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/lib/apiClient'
import { setTokens, clearTokens, getAccessToken } from '@/lib/api'
import type { LoginRequest, RegisterRequest } from '@/types'
import { useNavigate } from '@tanstack/react-router'

export function useIsAuthenticated() {
  return !!getAccessToken()
}

export function useLogin() {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (body: LoginRequest) => authApi.login(body),
    onSuccess: (data) => {
      setTokens(data.access_token, data.refresh_token)
      navigate({ to: '/' })
    },
  })
}

export function useRegister() {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (body: RegisterRequest) => authApi.register(body),
    onSuccess: (data) => {
      setTokens(data.access_token, data.refresh_token)
      navigate({ to: '/' })
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return () => {
    clearTokens()
    queryClient.clear()
    navigate({ to: '/login' })
  }
}
