import axios from 'axios'

// Access token lives only in memory — never touches localStorage/sessionStorage.
// This eliminates the XSS-token-theft vector entirely.
// On page reload, initAuth() silently rehydrates it from the httpOnly refresh-token cookie.
let _accessToken: string | null = null

export function getAccessToken() {
  return _accessToken
}
export function setTokens(access: string) {
  _accessToken = access
}
export function clearTokens() {
  _accessToken = null
}

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // send httpOnly cookies on every request
})

api.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`
  }
  return config
})

let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

/**
 * Called once at app startup to silently obtain a fresh access token
 * using the httpOnly refresh-token cookie (if one exists).
 */
export async function initAuth(): Promise<void> {
  try {
    const { data } = await axios.post<{ access_token: string }>(
      '/api/auth/refresh',
      {},
      { withCredentials: true },
    )
    _accessToken = data.access_token
  } catch {
    // No valid session — user needs to log in
    _accessToken = null
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token) => {
            original.headers.Authorization = `Bearer ${token}`
            resolve(api(original))
          })
        })
      }

      isRefreshing = true
      try {
        const { data } = await axios.post<{ access_token: string }>(
          '/api/auth/refresh',
          {},
          { withCredentials: true },
        )
        _accessToken = data.access_token
        refreshQueue.forEach((cb) => cb(data.access_token))
        refreshQueue = []
        original.headers.Authorization = `Bearer ${data.access_token}`
        return api(original)
      } catch {
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  },
)
