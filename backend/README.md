# Inka Backend API

Custom REST backend for the Inka farm management app. It uses Node.js, Express, TypeScript, Prisma 7, and PostgreSQL.

## Setup

1. Install dependencies:

```sh
npm install
```

2. Create an environment file:

```sh
cp .env.example .env
```

3. Make sure PostgreSQL is installed and running, then create a database and user that match your `.env` file. For the default `.env.example` values, you can create them with:

```sh
sudo -u postgres psql
CREATE USER inka WITH PASSWORD 'inka_password';
CREATE DATABASE inka OWNER inka;
\q
```

If you already have PostgreSQL credentials, update `DATABASE_URL` in `.env` instead.

4. Validate and create the database schema:

```sh
npm run prisma:validate
npm run prisma:migrate
npm run seed
```

5. Start development server:

```sh
npm run dev
```

The API runs on `http://localhost:4000` by default.

**OpenAPI / Swagger UI:** interactive docs at [http://localhost:4000/api/v1/docs](http://localhost:4000/api/v1/docs) (machine-readable JSON at `/api/v1/openapi.json`). Spec source: `src/openapi/document.ts`. Try `POST /auth/login` then **Authorize** with the JWT and call `GET /cattle`.

## Scripts

- `npm run dev`: run the backend in watch mode.
- `npm run build`: compile TypeScript into `dist/`.
- `npm run start`: run the compiled server.
- `npm run typecheck`: validate TypeScript without emitting files.
- `npm run prisma:validate`: validate Prisma schema.
- `npm run prisma:generate`: generate Prisma client.
- `npm run prisma:migrate`: run Prisma migrations in development.
- `npm run seed`: seed default farm categories.

## API Routes

All business routes are under `/api/v1`.

**Authentication:** all routes except `/auth/*` and `/health` require `Authorization: Bearer <jwt>`.

**Roles:** `SUPER_ADMIN`, `FARM_OWNER`, `FARM_MANAGER`, `VETERINARIAN`, `WORKER`. Data is scoped to the user's `farmId` (Super Admin can access any farm).

**Capability matrix (API + app UI):**

| Capability | Owner / Super Admin | Manager | Vet | Worker |
|------------|---------------------|---------|-----|--------|
| Cattle write / delete | ✓ | ✓ | — | — |
| Milk write | ✓ | ✓ | — | ✓ |
| Milk delete | ✓ | ✓ | — | — |
| Events write / delete | ✓ | ✓ | ✓ | — |
| Finance view | ✓ | ✓ | — | — |
| Finance write / delete | ✓ | — | — | — |
| Farm setup / users / system config | ✓ | — | — | — |

- `POST /auth/register`: creates a new farm + `FARM_OWNER` user (seeds default categories).
  Required: `fullName`, `email`, `phone`, `password`, `farmName`, `district`, `sector`.
- `POST /auth/login`: returns JWT + user (`role`, `farmId`).
- `POST /auth/forgot-password`: body `{ email }` — always 200; emails/logs a one-time reset code if the account exists. In non-production (or `EXPOSE_DEV_RESET_TOKEN=true`) the JSON may include `devResetToken` for local testing. Configure `RESEND_API_KEY` + `MAIL_FROM` for real email; otherwise the code is printed in the API console.
- `POST /auth/reset-password`: body `{ token, newPassword }` (min 6 chars).
- `POST /auth/change-password`: authenticated; body `{ currentPassword, newPassword }` (min 6 chars).
- `/api/v1/audit-logs`: Owner/Super Admin activity trail (`GET`, query `entityType`, `from`, `to`, `page`, `limit`). Written automatically on cattle/milk/events/transactions mutations and login/password events.
- `/api/v1/attachments`: multipart image upload (`POST`, field `file` + `ownerType`) and list (`GET` with optional `cattleId` / `transactionId` / `healthEventId`). Files are stored under `UPLOAD_DIR` and served at `/uploads/...`. Set `PUBLIC_BASE_URL` to a reachable host (LAN IP on devices).
- `/api/v1/users`:
  - `GET /users/me`: current user profile.
  - `GET /users`: list users (Owner: own farm; Super Admin: all, optional `?farmId=`).
  - `POST /users`: create staff (Owner: Manager/Vet/Worker on own farm; Super Admin: any role).
  - `PATCH /users/:id`: update role, `isActive`, password, name/phone.
- `GET /health` and `GET /api/v1/health`: service status.
- `/api/v1/farms`: farm profile records.
  - `GET /farms/mine`: farms the caller can access (memberships; Super Admin sees all). Includes `isActive` for the current session farm.
  - `GET /farms/system-config`: system configuration for the caller's farm.
  - `PATCH /farms/system-config`: Owner/Super Admin only — partial update of system settings.
- `POST /api/v1/auth/switch-farm` `{ farmId }`: switch active farm (updates `User.farmId` / membership role, returns new JWT + `user.farmName`).
- `/api/v1/categories`: configurable breeds, groups, medicines, event types, income categories, expense categories, and milk destinations. Mutations: Owner/Super Admin only.
- `/api/v1/cattle`: professional cattle identity, lifecycle, production, and lineage records. Listing cattle auto-promotes lifecycle stages by age (never demotes). Create/update stamp `createdByUserId` / `updatedByUserId`; list/get include `createdBy`. `DELETE` soft-archives (`deletedAt`); prefer status change (sold/culled/dead) for herd exits via `POST /cattle/:id/exit` (optional Cattle Sale / Cattle Disposal transaction).
- `/api/v1/milk-records`: milk production, usage, rejected milk, destinations, buyer, price, and quality records (`fatPercent`, `proteinPercent`, `somaticCellCount`). Actor tracking and soft-delete same as cattle. App supports create, edit (`PATCH`), and soft-delete from Milk Records UI. Individual milk requires an **Active** cattle link.
  - Whole Farm saves may create/update a linked **Milk Sale** income when `createMilkSale=true`, using `soldLiters = produced − used − rejected` × `pricePerLiter` (locked at save). Duplicate Milk Sale per milk record is prevented. Deleting a milk record soft-archives its linked Milk Sale.
- `/api/v1/events`: individual and mass veterinary, breeding, pregnancy, birth, weighing, vaccination, treatment, and deworming events. Actor tracking and soft-delete same as cattle. Deleting an event also soft-archives linked treatment expenses.
  - `GET /events/latest-breeding?cattleTag=TAG`: latest breeding event for an animal (used by pregnancy form prefill).
  - `GET /events/birth-prefill?cattleTag=TAG`: latest pregnancy event for an animal, falling back to latest breeding event (used by birth form prefill).
  - Query filters on `GET /events`: `eventType`, `cattleTag`, `cattleId`, `scope`, `farmId`, `followUpDue=true`.
  - `GET /events/milk-withdrawal?cattleTag=TAG&onDate=YYYY-MM-DD`: active medicine/vaccine milk withdrawal for an animal on a date (used by Individual Cow milk form to auto-reject withheld milk).
  - Categories of kind `medicine` store `defaultWithdrawalDays` (set in Farm Setup). Selecting a medicine on treatment/vaccine forms prefills withdrawal days.
  - Saving events can auto-update linked cattle weight, body condition score, reproductive status, parity, and lactation number.
  - Treatment events with `treatmentCost` create a linked veterinary expense transaction.
  - `Giving Birth` events require a bull name in `bullResponsible`, plus calf name (`calfTag`) and calf gender. Saving a new Giving Birth event also auto-creates a calf cattle record with mother and bull lineage filled in.
  - Breeding, Pregnant, and Pregnancy Diagnosis events reject bulls that match the female's father or maternal grandfather (mother's father).
  - Reproductive cycle: Kwimisha (Breeding) sets `followUpDate` to the return-heat date. After the return-heat window, the Events UI offers **Heat returned** or **Confirm Gusama**. Open Gusama cards offer **Kuramburura (Abort)** (notes required) or **Kubyara (Birth)** (opens birth form). Linked events store `sourceEventId`. Creating a second open Pregnant for the same animal is blocked until Abort or Birth closes the cycle.
