---
name: Valhalla Eventos
description: Internal box-office console for tracking palco and boleta sales, reservations, and partial payments in real time.
colors:
  ink: "#0a0908"
  umber: "#5e503f"
  clay: "#7a6852"
  hairline: "#e5dacd"
  baseline: "#c9b6a0"
  surface-page: "#f2f4f3"
  surface-card: "#ffffff"
  wine: "#49111c"
  amber: "#8c5a2e"
  plum: "#5c2a44"
  ember: "#8c2430"
  rust: "#7a3b24"
  tan: "#a9927d"
typography:
  display:
    fontFamily: "Space Grotesk, system-ui, -apple-system, Segoe UI, sans-serif"
    fontWeight: 700
    letterSpacing: "normal"
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, -apple-system, Segoe UI, sans-serif"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
components:
  button-primary:
    backgroundColor: "{colors.wine}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-danger:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.ember}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.lg}"
    padding: "20px"
  badge:
    rounded: "{rounded.full}"
    padding: "2px 8px"
---

# Design System: Valhalla Eventos

## Overview

**Creative North Star: "The Velvet Ledger"**

Valhalla Eventos runs box-office operations for live-music events: staff selling palcos and boletas simultaneously, tracking partial payments, watching a shared ledger update in real time. The visual system is an opulent, wine-dark account book — precise numbers dressed in gothic romance, never the other way around. This is Operate mode, not marketing: the gothic-romantic identity lives in restrained, deliberate details (one wine-red accent, a display typeface reserved for structure, a palette that never uses pure black or pure gray), while the actual working surface — tables, grids, forms, running totals — stays scannable, flat, and fast under sales-window pressure.

The system explicitly rejects two failure modes: the generic SaaS admin dashboard (purple-to-blue gradients, cards nested in cards, Inter-everywhere sameness) and nightlife-cliché neon (anything loud, glowing, or discotheque-coded). What's left is closer to a ledger bound in leather than a screen full of widgets: dark ink, warm earth neutrals, hairline rules instead of heavy chrome, and exactly one accent color doing all the pointing.

**Key Characteristics:**
- One accent color (wine `#49111c`) carries every interactive and brand cue; nothing else competes with it.
- Flat surfaces at rest, hairline borders instead of shadow as the default separator.
- A single earthy palette family does double duty as UI neutrals, chart series, and status colors — nothing is a one-off.
- Display type (Space Grotesk) marks structure only: page titles, card/modal headers, stat values. Everything else reads in Plus Jakarta Sans.
- Full light/dark theming via CSS custom properties, with the same roles and relationships preserved in both.

## Colors

The palette is a single warm, desaturated wine-and-earth family — the same handful of hues carry UI neutrals, the one brand accent, chart series, and status meaning, so nothing in the interface introduces an unrelated hue.

### Primary
- **Wine** (`#49111c`; dark mode `#a13a4a`): the only brand accent. Used on primary buttons, active nav state, links, focus rings, and the "vendible por boleta" indicator dot. **The One Voice Rule.** Wine appears only where the interface wants a click or wants to say "this is the brand" — never as a large fill, never decoratively. Its rarity is what makes it read as intentional.

### Neutral
- **Ink** (`#0a0908`; dark mode `#f2f4f3`): primary text, and the "night" surface the entire dark theme inverts around.
- **Umber** (`#5e503f`; dark mode `#a9927d`): secondary text — labels, metadata, secondary nav.
- **Clay** (`#7a6852`; dark mode `#92806c`): muted/tertiary text — timestamps, helper copy, legend labels.
- **Hairline** (`#e5dacd`, 10% ink in dark mode): the default border and separator color. This system draws structure with 1px hairlines, not shadow.
- **Baseline** (`#c9b6a0`; dark mode `#3d2f23`): chart axis/baseline color only.
- **Surface Card** (`#ffffff`; dark mode `#171210`): the elevated surface — cards, modals, inputs.
- **Surface Page** (`#f2f4f3`; dark mode `#0a0908`): the page background, one step back from Surface Card.

