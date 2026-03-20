// PV_MOLDES V2.4
import { createBrowserClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

export function createClientTH() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_TH_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_TH_ANON_KEY!
    )
}