- `/api/v1/transactions`: income and expense records with category, amount, quantity, unit price, buyer/vendor, payment, receipt, tax, discount, and resource links. Actor tracking and soft-delete same as cattle. Delete: Owner/Super Admin only.
- `/api/v1/inventory`: feed and store items with `quantityOnHand` / `reorderLevel`.
  - `POST /inventory`: create item (Owner/Manager).
  - `PATCH /inventory/:id`: update name/unit/reorder level.
  - `POST /inventory/:id/receive`: add stock; optional `createExpense` writes a Feed expense transaction.
  - `POST /inventory/:id/use`: deduct stock (cannot exceed on-hand).
  - `GET /inventory/:id/movements`: recent IN/OUT history.
- `/api/v1/reports/dashboard`: dashboard metrics.
- `/api/v1/reports/summaries`: report summary cards.
- `/api/v1/reports/period?from=YYYY-MM-DD&to=YYYY-MM-DD`: milk, herd, events, and (when allowed) finance totals for a date range.
- `/api/v1/reports/export.csv?from=...&to=...&dataset=milk|transactions|events|cattle`: CSV download for the range with a farm information header (`transactions` requires finance view; optional `kind=INCOME|EXPENSE` filters transaction exports).
- `/api/v1/reports/details?...`: same dataset as JSON rows for the Reports screen table.
- `/api/v1/reports/export.pdf?...`: same datasets rendered as PDF via jsreport (farm header + data table).

