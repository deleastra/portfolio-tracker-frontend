import {
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from '@tanstack/react-router'
import { RootLayout } from '@/components/layout/RootLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { PortfolioPage } from '@/pages/PortfolioPage'
import { TransactionsPage } from '@/pages/TransactionsPage'
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { getAccessToken } from '@/lib/api'

const rootRoute = createRootRoute()

// ── Auth guard ────────────────────────────────────────────────────────────────
function requireAuth() {
  if (!getAccessToken()) {
    throw redirect({ to: '/login' })
  }
}
function requireGuest() {
  if (getAccessToken()) {
    throw redirect({ to: '/' })
  }
}

// ── Authenticated layout ──────────────────────────────────────────────────────
const appLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: 'app',
  component: RootLayout,
  beforeLoad: requireAuth,
})

const portfolioRoute = createRoute({
  getParentRoute: () => appLayout,
  path: '/',
  component: PortfolioPage,
})

const transactionsRoute = createRoute({
  getParentRoute: () => appLayout,
  path: '/transactions',
  component: TransactionsPage,
})

const analyticsRoute = createRoute({
  getParentRoute: () => appLayout,
  path: '/analytics',
  component: AnalyticsPage,
})

// ── Guest layout ──────────────────────────────────────────────────────────────
const authLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: 'auth',
  component: AuthLayout,
  beforeLoad: requireGuest,
})

const loginRoute = createRoute({
  getParentRoute: () => authLayout,
  path: '/login',
  component: LoginPage,
})

const registerRoute = createRoute({
  getParentRoute: () => authLayout,
  path: '/register',
  component: RegisterPage,
})

const routeTree = rootRoute.addChildren([
  appLayout.addChildren([portfolioRoute, transactionsRoute, analyticsRoute]),
  authLayout.addChildren([loginRoute, registerRoute]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
