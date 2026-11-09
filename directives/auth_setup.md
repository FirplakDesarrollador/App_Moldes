PV_MOLDES V2.4
# Directive: Authentication Setup

## Goal
Manage the authentication flow and Supabase integration for the MoldApp.

## Inputs
- Supabase Project URL
- Supabase Anon Key

## Tools/Scripts
- `execution/verify_supabase_connection.py`: Verifies that the Supabase instance is accessible.

## Flow
1. Verify credentials in `.env`.
2. Run `execution/verify_supabase_connection.py`.
3. If successful, proceed with Next.js development.
4. If failure, check `.env` and Supabase dashboard status.

## Edge Cases
- Invalid API Key: Script will return 401/403.
- Network Timeout: Check local internet and Supabase status page.

## Daily special-repair indicator access

- Next.js reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  from `.env.local` locally and environment variables in Vercel. A present but
  empty `.env.local` does not configure the connection. Do not log key values.
- The legacy employee selection is not a verified Supabase Auth session.
  Saving daily special-repair indicators requires an additional individual
  email/password sign-in inside the indicator panel.
- Only Sara Aguilar and Brian Sanchez are approved to save. Create their real
  accounts under Supabase Authentication, then run
  `execution/configure_indicator_access.sql` and
  `execution/authorize_indicator_responsibles.sql` in that order. Replace the
  emails in the latter only when the approved accounts change. Confirmed
  accounts: `sara.aguilar@firplak.com` and `brian.sanchez@firplak.com`.
- `responsables_indicadores_moldes` maps approved Auth user IDs to names. Only
  database administrators can modify that list; each account can read its own
  membership. RLS enforces access even if browser state is changed.
- The authorization uses an isolated client/storage key, and is cleared when
  switching employee profiles or logging out. Never put a service-role key in
  public variables or browser code.
- The daily source currently represents PRINCIPAL; do not label this dataset
  with the selected employee's plant without introducing a real source filter.
- The database trigger only attributes writes and timestamps; KPI equations
  remain in the app. Daily records are saved on explicit consultation, not by
  a scheduled job. Validate with `node execution/test_daily_indicators.cjs`
  and `npx tsc --noEmit`. Live RLS verification needs the configured project
  and actual Auth accounts, including a denied account.
