import { createClient, SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | undefined

// Keep the responsible user's verified session separate from the legacy login.
export function createIndicatorsClient() {
    if (!client) {
        client = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { auth: { storageKey: 'moldapp-indicators-auth' } },
        )
    }
    return client
}
