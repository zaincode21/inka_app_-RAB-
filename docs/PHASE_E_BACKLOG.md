# Phase E Backlog — Security hardening

Goal: shorten access-token lifetime, rotate refresh tokens safely, and add optional MFA so stolen JWTs and passwords are less catastrophic.

**Suggested build order:** E1 → E2 → E3 → E4  
(E1 unlocks shorter access tokens without logging everyone out every hour; E2–E3 are MFA; E4 is device/session hygiene.)

Phases A–D are complete (trust, data UI, reports/offline, scale/i18n/OpenAPI).

---

## Current state (baseline)

- Single JWT (`Authorization: Bearer`) signed with `JWT_SECRET`, **7d** expiry (`auth.ts` `createAuthResponse`).
- Frontend stores `{ token, user }` in AsyncStorage (`authApi.ts`); no refresh flow; 401 → manual re-login.
- Password reset uses hashed one-time `PasswordResetToken` rows (good pattern to mirror for refresh + MFA).
- No MFA fields on `User`; no refresh/session table; OpenAPI documents Bearer-only auth.

---

## E1 — Access + refresh token pair (L · ~1 week)

**Problem:** A 7-day access JWT in AsyncStorage is a long-lived bearer secret; there is no way to rotate or revoke without changing `JWT_SECRET`.

**Build**

### Backend
- Split secrets / TTLs in `env`:
  - `JWT_ACCESS_SECRET` (or reuse `JWT_SECRET`) + short access TTL (e.g. **15m**)
  - `JWT_REFRESH_SECRET` (separate) + refresh TTL (e.g. **30d**)
- Prisma `RefreshToken` (or `AuthSession`):
  - `id`, `userId`, `tokenHash` (never store raw), `expiresAt`, `revokedAt`
  - optional: `userAgent`, `deviceLabel`, `createdAt`, `lastUsedAt`
- Auth responses become:
  ```json
  { "accessToken": "...", "refreshToken": "...", "expiresIn": 900, "user": { ... } }
  ```
  Keep temporary compatibility: also return `token` = `accessToken` until the app is updated (or do a hard cut in the same PR).
- `POST /auth/refresh` `{ refreshToken }` → new access (+ **rotate** refresh: revoke old hash, issue new).
- `POST /auth/logout` (auth or refresh body) → revoke refresh row(s).
- Password change / reset / deactivate user → revoke all refresh tokens for that user.
- `authenticate` middleware verifies **access** JWT only (short-lived).

### Frontend
- Persist `accessToken` + `refreshToken` (+ `expiresAt` optional).
- `apiClient`: on **401**, try one refresh then retry the request; if refresh fails → clear session → Login.
- Update login / register / switch-farm to store the new shape.
- OpenAPI: document refresh + logout; update Bearer description.

**Acceptance:** Access JWT expires in ≤30 minutes; app stays signed in via refresh rotation; logout (or password change) invalidates refresh so stolen refresh cannot mint new access tokens.

---

## E2 — TOTP MFA enrollment (M–L · ~1 week)

**Problem:** Password-only accounts (especially Owner / Super Admin) are one phish away from full farm access.

**Build**

### Backend
- Prisma on `User`:
  - `mfaEnabled` (bool, default false)
  - `mfaSecretEnc` (encrypted TOTP secret; never return raw after setup)
  - optional `mfaBackupCodesHash` (array of hashed one-time codes)
- Dependencies: `otplib` (or equivalent) + encrypt secret at rest (`MFA_ENCRYPTION_KEY`).
- Routes (authenticated unless noted):
  - `POST /auth/mfa/setup` → `{ otpauthUrl, secret }` (pending until confirm)
  - `POST /auth/mfa/confirm` `{ code }` → enable MFA, return backup codes once
  - `POST /auth/mfa/disable` `{ password, code }` → disable
- Login change:
  - If `mfaEnabled`, password OK returns `{ mfaRequired: true, mfaToken }` (short-lived challenge JWT, **not** farm access).
  - `POST /auth/mfa/verify` `{ mfaToken, code }` → full access + refresh pair.
- Audit: `MFA_ENABLE`, `MFA_DISABLE`, `MFA_CHALLENGE_FAIL` (rate-limit failures).

### Frontend
- Settings → **Two-factor authentication**: show QR (`otpauthUrl`) + confirm code; store backup codes screen (copy once).
- Login: if `mfaRequired`, navigate to MFA code screen before Dashboard.
- Seed: leave demo accounts MFA-off unless a dedicated `owner-mfa` fixture is useful for QA.

**Acceptance:** Owner can enable TOTP; subsequent logins require a valid authenticator (or backup) code before tokens are issued.

---

## E3 — MFA policy + recovery (M · ~3–5 days)

**Problem:** Optional MFA is easy to skip; lost phones need a safe recovery path.

**Build**

- Policy (config or System Config / env):
  - `MFA_REQUIRED_ROLES=SUPER_ADMIN,FARM_OWNER` (or soft-nag first, then hard require).
- Soft enforcement: after login without MFA, banner in Settings/Dashboard “Enable 2FA”.
- Hard enforcement (optional flag): login for listed roles always returns `mfaEnrollmentRequired` until setup completes (limited-scope token that only allows `/auth/mfa/*` + `/users/me`).
- Backup codes: consume-on-use; regenerate in Settings (requires password + current TOTP).
- Admin assist: Super Admin can clear MFA on a user (`POST /users/:id/mfa/reset`) with audit — for locked-out owners.

**Acceptance:** Owners/Super Admins are prompted (or required) to enroll; backup codes and admin reset recover lockouts without emailing raw TOTP secrets.

---

## E4 — Session list & remote revoke (S–M · ~2–3 days)

**Problem:** Users cannot see or kill other devices after refresh tokens exist.

**Build**

- `GET /auth/sessions` — list non-revoked refresh rows (masked id, deviceLabel, lastUsedAt, current flag).
- `DELETE /auth/sessions/:id` — revoke one; `DELETE /auth/sessions` — revoke all except current.
- Settings → **Active sessions** UI.
- Optional: bind refresh to a stable `deviceId` stored in AsyncStorage for clearer labels.

**Acceptance:** User can revoke another device’s refresh token and that device cannot refresh again.

---

## Out of scope for Phase E

- WebAuthn / passkeys
- SMS OTP as primary MFA (cost + SIM swap); TOTP + backup codes only
- Full SSO / OIDC (Google, Microsoft)
- Certificate pinning / mobile RASP
- Per-endpoint step-up MFA beyond login
- IoT / MoMo / PDF (separate product tracks)

---

## Suggested env additions

```env
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d
JWT_REFRESH_SECRET=...          # required in production; distinct from access secret
MFA_ENCRYPTION_KEY=...          # 32-byte key material for TOTP secret encryption
MFA_REQUIRED_ROLES=SUPER_ADMIN,FARM_OWNER
```

Migrate carefully: existing clients with only `token` need one app release that understands refresh **before** cutting access TTL to minutes in production.

---

## Done when

- Access tokens are short-lived; refresh tokens rotate and can be revoked.
- Optional TOTP MFA works end-to-end (setup → login challenge → verify).
- Owners/admins have a clear enrollment/recovery path.
- OpenAPI + `backend/README.md` document the new auth contract.
- Frontend never stores a multi-day access JWT as the only credential.

---

## Start here

Implement **E1** first (token pair + client refresh). MFA on top of 7-day JWTs is less valuable than MFA on top of rotatable sessions.
