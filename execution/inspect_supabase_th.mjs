import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

const envConfig = dotenv.parse(fs.readFileSync('.env'))
for (const k in envConfig) {
  process.env[k] = envConfig[k]
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_TH_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_TH_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase TH credentials missing in .env file')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectProject() {
    console.log(`--- Inspecting Supabase TH Project: ${supabaseUrl} ---`)
    
    // Attempt to list tables using standard Postgres catalogs if possible
    // or just try common names
    const { data, error } = await supabase.from('empleados').select('*', { count: 'exact', head: true })
    
    if (error) {
        console.log(`Table 'empleados': Not accessible or doesn't exist (${error.message})`)
    } else {
        console.log(`Table 'empleados': Accessible, count = ${data?.length || 0}`)
        // Wait, select head: true returns count only usually, but let's see
    }
}

inspectProject()
