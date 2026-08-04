# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Internal box-office/sales staff of Valhalla Eventos, a live-music/concert event producer. No public users — accounts are created manually in Firebase Auth by an admin; there is intentionally no self-registration. Multiple staff members use the app simultaneously (in person or by phone) during an event's presale window.

## Product Purpose

Track box seat (palco) and loose ticket (boleta) sales, reservations, and partial payments (abonos) per event and locality in real time. Replaces the team's prior manual tracking (spreadsheets/WhatsApp), giving every seller live visibility into what's available, reserved, or sold.

## Positioning

Real-time shared state across simultaneous sellers is the mechanism a spreadsheet or chat thread can't truthfully replicate: Firestore `onSnapshot` listeners mean one seller reserving a palco is instantly visible to every teammate, without a manual refresh — preventing double-selling and stale information during a live sales rush.

## Operating Context

Used during event presale periods, typically from multiple devices/locations at once. Staff enter buyer info (nombre, cédula, teléfono) and record payments (efectivo, transferencia, tarjeta) as partial abonos against a palco or a boleta sale; status moves automatically from "separado" to "vendido" once the balance is paid off. The event Dashboard shows live counts by status, recaudo per locality, and recaudo over time.

## Capabilities and Constraints

- Single trust level: any authenticated account has full access. No roles/permissions differentiation — deliberate v1 scope decision (see README "Fuera de alcance").
- No public signup; accounts are provisioned manually in the Firebase Console.
- Spanish-language UI and domain vocabulary throughout: palco, boleta, localidad, abono, comprador, recaudo. Do not anglicize.
- Real-time sync via Firestore listeners — no manual refresh needed to see teammates' changes.
- Boleta capacity (aforo) is validated against existing records at sale time; a very rare race on the last unit under simultaneous sales is accepted as a known tradeoff at single-box-office-team scale.
- Out of scope for v1: expense tracking (income only), ticket printing/QR codes, notifications, exportable reports.

## Brand Commitments

Valhalla Eventos produces concerts and live-music events. Real logo at `public/logo.png`; it inverts to white in dark mode via the `.brand-logo` CSS filter (see `src/index.css`).

## Evidence on Hand

- Full domain model: `src/types/index.ts` (Evento → Localidad → Palco/BoletaSale → Payment).
- Incumbent visual system already implemented: a "Gothic Romance" palette in `src/index.css` (deep black `#0A0908`, wine red `#49111C`, ivory `#F2F4F3`, warm earth neutrals), with light/dark theme support and a `--ease-out-strong` motion token. Treat this as the design authority for refinement work; only a redesign request replaces it.
- `README.md` documents the data model, setup, and v1 scope in detail.

## Product Principles

- Real-time truth over manual reconciliation — every seller must see the same live state, always.
- Speed and clarity for staff working under sales-window time pressure outrank decorative flourish.
- Money accuracy (partial payments, balances owed) is the core trust surface of the product — never obscure or ambiguous it.
- Spanish domain language throughout — no anglicized UI terms.
- Single-team trust model — don't add permission complexity the product hasn't asked for yet.
