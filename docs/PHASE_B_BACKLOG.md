# Phase B Backlog — Complete the data model in UI ✅ COMPLETE

Goal: expose schema fields and workflows that already exist (or nearly exist) on the backend so cattle, milk, events, and finance feel complete for daily farm use.

**Shipped order:** B4 (milk edit/delete) → B2 (milk quality) → B3 (cattle exit) → B1 (photos/attachments).

Carry-over from Phase A: **A3b** restore / archived-list UI (optional).

---

## B4 — Milk record edit / delete parity (S · ~1–2 days) ✅ DONE

**Problem:** Milk has create + list + Detail only. Events already support edit/delete (soft archive). Workers/managers cannot fix typos or remove bad milk rows from the UI.

**Shipped**

- `updateMilkRecord` / `deleteMilkRecord` in `farmDatabase.ts`.
- `AddMilkRecord` edit mode via `{ milkRecord }` route param.
- Milk list ⋮ menu: Edit / Delete (role-gated).
- Detail: Edit Milk Record + Delete Milk Record actions.
- Delete soft-archives record and linked Milk Sale (existing backend).

**Acceptance:** Edit prefills and PATCHes; delete hides from list; Worker can edit; Manager/Owner can delete.

---

## B2 — Milk quality fields (fat / protein / SCC) (S · ~1 day) ✅ DONE

**Problem:** `fatPercent`, `proteinPercent`, `somaticCellCount` exist on `MilkRecord` and are always saved as `0` from the app.

**Shipped**

- Optional Fat %, Protein %, SCC inputs on create/edit milk form.
- Values map through existing API fields; blank → `0`.
- Detail shows quality metrics or “Not recorded” when zero.

**Acceptance:** Saving fat `3.8` stores and shows on Detail; blank fields show “Not recorded”.

---

## B3 — Cattle exit workflow (sold / culled / dead) (M · ~2–3 days) ✅ DONE

**Problem:** `CattleStatus` includes `SOLD` / `CULLED` / `DEAD` / `INACTIVE`, and death can be set from some health events, but there is no dedicated exit UX that records reason, date, and money.

**Shipped**

- `POST /api/v1/cattle/:id/exit` — updates status, appends exit notes, optional Cattle Sale income or Cattle Disposal expense (allowed for cattle writers).
- Cattle Profile → **Record Exit**; Cattle List filters Active / Exited / All.
- Milk cow picker and individual event cattle lists show **Active** animals only.
- API rejects milk/events linked to non-ACTIVE cattle.

**Acceptance:** Sold cow leaves Active list, appears under Exited, and creates Cattle Sale when amount &gt; 0.

---

## B1 — Photos + attachments (M–L · ~1–2 weeks) ✅ DONE

**Problem:** UI shows “Tap to add photo” but saves `photoUri: ''`. Prisma `Attachment` model exists with no upload API or client wiring.

**Shipped**

- `POST /api/v1/attachments` multipart image upload → disk (`UPLOAD_DIR`) + `Attachment` row; files served at `/uploads/...`.
- `GET /api/v1/attachments?cattleId=&transactionId=&healthEventId=`.
- `PhotoPickerField` (expo-image-picker) on cattle, individual events, and expense receipts.
- Cattle Profile / Event & Transaction Detail show images when present.
- Env: `UPLOAD_DIR`, `PUBLIC_BASE_URL` (set to your LAN IP for physical devices).

**Acceptance:** Attach a cow photo and see it on Cattle Profile; attach a receipt on expense and see it on Transaction Detail.
---

## Suggested tickets / order

```
B4 (milk edit/delete) → B2 (milk quality) → B3 (cattle exit) → B1a (photoUri picker) → B1b–d (upload + receipts)
Optional: A3b (restore archived) after B4
```

---

## Out of scope for Phase B

- Offline sync (Phase C)
- Push notifications (Phase C)
- Report CSV / date-range analytics (Phase C)
- Feed inventory, multi-farm, i18n (Phase D)
- MFA / refresh tokens

---

## Done when

- Milk rows can be corrected or archived from the app.
- Quality metrics can be recorded when known.
- Animals can leave the herd with status + optional money link.
- At least cattle (and ideally events/receipts) can store a visible photo/attachment.
