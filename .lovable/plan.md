This is a very large scope (admin panel + public member registration + payments verification + membership card generation). To ship it well without breaking what's already working, I'll do it in 4 phases. Confirm or tell me to reorder/skip phases.

## Phase 1 — Data model & storage (migration)
Extend the database to support everything the panels need:
- `members`: add `date_of_birth`, `gender`, `national_id` (unique), `sub_county`, `ward`, `occupation`, `next_of_kin_name`, `next_of_kin_phone`, `emergency_contact`, `reason_for_joining`, `passport_photo_path`, `id_front_path`, `id_back_path`, `membership_number` (unique, nullable), `status` enum (`pending_payment`, `payment_submitted`, `payment_verified`, `approved`, `rejected`, `suspended`), `approved_at`, `approved_by`.
- New `member_payments`: `member_id`, `amount` (default 300), `mpesa_code`, `payer_phone`, `paid_on`, `verified` bool, `verified_by`, `verified_at`.
- New `site_settings` (single-row key/value JSON) for org name, logo, contacts, socials, hero/footer text, homepage stats.
- New `activity_logs`: `actor_id`, `action`, `entity`, `entity_id`, `meta`, `created_at`.
- Add `treasurer` and `viewer` to `app_role` enum.
- Sequence + SQL function `generate_membership_number()` → `ULU-SHG-YYYY-0001`.
- RLS + GRANTs for all new tables; public `INSERT` allowed on `members` (pending only) and `member_payments`; reads restricted to admin/staff.
- Storage: reuse private `media` bucket with folders `members/photos`, `members/ids`, `projects`, `media-posts`, `staff`. Signed-URL access.

## Phase 2 — Public Member Registration flow
- New route `/join` — multi-step form (Personal → Location → Next of kin → Uploads → Review). Zod validation, dropzone uploads to `media` bucket via signed upload, then server fn `submitRegistration` creates `members` row with status `pending_payment`.
- After submit → `/join/payment` showing Paybill/Till instructions + Ksh 300, form to enter M-Pesa code, payer phone, date → `submitPayment` server fn updates status to `payment_submitted`.
- Confirmation screen with reference number; instructions to await admin verification.

## Phase 3 — Admin Panel completion
Build/upgrade these admin routes (sidebar already in place):
- **Dashboard** (`/admin`) — summary cards (members, pending approvals, projects by status, posts, gallery, messages, contributions/loans/repayments totals) + recent activity feed from `activity_logs`.
- **Projects** — full CRUD with image upload, status, progress slider, budget, dates, impact.
- **Media Desk** — posts CRUD with featured image, tags, draft/publish, simple rich-text (textarea + markdown render — full WYSIWYG out of scope; can upgrade later). Gallery albums via `gallery_images` grouped by `album`.
- **Member Approvals** (`/admin/approvals`) — queue of `payment_submitted` members with passport photo + payment details; actions: verify payment, approve (auto-generate membership number + card), reject, request correction.
- **All Members** — table with search/filter/export CSV, per-member drawer (profile, download card, regenerate card, suspend, delete, assign role).
- **Staff** — CRUD with role enum, photo, bio, display order.
- **Finance** — already exists; add CSV exports & summary cards.
- **Messages** — read/unread toggle, mailto reply, delete.
- **Users & Permissions** — extend existing to include `treasurer`/`viewer`, password reset email trigger.
- **Settings** — edit `site_settings` (org info, socials, hero/footer text, homepage stats, logo upload).
- All mutations go through `createServerFn` with `requireSupabaseAuth` + role assertion; every mutating action writes an `activity_logs` row.

## Phase 4 — Membership Card + Member Dashboard
- Server fn `generateMembershipCard(memberId)` renders an HTML card (front + back, green/blue/orange/yellow theme, QR pointing to `/verify/{membership_number}`) and returns a downloadable PDF via `pdf-lib` (Worker-compatible).
- Public `/verify/$number` page — minimal verification (name, photo thumbnail, status, joined date).
- Member-facing `/portal` (under `_authenticated`, no admin role required) — view profile, status, payment status, download card, edit limited fields (phone, location).

## Technical notes
- Stack: keep TanStack Start + `createServerFn`, Supabase, shadcn. No new routing libs.
- Rich text: start with markdown (`react-markdown` + `dompurify`); upgrade to TipTap on request.
- PDF: `pdf-lib` (pure JS, Worker-safe). QR: `qrcode` package (pure JS).
- File uploads: client → signed upload URL via server fn → stored path in DB; serving via signed-URL server fn.
- All forms use Zod; destructive actions use `AlertDialog` confirms; feedback via `sonner` toasts.

## What I'll need from you (only if relevant)
1. M-Pesa Paybill/Till number + account name to display on the payment screen (otherwise I'll use placeholders you can edit in Settings).
2. Should I roll out **all 4 phases in this turn**, or stop after Phase 1+2 for review? (Phases 3 & 4 are large — doing them all in one shot risks build errors that take longer to diagnose. My recommendation: ship Phase 1+2 now, then 3, then 4.)

Reply with the Paybill details (or "use placeholders") and your preferred rollout, and I'll start.