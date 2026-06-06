import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'
import { useInitAuth } from './hooks/useAuth'
import './index.css'

// Apply theme before first render to prevent FOUC
// Dark is now the default (no extra class). Light adds '.light', pastel adds '.pastel'.
const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark' | 'pastel') ?? 'dark'
document.documentElement.classList.remove('light', 'pastel')
if (savedTheme === 'light') document.documentElement.classList.add('light')
else if (savedTheme === 'pastel') document.documentElement.classList.add('pastel')
document.documentElement.setAttribute('data-theme', savedTheme)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  const { isInitializing } = useInitAuth()
  if (isInitializing) return null
  return <RouterProvider router={router} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