### Status & Data
Reservation/sale state and chart series share the same palette family rather than introducing traffic-light red/yellow/green — status meaning here is a *tone shift within the brand's own hues*, not a departure from them.
- **Plum** (`#5c2a44`; dark mode `#c9647a`) — **vendido** (paid in full). Deliberately distinct from Wine (the brand accent) so "fully sold" never gets mistaken for "click here."
- **Amber** (`#8c5a2e`; dark mode `#c68a4a`) — **separado** (reserved, partial payment pending).
- **Ember** (`#8c2430`; dark mode `#de5a4e`) — critical/urgent status.
- **Rust** (`#7a3b24`; dark mode `#d2734a`) — serious (between warning and critical).
- **Tan** (`#a9927d`; dark mode `#8c6478`) — extended chart series only, no status meaning.

### Named Rules
**The No Pure Black Rule.** Ink (`#0a0908`) and every dark surface carry a warm brown undertone, never `#000000` or a cool gray. Flatness comes from restraint, not from defaulting to grayscale.

## Typography

**Display Font:** Space Grotesk (weights 500/600/700), with system-ui fallback
**Body Font:** Plus Jakarta Sans (weights 400–700), with system-ui fallback

**Character:** Space Grotesk is reserved entirely for structural moments — it never appears in a sentence of running copy. Plus Jakarta Sans carries every paragraph, label, table cell, and form field. The pairing reads as "ledger with a signature": most of the page is a plain, highly legible working face, and the moments that need authority switch typeface rather than just going bigger or bolder.

### Hierarchy
- **Display / Page Title** (Space Grotesk, 700, 24px / `text-2xl`): route-level page headings ("Eventos", "Localidades", "Dashboard") and headline stat values on the dashboard.
- **Headline / Section Title** (Space Grotesk, 600, 18px / `text-lg`): card titles, modal titles, dashboard section headers.
- **Body** (Plus Jakarta Sans, 400–500, 14px / `text-sm`): the default size for almost everything — table cells, form labels, list rows, secondary copy.
- **Label** (Plus Jakarta Sans, 500, 12px / `text-xs`): status badges, chart legends, the smallest metadata.

### Named Rules
**The Typeface-Switch Rule.** Emphasis is expressed by switching from body to display type, not by scaling body type up. A "big number" (a stat value, a page title) is always set in Space Grotesk at 700, never Plus Jakarta Sans at a larger size.

## Layout

Single-column, max-width content (`max-w-6xl` for the app shell, narrower for detail pages) centered with consistent horizontal padding. Cards and grids reflow responsively (`sm:`/`md:` breakpoints) — the palco grid, for example, steps from 4 to 6 to 8 columns as viewport grows. Density is comfortable, not compact: generous card padding (20px) and consistent gaps (8–16px) so operators scanning many palcos/boletas at once aren't fighting cramped hit targets. Navigation is a two-tier header: a persistent top bar (brand + logout), and a contextual sub-bar (breadcrumb + section tabs) that only appears once inside an event.

## Elevation & Depth

Flat by default. The system uses hairline borders (`hairline`, 1px) as the primary way to separate surfaces, and reserves shadow for exactly two situations: a card lifting slightly on hover (a state response, not a resting decoration) and the modal, which needs real separation from the page behind it.

### Shadow Vocabulary
- **Resting card** (`shadow-sm`): the quiet default on every card-like surface (event cards, locality cards, stat tiles). Barely visible — it's there so the card doesn't look pasted onto the page background, not to create drama.
- **Hover lift** (`shadow-md`, paired with `translateY(-2px)`): the response to hover on interactive cards — confirms "this is clickable" without any color change.
- **Modal** (`shadow-xl`): the one place real depth appears, because a modal must read as unambiguously in front of the page.

### Named Rules
**The Flat-By-Default Rule.** Shadow only appears as a response to state (hover) or to establish real z-order (modal). A card that isn't hovered or floating has no shadow beyond the barely-there resting value.

## Shapes

Two radius steps cover nearly everything: `8px` (`rounded-lg`) for anything you interact with directly — buttons, inputs, nav pills, the palco grid cells — and `12px` (`rounded-xl`) for containers — cards and the modal panel. Fully round (`rounded-full`) is reserved for pills: status badges, the payment progress bar, and small legend dots. There is no sharp-corner mode and no heavy/dramatic radius anywhere; the form language stays quietly consistent rather than expressive.

