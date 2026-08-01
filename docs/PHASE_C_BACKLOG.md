# Phase C Backlog — Insights, alerts & rural resilience

Goal: make Inka useful for decisions and unreliable connectivity — real reports/exports, reminders, and offline entry.

**Suggested build order:** C1 → C2 → C3  
(C1 unlocks accountant/coop sharing; C2 uses existing follow-up dates; C3 is largest.)

Carry-over: **A3b** restore UI ✅ DONE.

---

## C1 — Date-range reports + CSV export (M · ~3–5 days) ✅ DONE

**Problem:** Reports are KPI cards only; farms need period P&L, milk totals, and shareable CSV for coop/bank/accountant.

**Shipped**

- `GET /api/v1/reports/period?from=&to=` — milk / herd / events / finance (finance null for roles without view)
- `GET /api/v1/reports/export.csv?dataset=milk|transactions|events|cattle&from=&to=`
- Reports screen: This month / Last 30 days / Custom range, period metrics, Share CSV via expo-sharing

**Acceptance:** Owner/Manager can pick a date range, see milk + money totals, and export CSV off-device.

---

## C2 — Follow-up / withdrawal reminders (M · ~3–4 days)

**Problem:** Return-heat and treatment follow-ups exist in data but staff are not nudged.

**Shipped baseline already:** Events UI follow-up cards; milk withdrawal auto-reject.

**Build**

- Local notifications (Expo Notifications) for:
  - Follow-up due today / overdue
  - Milk withdrawal ending soon (optional)
- In-app “Alerts” strip on Dashboard (reuse `/events?followUpDue=true` + withdrawal helpers)
- Settings toggle: reminders on/off

**Acceptance:** With reminders enabled, due follow-ups surface on Dashboard and as a local notification when the app can schedule them.

---

## C3 — Offline queue for milk & events (L · ~1–2 weeks)

**Problem:** Rural farms lose connectivity; milk/event entry must not depend on live API.

**Build**

- Persist pending creates (AsyncStorage / SQLite) when API fails or offline
- Retry on reconnect with idempotency key or client-generated id
- Badge / banner: “N records waiting to sync”
- Scope v1: milk create + individual event create only (not edits/deletes)

**Acceptance:** Airplane-mode milk save queues locally and syncs when back online without duplicate sales if possible.

---

## Out of scope for Phase C

- Feed inventory, multi-farm switcher, i18n (Phase D)
- Push via FCM/APNs server campaigns (local notifications only in C2)
- PDF reports (CSV is enough for C1)
- MFA / refresh tokens

---

## Done when

- Period reports + CSV export work for milk and finance.
- Follow-up alerts are visible without opening Events.
- Core milk/event create survives brief offline periods.
