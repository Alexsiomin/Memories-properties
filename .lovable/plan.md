# Tracking System

Add end-to-end tracking across the platform, covering the four areas you selected.

## 1. Sale status history
Track every time a unit's status changes (e.g. available → reserved → sold), with a timestamp and who changed it.

- New table `property_status_history` (property_id, old_status, new_status, changed_by, created_at).
- A database trigger on `properties` automatically logs a row whenever `status` changes — no manual work.
- On each development/project detail page, show a small "Status timeline" per unit (or a project-level activity log).

## 2. Sold totals per project
Show real sale progress on every development.

- Compute per project: `X of Y units sold`, percentage sold, and total sold value (sum of `price_value` for sold units).
- Display a progress bar + totals on the Developments list cards, the Sold Projects page, and the development detail header.
- All computed in the frontend from existing property rows — no schema change.

## 3. Visitor / website analytics
Track interest in listings and projects.

- New table `page_views` (path, property_slug nullable, referrer, session_id, user_id nullable, created_at).
- Lightweight client tracker fires a view event on each route change and on listing/project detail opens.
- Public can insert (anonymous tracking); only admins can read.

## 4. Admin dashboard summary
Turn the admin dashboard into a real overview.

- Top cards: total projects, available units, sold units, total sold value, total page views (last 30 days).
- "Most viewed listings" table (from `page_views`).
- "Recent status changes" feed (from `property_status_history`).
- Keep existing navigation cards below the summary.

## Technical notes
- Migrations: create `property_status_history` and `page_views` with GRANTs + RLS (anon insert on page_views; admin-only read on both via `has_role`).
- Trigger function `log_property_status_change()` on `properties` AFTER UPDATE.
- New helpers in `src/lib/developments.ts` for sold-count/sold-value aggregation.
- New `usePageView` hook + tracking call in `Layout.tsx` and detail pages.
- Dashboard rebuilt in `src/pages/AdminDashboard.tsx` with summary queries; sold progress UI added to development components.

Build order: migrations first (status history + page views), then dashboard + sold totals UI, then visitor tracking.
