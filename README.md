# Sri Bairavar Tours & Travels — Phase 1 Starter

Mobile-first owner dashboard starter for booking management.

## Included
- Next.js + TypeScript starter
- Supabase email/password sign-in
- Booking register and create-booking form
- Tamil/English interface toggle
- Supabase SQL schema with owner-level Row Level Security

## Setup
1. Create a Supabase project.
2. In Supabase SQL Editor, run `supabase/schema.sql`.
3. Create your owner account manually in Supabase Authentication.
4. Copy `.env.example` to `.env.local` and fill in your Supabase project URL and publishable/anon key.
5. Run `npm install` then `npm run dev`.

## Important
This is a Phase 1 starter, not a production-complete business system. Booking edits, vendor/vehicle assignment screens, payment and expense entry, quotation PDFs, reporting, audit workflows, backups, and deployment still need implementation and testing. Never put a Supabase service-role key in browser code. Disable public sign-ups and protect the admin account.
