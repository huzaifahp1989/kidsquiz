# AGENTS.md

## Cursor Cloud specific instructions

### What this is
Single Next.js 16 (App Router) app — the "Islamic Kids Learning Platform" / "Kids Zone". The frontend (React 19, Tailwind) and backend (API routes under `src/app/api/`) both live in this one app. There is no separate backend service. Persistent data/auth/storage is hosted **Supabase** (remote); there is no local Supabase/Docker setup in this repo. Email (Resend/Mailchimp/Nodemailer) is optional and degrades gracefully.

### Commands (defined in `package.json`)
- Dev server: `npm run dev` (Next.js + Turbopack, binds `0.0.0.0:3000`).
- Lint: `npm run lint`.
- Build: `npm run build` (production build).
- No automated test suite exists. Root `test-*.js` files are ad-hoc manual debug scripts, not a test runner. `TESTING_GUIDE.md` describes manual QA.

### Non-obvious caveats
- **Env vars are not required to start the dev server.** Without `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `src/lib/supabase.ts` falls back to a placeholder client: the app boots and all static/client-side content works (games, quizzes, Quran/Hadith pages), but auth (sign in/up), points, leaderboards, and other DB-backed features will not function. To exercise those, set the Supabase vars in a `.env.local` (see `.env.example`) pointing at a real Supabase project with the schema applied (root `*.sql` files + `supabase/migrations/`).
- **`npm run build` fails without `SUPABASE_SERVICE_ROLE_KEY`.** `src/lib/supabase-admin.ts` throws `SUPABASE_SERVICE_ROLE_KEY is required in production...` when `NODE_ENV=production` (which `next build` sets). This is by design. Dev mode (`next dev`) only warns and falls back to the anon key, so use `npm run dev` for development. A production build requires that secret to be set.
- **Lint has a pre-existing error** in `src/components/SurveyPopup.tsx` (`react-hooks/set-state-in-effect`). `npm run lint` exits non-zero because of it; it is unrelated to environment setup.
- Supabase health can be checked at `GET /api/health/supabase` once the server is running.
