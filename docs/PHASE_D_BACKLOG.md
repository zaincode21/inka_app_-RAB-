# Phase D Backlog — Scale & engineering maturity

Goal: prepare Inka for multi-site operators, deeper ops (feed), localization, and a maintainable release bar (tests/CI/API docs).

**Suggested build order:** D1 → D2 → D3 → D4 → D5  
(D1 de-risks everything else; D2 is the main product scale unlock; D3–D5 are large domain/UX tracks.)

Phases A–C are complete (trust, data-model UI, reports/reminders/offline).

---

## D1 — Tests + CI baseline (S–M · ~2–3 days) ✅ DONE

**Problem:** Zero automated tests / CI; regressions in auth, soft-delete, and reports are easy to ship.

**Shipped**

- Vitest unit tests: permissions, soft-delete helpers, report date-range / CSV helpers (`backend/src/utils/*.test.ts`)
- Extracted `backend/src/utils/reportExport.ts` for testable report helpers
- `npm test` / `npm run test:watch` on backend
- GitHub Actions `.github/workflows/ci.yml`: backend prisma validate + typecheck + test; frontend `tsc --noEmit`

**Acceptance:** PR/push to `main` runs CI green; `npm test` passes locally without a live DB.

---

## D2 — Multi-farm switcher (L · ~1–2 weeks) ✅ DONE

**Problem:** One user ↔ one `farmId`; owners with several farms (or coops) cannot switch context.

**Shipped**

- Prisma `FarmMembership` (userId, farmId, role) + backfill migration
- `GET /farms/mine`, `POST /auth/switch-farm` (new JWT; persists active `User.farmId`)
- Register / create-user create memberships; seed owner on `default-farm` + `second-farm`
- UI: `FarmSwitcher` on Settings + Dashboard; session includes `farmName`

**Acceptance:** Owner of two farms can switch and see isolated cattle/milk/finance per farm.

---

## D3 — Feed / inventory module (L · ~2–3 weeks) ✅ DONE

**Problem:** Feed is often the #1 cost; not modeled.

**Shipped**

- Prisma `InventoryItem` + `InventoryMovement` (IN/OUT) with optional linked Feed expense
- API: `GET/POST /inventory`, `PATCH /inventory/:id`, `POST /:id/receive`, `POST /:id/use`, `GET /:id/movements`
- UI: Feed & Inventory list, Receive (optional expense), Use; Dashboard low-stock banner + Quick Link
- Seed sample feed items on `default-farm`; write access = Owner/Manager (`canWriteInventory`)

**Acceptance:** Manager can record feed purchase and usage and see remaining quantity.

---

## D4 — i18n EN / Kinyarwanda (L · ~2 weeks)

**Problem:** Mixed EN + local terms; no systematic translation.

**Build**

- `i18next` (or Expo-localization + JSON catalogs)
- Cover auth, Dashboard, milk, events, settings first
- Language toggle in Settings (persist AsyncStorage)

**Acceptance:** Switching language updates primary navigation and milk/event forms without restart.

---

## D5 — OpenAPI / API docs (M · ~3–5 days)

**Problem:** Partner/coop integrations and QA lack a machine-readable contract.

**Build**

- Generate or hand-maintain OpenAPI 3 for `/api/v1` (auth + CRUD + reports)
- Serve `/api/v1/docs` (Swagger UI) in non-prod or always behind auth
- Link from `backend/README.md`

**Acceptance:** New contributor can call login + list cattle from the OpenAPI page alone.

---

## Out of scope for Phase D

- MFA / refresh-token rotation (security hardening track)
- IoT milk meters / AI heat detection
- Cooperative buyer portals / MoMo settlement
- Full PDF report suite (CSV remains primary export)

---

## Done when

- CI blocks broken typecheck/tests on `main`.
- An owner can operate more than one farm from one login.
- Feed stock can be tracked at a basic level.
- EN/Kinyarwanda toggle covers core flows.
- Public OpenAPI documents the v1 API.
