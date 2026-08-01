# Phase A Backlog — Trust & Compliance ✅ COMPLETE

Ordered by effort (smallest first). Goal: bring Inka to a commercial baseline for roles, account security, accountability, and safe deletes.

**Shipped order:** A1 (RBAC) → A4 (change password) → A2 (createdBy) → A3 (soft delete) → A5 (forgot password) → A6 (audit).

Deferred: **A3b** restore / archived-list UI.

---

## A1 — Wire existing roles in the UI (S · ~1–2 days) ✅ DONE

**Problem:** `FARM_MANAGER`, `VETERINARIAN`, `WORKER` can open almost every screen; only Settings items are owner-gated.

**Acceptance**

| Role | Allowed | Blocked |
|------|---------|---------|
| WORKER | Milk create/list, view cattle/events (read) | Finance write, Farm Setup, Users, System Config, delete |
| VETERINARIAN | Events CRUD, cattle read, milk read | Finance write, Farm Setup, Users, System Config |
| FARM_MANAGER | Ops (cattle, milk, events) + view finance | Users, System Config, Farm Setup mutations, delete transactions |
| FARM_OWNER / SUPER_ADMIN | All current capabilities | — |

**Shipped**

- Permission helpers on backend + frontend (`canWriteMilk`, `canWriteEvents`, `canWriteCattle`, `canWriteFinance`, `canViewFinance`, …).
- CRUD `canCreate` / `canUpdate` / `canDelete` enforced on cattle, milk, events, transactions.
- Dashboard / FABs / write screens gated; `useRequireAccess` shows Access denied + go back.
- Seed demo accounts: manager / vet / worker.

---

## A2 — `createdByUserId` on operational records (S–M · ~2 days) ✅ DONE

**Problem:** No “who recorded this” for milk, events, or transactions.

**Shipped**

- Prisma: `createdByUserId` / `updatedByUserId` on Cattle, HealthEvent, MilkRecord, Transaction (+ User reverse relations).
- `createCrudRouter` `trackActor: true` sets actor on create/update and includes `createdBy` on responses.
- Side-effect creates (milk sale, treatment expense, birth calf) also stamp the actor.
- Frontend maps `createdBy` → `recordedBy`; Detail / Cattle Profile show “Recorded by” when present.

**Acceptance:** New milk/event/transaction rows store creator; UI shows name when available.

---

## A3 — Soft archive instead of hard delete (M · ~2–3 days) ✅ DONE

**Problem:** Hard DELETE loses history needed for vet/finance standards.

**Shipped**

- Prisma: `deletedAt` / `deletedByUserId` on Cattle, HealthEvent, MilkRecord, Transaction.
- `createCrudRouter` `softDelete: true` — `DELETE` stamps archive fields; lists/get/update skip archived rows.
- Linked milk sales and treatment expenses soft-archived with their parent record.
- Reports, lifecycle, breeding/pregnancy prefills, and milk withdrawal ignore archived rows.
- Restore UI / `?archived=true` filter deferred to **A3b**.

**Acceptance:** Deleting a transaction/event hides it from default lists but row remains in DB.

---

## A4 — Change password (authenticated) (S · ~1 day) ✅ DONE

**Problem:** Staff cannot rotate temporary passwords safely.

**API**

- `POST /api/v1/auth/change-password`  
  Body: `{ currentPassword, newPassword }`  
  Auth required.

**Shipped**

- Zod `changePasswordSchema` (min 6, must differ from current).
- Authenticated route verifies current hash, bcrypt-hashes new password.
- Settings → Change Password screen (all roles).

---

## A5 — Forgot / reset password (M · ~3–4 days) ✅ DONE

**Problem:** Locked-out owners cannot recover without DB access.

**Shipped**

- Prisma `PasswordResetToken` (hashed token, 1h expiry, single-use).
- `POST /auth/forgot-password` `{ email }` — always 200; mail via Resend or console log.
- `POST /auth/reset-password` `{ token, newPassword }`.
- Login → Forgot Password → Enter reset code screens.
- Env: `APP_PUBLIC_URL`, `RESEND_API_KEY`, `MAIL_FROM`, `EXPOSE_DEV_RESET_TOKEN`.

**Acceptance:** Owner can reset via emailed one-time code (or logged/dev token in local).

---

## A6 — Lightweight audit log (M · ~3 days) ✅ DONE

**Problem:** No trail of create/update/delete for compliance.

**Shipped**

- Prisma `AuditLog` with farm/actor indexes.
- `writeAudit` from CRUD (`auditEntityType`) for cattle/milk/events/transactions + LOGIN / password events.
- Owner/Super Admin `GET /api/v1/audit-logs?entityType=&from=&to=&page=&limit=`.
- Settings → Activity Log (filter chips by entity type).

**Acceptance:** Creating/updating/soft-deleting milk or expense produces an audit row visible to Owner.

---

## Suggested build order

```
A1 (RBAC UI+API) → A4 (change password) → A2 (createdBy) → A3 (soft delete) → A5 (forgot password) → A6 (audit)
```

A1 unblocks correct multi-user demos. A4 is quick trust win. A2/A3/A6 share migration themes and can ship as one migration PR if preferred:

**Combined migration option:** `createdBy*` + `deletedAt*` + `AuditLog` + `PasswordResetToken` in one Prisma migrate, then land API/UI tickets separately.

---

## Out of scope for Phase A (explicit)

- Refresh tokens / MFA  
- Photo uploads / Attachments  
- Offline sync  
- Report CSV export  
- Feed inventory  
- Multi-farm switcher  

Those remain Phase B–D from the product gap analysis.

---

## UX stubs fixed alongside this backlog (done)

- Cattle list → Cattle Profile  
- Manage Expenses “View All” → Transactions  
- Removed dead Transactions header icons  
- Cattle Profile menu → Edit cattle  
- Removed unused ActionScreen stub  
