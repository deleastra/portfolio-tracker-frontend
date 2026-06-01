# Portfolio Tracker — Frontend

Web app สำหรับ stock portfolio tracker พัฒนาด้วย React + Vite + TanStack

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript 6 |
| Build Tool | [Vite](https://vitejs.dev/) 8 |
| UI Library | React 19 |
| Routing | [TanStack Router](https://tanstack.com/router) |
| Server State | [TanStack Query](https://tanstack.com/query) |
| Table | [TanStack Table](https://tanstack.com/table) |
| Charts | [Recharts](https://recharts.org/) |
| HTTP Client | Axios (พร้อม JWT auto-refresh interceptor) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) + [DaisyUI v5](https://daisyui.com/) |
| UI Components | [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives + CVA) |
| Icons | [Lucide React](https://lucide.dev/) |
| Date Utility | [date-fns](https://date-fns.org/) |
| Testing | Vitest + Testing Library |

## Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── RootLayout.tsx     # Sidebar + dark mode toggle (authenticated pages)
│   │   └── AuthLayout.tsx     # Centered card (login/register pages)
│   └── ui/                    # shadcn/ui base components (button, card, badge, dialog, …)
├── hooks/
│   ├── useAuth.ts             # login, register, logout mutations
│   ├── usePortfolio.ts        # portfolio summary, P&L, performance, metrics
│   ├── useTransactions.ts     # list, create, delete, CSV import
│   └── useTheme.ts            # dark/light theme toggle (persisted to localStorage)
├── lib/
│   ├── api.ts                 # axios instance + JWT interceptor + refresh logic
│   ├── apiClient.ts           # typed API functions (authApi, portfolioApi, ฯลฯ)
│   ├── utils.ts               # cn() classname helper (clsx + tailwind-merge)
│   └── dateUtils.ts           # date formatting helpers (date-fns)
├── pages/
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── PortfolioPage.tsx      # Holdings table + P&L summary cards
│   ├── TransactionsPage.tsx   # Transaction log + CSV import + manual entry
│   └── AnalyticsPage.tsx      # Performance chart + metrics grid + comparison table
├── test/
│   └── setup.ts               # Vitest + jest-dom setup
├── types/
│   └── index.ts               # TypeScript types ทั้งหมด
├── router.tsx                 # TanStack Router definition + auth guard
└── main.tsx                   # App entry point (QueryClient + RouterProvider)
```

## Theme System

แอปรองรับ **Dark / Light mode** โดยใช้ CSS custom properties (OKLCH color space) + DaisyUI

- ธีม default: Light (hue 220° steel blue)
- สลับธีมผ่านปุ่มใน Sidebar (ใช้ `useTheme` hook)
- ค่าถูกเก็บใน `localStorage` และ apply ก่อน first render เพื่อป้องกัน FOUC
- ตัวแปรสี semantic: `--background`, `--foreground`, `--primary`, `--card`, `--border`, `--muted`, `--destructive`, `--success` ฯลฯ
- ค่าบวก (กำไร): `text-success` (green hue 150°)
- ค่าลบ (ขาดทุน): `text-destructive` (red hue 25°)

## Getting Started

### Prerequisites

- Node.js 22+ (LTS)
- pnpm

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
# ตั้งค่า VITE_API_BASE_URL หากต้องการเปลี่ยน backend URL
```

> **หมายเหตุ**: ค่า default คือ dev proxy ไปที่ `http://localhost:8080` — ไม่ต้องตั้งค่าเพิ่มหาก backend run บน port เดียวกัน

### 3. Start dev server

```bash
pnpm dev
```

เปิด [http://localhost:5173](http://localhost:5173)

> Backend ต้อง run ก่อน — ดู [portfolio-go-transtack-backend](../portfolio-go-transtack-backend/README.md)

## Available Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start Vite dev server (HMR) |
| `pnpm build` | TypeScript check + production build |
| `pnpm preview` | Preview production build locally |
| `pnpm test` | Run tests (watch mode) |
| `pnpm test:ui` | Vitest UI browser interface |
| `pnpm coverage` | Run tests + coverage report |
| `pnpm lint` | ESLint check |

## Pages

### Portfolio (`/`)
- แสดง holdings ทั้งหมดใน TanStack Table
- Columns: Symbol, Qty, Avg Cost, Current Price, Day Change %, Market Value, Unrealized P&L, P&L %, Weight
- Summary cards: Total Value, Total Cost, Unrealized P&L

### Transactions (`/transactions`)
- Transaction log พร้อม pagination (20 ต่อหน้า)
- Filter: All / BUY / SELL
- **Import CSV**: อัปโหลด Monthly Statement format
- **Manual entry**: form เพิ่ม transaction แต่ละรายการ
- Summary cards: Total, Buys, Sells (สำหรับ page ปัจจุบัน)

### Analytics (`/analytics`)
- **Performance chart**: line chart เทียบ cumulative return vs benchmark
- Range selector: 1M / 3M / 6M / YTD / 1Y
- Benchmark selector: S&P 500 (SPY), Nasdaq Composite (^IXIC), Nasdaq-100 (^NDX)
- **Metrics grid** (13 metrics):
  - Alpha, Beta, Sharpe Ratio, Sortino Ratio
  - Max Drawdown, Calmar Ratio, Information Ratio, Treynor Ratio
  - Tracking Error, Win Rate, Profit Factor
  - Total Return, Benchmark Return
- **Period comparison table**: Portfolio vs Benchmark vs Alpha แยกตาม period

## Authentication

- JWT-based auth (access token 15 min, refresh token 7 days)
- Token เก็บใน `localStorage`
- Axios interceptor ต่ออายุ token อัตโนมัติ (refresh หาก 401)
- TanStack Router auth guard — redirect ไป `/login` หาก token หมด

## Design

Dark theme: "Precision Ledger" — Institutional Grade Tracking
- Background: `#0f0f13`
- Surface: `#17171f`
- Accent: `#7c6dfa`
- Profit: `#34d399` / Loss: `#f87171`

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
