# Responsive / UI-UX Audit — Storefront Admin (deep dive)

Date: 2026-07-24
Scope: `use-me-with-style-platform`, `/admin/*` only, per your report that admin "is not responsive yet."

## Methodology — and why this pass is more reliable than the last one

The previous audit (`RESPONSIVE_AUDIT_2026-07-24.md`) used this session's browser-resize tool, which turned out to be resizing your real desktop browser window — its floor was ~500px and its ceiling was ~1568px, both physical limits of your monitor, not the app. That means true phone widths (320–428px) and true ultra-wide (>1568px) were **never actually rendered** in that pass, even though a couple of findings were marked "Verified." That gap is almost certainly why you're still seeing problems at your desk despite last session's fixes.

For this pass I built a harness that loads each admin route inside an `<iframe>` set to an exact CSS pixel width, independent of your actual window size — so I could genuinely test 320px through 2560px. Two techniques:

1. **Automated overflow scan** — for every route, at ~11–23 widths between 320 and 2560px, I measured whether the page's root element got wider than the viewport (`documentElement.scrollWidth > width`). This is the precise, code-level signature of "content is cut off / causes a horizontal scrollbar" — the classic "not responsive" symptom — and it doesn't rely on me spotting something in a screenshot.
2. **Targeted screenshots** — for anything the scan flagged, or for structural checks the scan can't do (does the sidebar actually stay put when you scroll, does content look reasonable at 2560px), I rendered the real page and looked at it.

Routes covered: Dashboard, Orders (empty state), Products list, Product Editor (existing product), Customers (empty state), Messages, Invoices, Media, Settings (all 4 tabs: Markets, Policies & content, Invoicing, Legal pages), plus the mobile nav specifically. Order Detail and Customer Detail couldn't be opened — your dev database currently has 0 orders and 0 customers — so those two are assessed by source/pattern review only (both share the exact same grid classes as Product Editor, see Finding 2), not independently screenshotted.

---

## What I found

| # | Finding | Severity | Status |
|---|---|---|---|
| 1 | Mobile nav bar hides half its items with zero indication it scrolls | **High** | Verified, reproducible |
| 2 | Product Editor overflows 8px at 320px width (grid min-width bug) | Low–Medium | Verified, reproducible |
| 3 | Everything else — Dashboard, Orders, Products, Customers, Messages, Invoices, Media, all 4 Settings tabs | — | Clean at every width tested, 320–2560px |

The short version: last session's Phase 1–4 fixes (sticky sidebar, admin content max-width) are holding up correctly — I confirmed the sidebar genuinely stays in place while scrolling at 1024px, and the 1800px content cap looks right even at 2560px. The admin isn't broadly broken. But there is one real, high-impact navigation bug that would make the app feel non-functional on an actual phone, which lines up with what you ran into.

---

## Finding 1 — Mobile nav bar hides most of its items, with no hint that it scrolls (High)

**Where:** `.ump-admin-sidebar` in `App.tsx`, `@media (max-width: 860px)` block — the nav becomes a horizontal bar (`overflow-x: auto`) instead of a vertical sidebar.