Seeded demo accounts (from `npm run seed`):

- Super Admin: `admin@inka.local` / `admin123`
- Farm Owner: `owner@inka.local` / `owner123` (linked to `default-farm` and `second-farm` / Inka East Farm — use Settings or Dashboard to switch)
- Farm Manager: `manager@inka.local` / `manager123`
- Veterinarian: `vet@inka.local` / `vet123`
- Worker: `worker@inka.local` / `worker123`

Most resource routes support:

- `GET /`: list records.
- `GET /:id`: read one record.
- `POST /`: create a record.
- `PATCH /:id`: update a record.
- `DELETE /:id`: soft-archive (`deletedAt`) for cattle, milk-records, events, and transactions; hard delete only where soft-delete is off.
- `GET /?archived=true`: list soft-archived rows (requires the same permission as delete/restore for that resource).
- `POST /:id/restore`: clear `deletedAt` / `deletedByUserId` and write a `RESTORE` audit entry. Restoring a milk record also restores its linked Milk Sale; restoring an event restores linked treatment expenses.

## Project layout

- `src/routes/` — one file per resource (thin wiring)
- `src/lib/createCrudRouter.ts` — shared factory for standard list/get/create/update/delete
- `src/controllers/` — HTTP handlers for non-CRUD endpoints (farm system-config, event prefills)
- `src/services/` — domain logic (milk-sale sync, birth/pregnancy rules, farm defaults)
- `src/schemas/` — Zod request validation
- `src/utils/` — shared helpers (inbreeding, lifecycle, report export); `*.test.ts` run via `npm test` (Vitest)

## CI

- GitHub Actions workflow at `.github/workflows/ci.yml` runs backend `prisma validate` + typecheck + tests and frontend `tsc --noEmit` on push/PR to `main`.

## Notes

- The Expo app calls this API through `frontend/data/farmDatabase.ts` and `frontend/data/apiClient.ts`.
- When adding or changing frontend API usage, update backend routes/schemas in the same change.
- The Prisma config includes a local fallback database URL only so schema validation works before `.env` is created.
- Use uppercase enum values in API payloads, such as `MALE`, `FEMALE`, `COW`, `ACTIVE`, `INDIVIDUAL`, `MASS`, `INCOME`, and `EXPENSE`.
- Run `npm test` in `backend/` for unit tests (no live database required).