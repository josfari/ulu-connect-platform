# The Ulu We Want SHG — Community Platform

A production-ready website and admin platform for the Kenyan community self-help group, built for trust, transparency, and impact.

## Platform Note (Tech Stack)

Lovable builds on **TanStack Start (React + TypeScript) + Tailwind CSS** with **Lovable Cloud** providing the PostgreSQL database, secure authentication, file storage, and server-side logic — fully managed, no Vercel/Render/Prisma setup needed. This delivers everything in your spec (role-based auth, protected APIs, file uploads, database) as one deployable app.

## Phase 1 — Design System & Public Website

**Brand**: Green (growth) + deep blue (trust) + warm orange/yellow accents (youth energy). Clean cards, rounded sections, generous white space, subtle animations, premium NGO feel. Mobile-first.

**Pages**:
- **Home** — hero ("Empowering Communities, Transforming Lives."), CTA buttons (Join Us / View Projects / Contact), impact stats (members, projects, youth reached, funds mobilized), featured projects, about preview, news preview, community voices, final CTA banner
- **About** — who we are, mission, vision, core values (Unity, Transparency, Empowerment, Accountability, Innovation, Service), history, community focus, leadership overview, long-term goals
- **Projects** — dynamic project cards (image, status badge, progress bar, category, impact summary, dates) seeded with Starlink Connectivity, PA System Rental, and Table Banking projects
- **Leadership** — Chairperson, Secretary, Treasurer, Project Coordinator, Youth Rep, Media Coordinator profiles with photos, bios, role descriptions
- **Members** — public directory of approved members + registration form (name, role, category, optional private phone/email, photo)
- **Media Desk** — news, announcements, stories with categories, tags, featured posts, photo gallery
- **Contact** — contact form (saved to database), location section with map embed, social links, newsletter signup

Generated professional photography-style imagery for hero, projects, and leadership placeholders. SEO metadata, Open Graph tags, sitemap, robots.txt on every page.

## Phase 2 — Backend & Database (Lovable Cloud)

**Tables**: profiles, user_roles (super_admin / admin / editor), members, projects, staff, posts, categories, tags, gallery_images, contributions, loans, repayments, contact_messages, newsletter_subscribers.

**Security**: Row-level security on every table, role checks via secure server-side functions, password hashing handled by managed auth, input validation with Zod, private financial data visible only to admins, member contact info kept private unless opted in.

**Storage**: image upload buckets for projects, staff photos, member photos, and gallery.

## Phase 3 — Admin Dashboard

Secure login + role-based dashboard at `/admin`:
- **Overview** — stats cards: total members, pending registrations, active/completed projects, total posts, contributions, loans issued, repayments
- **Projects** — full CRUD with image upload, status, progress, impact reports
- **Members** — approve pending registrations, edit, search/filter, status management
- **Staff** — manage leadership profiles
- **Media** — create/edit posts (rich text), gallery uploads, drafts vs published, categories/tags
- **Finance (Table Banking)** — record contributions, loans, repayments; member balances; summaries; filter by member/date/status; CSV export
- **Users & Roles** — Super Admin can assign Admin/Editor roles
- **Messages** — view contact form submissions and newsletter subscribers

Editors see only Media; Admins see everything except user-role management; Super Admins see all.

## Build Order

1. Enable Lovable Cloud + database schema + seed data
2. Design system + public pages with generated imagery
3. Auth (email/password + Google) and admin dashboard
4. Financial module + CSV export
5. SEO, sitemap, polish

This is a large build — I'll deliver it across a few iterations, starting with the public website and backend foundation.