At 320px (a real small-phone width, e.g. iPhone SE), the bar only has room to show "Painel" and "Encomendas" before it's cut off — **Produtos, Definições, and the entire secondary group (Clientes, Mensagens, Invoices, Media) are scrolled off-screen**, with no scrollbar, arrow, fade edge, or any other visual cue that there's more to the left or right. I confirmed via DOM inspection that the content is technically there (`scrollWidth: 793` vs `clientWidth: 314` — more than double the bar's visible width), so nothing is destroyed, but a real user has no way to discover that swiping the bar sideways reveals the rest of the nav. On a phone, this reads as "I can't get to Products or Settings" — which is a completely reasonable way to conclude "this isn't responsive."

This gets worse the more nav items exist relative to bar width — since there are 8 top-level destinations plus logout, this triggers even on slightly bigger phones like a 375–390px iPhone, not just 320px edge cases.

**Fix direction (pick one, ranked by effort):**
- **Cheapest — scroll affordance only:** add a subtle right-edge fade/gradient (and left-edge once scrolled) so it's visually obvious the bar scrolls. Doesn't reduce the number of taps but at least stops it looking broken.
- **Better — collapse secondary nav on mobile:** the desktop sidebar already separates primary nav from a "MAIS" (More) group; on mobile, put "Mais" behind a single button that opens a sheet/dropdown with Clientes/Mensagens/Invoices/Media, so the horizontal bar only ever needs to fit 5 items (Painel, Encomendas, Produtos, Definições, Mais) instead of 9.
- **Most standard — bottom tab bar:** the storefront already has a mobile bottom tab bar pattern (per the earlier audit's "what's solid" list) — admin could reuse the same idea for its 4–5 most-used destinations, with everything else under a "More" sheet. More work, but it's the most conventional mobile-admin pattern and removes the scrolling nav entirely.

I'd suggest the "collapse secondary nav" option — it directly fixes the discoverability problem, reuses the primary/secondary distinction the sidebar already has, and is a contained change (one component, no new patterns).

## Finding 2 — Product Editor overflows 8px at 320px width (Low–Medium)

**Where:** `.ump-admin-orders-grid` (the class shared by Product Editor's photo+fields layout, Order Detail, and the Dashboard's two-column cards) — `App.tsx`, line ~337: `@media (max-width: 1000px) { .ump-admin-orders-grid { grid-template-columns: 1fr !important; } }`.

At 320px, Product Editor's page renders 8px wider than the viewport, verified reproducibly via three separate loads. Root cause: a bare `1fr` grid track has an implicit minimum size based on its content's min-content width, not `0`. Once nested content (this page has a second, inner 3-column grid for the name/category fields, which itself only collapses to 1 column below 640px) is involved, the outer track's effective minimum can end up wider than the actual available space, and the grid overflows its own container rather than shrinking further. It's a small, single-cause bug, but it's the kind of well-known CSS Grid gotcha that's worth fixing at the root rather than patching per-page, because it's silently present in the two other components sharing this class (Order Detail, Dashboard cards) — I just couldn't reproduce it on those two because Order Detail has no seed order to open and Dashboard's content is currently too sparse (all-zero dev data) to trigger it.

**Fix direction:** change the three grid-stacking rules to use `minmax(0, 1fr)` instead of bare `1fr` — this is the standard fix for this exact issue and costs nothing on wider screens:

```css
@media (max-width: 1000px) {
  .ump-admin-dashboard-grid, .ump-admin-orders-grid { grid-template-columns: minmax(0, 1fr) !important; }
}
@media (max-width: 640px) {
  .ump-admin-fields-grid { grid-template-columns: minmax(0, 1fr) !important; }
}
```

Worth also adding `min-width: 0` to the grid items' own inline styles (the photo-box wrapper and the fields-box wrapper in `ProductEditor.tsx`) as a second line of defense, since that's the more common industry-standard guard against exactly this class of bug.

---

## What's already solid (verified at true 320–2560px this time, not just ~500–1568px)

- Dashboard, Orders, Products list, Customers, Messages, Invoices, Media, and all 4 Settings tabs: zero unintended horizontal overflow at every width tested from 320px to 2560px.
- Sticky sidebar (last session's Phase 1 fix): re-verified by actually scrolling a long page (Product Editor) at 1024px — the nav genuinely stays in place, this is working correctly.
- Admin content max-width cap (last session's Phase 2 fix): re-verified at a true 2560px width — content stays centered at 1800px instead of stretching edge-to-edge, looks intentional and well-proportioned.
- Settings' 4 tabs (Markets, Policies & content, Invoicing, Legal pages): each checked independently by actually clicking through them, not just the default tab — all clean.

---

## Suggested next step

Finding 1 (nav discoverability) is the one worth fixing first — it's the most likely explanation for "not responsive" on a real device, and Finding 2 is a small, contained CSS fix that can ride along with it. Both are ready to implement whenever you'd like me to proceed.

---

## Addendum, same day: real-device recording surfaced two more gaps

Both findings above were fixed and verified in Chrome. A follow-up screen recording (Safari's Responsive Design Mode, true phone width) showed the admin still didn't read as responsive, for two reasons this Chrome-only pass had missed:

**The Finding-1 fix (horizontal-scrolling bar + "More" dropdown) was itself a non-standard pattern.** It technically worked — nothing was unreachable — but a horizontally-scrolling top nav bar isn't a pattern most users recognize on sight, and discovering "swipe sideways, then tap More" isn't obvious. Replaced it outright with the standard pattern: a slim top bar with just the logo and a hamburger icon, which opens a full off-canvas drawer containing the complete nav (identical content to the desktop sidebar). This also fixed a bug the old mobile layout had from the start: the user-info-and-logout block was `display: none` below 861px, meaning there was previously no way to log out from a phone at all — it's now part of the drawer.

**Three grids had no responsive treatment at all and weren't caught by the source review**, because they use an inline `repeat(auto-fit/auto-fill, minmax(Npx, 1fr))` directly with no CSS class — every other admin grid in this codebase goes through one of three shared `.ump-admin-*-grid` classes, which is what the original audit checked. These three were invisible to that search:

- Dashboard's 5 metric cards (`minmax(160px, 1fr)`)
- The Products page's product-card grid (`minmax(220px, 1fr)`)
- The Media library's thumbnail grid (`minmax(160px, 1fr)`)

`auto-fit`/`auto-fill` is designed to reduce its own column count as the container shrinks and never intentionally overflow — so on paper these should have been safe without any extra work, and Chrome testing at every width from 320–2560px found nothing wrong with them. The recording showed that assumption breaking in practice on Safari: the metric row rendered two cards side by side and ran off the screen edge instead of collapsing to one column. Rather than chase the exact cause, all three now get an explicit, deterministic column count below 480px (`minmax(0, 1fr)`, not auto-fit's own sizing) that doesn't depend on any particular browser's auto-fit implementation.

Both fixed, verified (tsc/eslint/tests/build clean, full 320–2560px overflow re-scan clean on every route, drawer open/close/backdrop/Escape/navigation all confirmed), and committed.
