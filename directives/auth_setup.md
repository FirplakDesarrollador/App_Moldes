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
