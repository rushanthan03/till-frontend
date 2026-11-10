# Supermarket Till – Frontend

React 19 + Vite + TypeScript + Tailwind web app for the till: checkout screen, products, sales history, till sessions and platform/store management.

## Requirements
- Node.js 18+
- The backend running (see `../till-backend/README.md`)

## Run it

1. **Point it at the backend**
   ```bash
   cp .env.example .env.local
   ```
   `VITE_API_BASE_URL` must be the backend address, e.g. `http://localhost:4000` (no trailing slash).

2. **Install and start**
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:5173. Restart `npm run dev` after changing any env file.

## Login
Use the users created by the backend (see its README). With the demo data loaded (`npm run seed:demo` in the backend; password `Till@12345`):

| Role | Email | Sees |
|---|---|---|
| Cashier | cashier1.hs@freshmarket.test | Till |
| Manager | manager.hs@freshmarket.test | Till, Sales history, Till sessions, Products |
| Tenant admin | admin@freshmarket.test | Everything for the tenant + Staff + Settings |
| Super admin | the `SUPER_ADMIN_EMAIL` from the backend `.env` | Platform overview, Tenants (create tenants and stores) |

## Using the till
1. Log in as a cashier and open the till with an opening float.
2. Scan or type a barcode (demo barcodes start with `5000000…`) or use the department buttons.
3. Take payment (cash, split, or simulated card), then close the till with a blind cash count at end of shift.
4. Refunds are manager-only.
5. Discounts and price overrides: select a basket line, press **Discount**. Cashiers need a manager to type their PIN (demo managers: `2580`); managers and admins apply it themselves. Every discount is stored with its reason and approver.
6. **Cash** button: paid in, paid out (cashiers need a manager PIN), safe drop and no sale, each with a reason. They count towards the expected cash at close and appear on the X and Z reports.
7. Managers: **Day end report** shows all sessions of a day with combined sales, tenders, cash movements and cash difference.
8. Managers: **Stock** has an overview (low/out/negative, value), **Receive stock** (deliveries, updates cost), **Adjust / waste** (waste, damaged, expired, corrections), **Stocktake** (count a department, differences are corrected) and **History** (every change, including sales and refunds).

## Scripts
| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |

## Environment variables
| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Backend API address |
| `VITE_SENTRY_DSN` | Optional error tracking (leave empty to disable) |

For production, set `VITE_API_BASE_URL` to the deployed backend before `npm run build`.

## Structure
- `src/pages` – Till, Products, SalesHistory, ShiftHistory, Users, Settings, Tenants, TenantDetail, SuperAdminDashboard
- `src/components/till` – payment, refund, close-till and report dialogs
- `src/features` – API clients and state per area (products, sales, shifts, refunds, stores, tenants, users)
- `src/routers` – routes and role-based access