## Components

### Buttons
- **Shape:** `rounded-lg` (8px), consistent across all three variants.
- **Primary:** Wine background, white text, `8px 16px` padding. Hover softens via `opacity: 0.9` rather than a color swap (keeps the single-accent rule intact — there's no "darker wine" token).
- **Secondary:** white/surface-card background, hairline border, ink text. Hover fills with `surface-page`.
- **Danger:** hairline border in Ember, Ember text, transparent background. Hover fills with a 10%-opacity Ember tint. Reserved for destructive actions (delete event, delete locality).
- **Hover / Focus / Press:** every button transitions `transform`/`opacity`/`background-color` over 150ms on the project's strong ease-out curve (`--ease-out-strong: cubic-bezier(0.23, 1, 0.32, 1)`), and scales to `0.97` on `:active` for press feedback. Disabled state drops to 50% opacity and suppresses the press-scale.

### Badges (status pills)
- **Style:** `rounded-full`, `2px 8px` padding, `text-xs font-medium`, 12–20% opacity tint of the status color as background with the full-strength status color as text. No border.
- **State:** three fixed states — disponible (neutral clay tint), separado (amber tint), vendido (plum tint) — always the same color-to-meaning mapping across the whole app.

### Cards / Containers
- **Corner Style:** `rounded-xl` (12px).
- **Background:** `surface-card`, hairline border.
- **Shadow Strategy:** `shadow-sm` at rest; interactive cards add `shadow-md` + a 2px upward nudge on hover (see Elevation & Depth).
- **Internal Padding:** 20px (event/locality cards), 16px (compact stat tiles).

### Inputs / Fields
- **Style:** hairline border, `surface-card` background, `rounded-lg`, `12px` horizontal / `8px` vertical padding.
- **Focus:** border switches to Wine plus a 1px Wine focus ring — the only place a ring appears outside the global `:focus-visible` outline.
- **Error:** inline message in Ember text below the field, no border-color error state currently.

### Navigation
- Two-tier header: primary bar (logo, user email, logout) always visible; a contextual sub-bar (breadcrumb + section tabs) appears only inside an event. Tabs are `rounded-lg` pills: active state is a solid Wine fill with white text, inactive is Umber text that fills `surface-page` on hover. No underline-style nav anywhere in the system.

### Payment Progress (signature component)
A thin (`h-2`) fully-rounded track in `surface-page`, filled by a Plum bar whose width animates to the paid percentage (300ms, strong ease-out). Paired with an amount label above ("Abonado $X de $Y") and a pending-balance line below when unpaid. This is the component that carries the product's core trust claim — money owed and money paid — so it never uses the brand accent (Wine); it uses Plum, the same color as "vendido," to visually tie "progress toward paid" to "the state you reach when paid."

## Do's and Don'ts

### Do:
- **Do** keep Wine (`#49111c` / `#a13a4a` dark) as the only accent used for interactive/brand cues. If a second UI color is needed, pull from the existing status/data palette rather than introducing a new hue.
- **Do** default new surfaces to flat + hairline border; add `shadow-sm` only if the surface is genuinely card-like, `shadow-md`/lift only as a hover response.
- **Do** set structural moments (page titles, section headers, stat values) in Space Grotesk; everything else in Plus Jakarta Sans.
- **Do** use the `--ease-out-strong` curve and 150–300ms durations for interactive feedback (button press, hover, modal enter) — see `src/index.css`.
- **Do** keep Spanish domain vocabulary in UI copy (palco, boleta, localidad, abono, comprador) — this is a durable product/brand commitment, not just a language choice.

### Don't:
- **Don't** introduce pure black (`#000000`) or a cool/neutral gray anywhere — every dark value in this system carries a warm brown undertone.
- **Don't** reach for a second accent color, a gradient, or neon/glow treatments — they read as off-brand for a gothic-romance ledger, not just "bold."
- **Don't** stack cards inside cards, or add shadow to a surface that isn't hovered or floating (modal). Depth here is earned, not decorative.
