# Phase C Backlog — Insights, alerts & rural resilience ✅ COMPLETE

Goal: make Inka useful for decisions and unreliable connectivity — real reports/exports, reminders, and offline entry.

**Shipped order:** C1 (reports/CSV) → C2 (reminders) → C3 (offline queue).

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

## C2 — Follow-up / withdrawal reminders (M · ~3–4 days) ✅ DONE

**Problem:** Return-heat and treatment follow-ups exist in data but staff are not nudged.

**Shipped baseline already:** Events UI follow-up cards; milk withdrawal auto-reject.

**Shipped**

- Dashboard **Alerts** strip (due follow-ups + milk withdrawal ending within 2 days); Health Alerts card opens Events
- Settings → **Follow-up reminders** toggle (AsyncStorage; default on)
- `expo-notifications` local schedules at 08:00 on follow-up / withdrawal-end dates (already-due items stay Dashboard-only to avoid spam)
- Sync on app hydrate + Dashboard focus

**Acceptance:** With reminders enabled, due follow-ups surface on Dashboard and as a local notification when the app can schedule them.

---

## C3 — Offline queue for milk & events (L · ~1–2 weeks) ✅ DONE

**Problem:** Rural farms lose connectivity; milk/event entry must not depend on live API.

**Shipped**

- AsyncStorage queue (`frontend/data/offlineQueue.ts`) for **milk create** and **individual event create** only
- Auto-queue when device is offline or the request fails with a network error; edits still require online
- Flush on app start, Dashboard focus, NetInfo reconnect, and banner tap
- Dashboard banner: “N records waiting to sync”
- Event local photos upload after the queued event syncs
- Milk sale flag (`createMilkSale`) is preserved in the queued payload (single create on flush)

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
