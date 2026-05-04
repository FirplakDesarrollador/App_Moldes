import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

// Load from 'env' file as seen in file list
const envConfig = dotenv.parse(fs.readFileSync('.env'))
for (const k in envConfig) {
  process.env[k] = envConfig[k]
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials missing in env file')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectProject() {
    console.log(`--- Inspecting Supabase Project: ${supabaseUrl} ---`)
    
    // Attempt to list tables using a query that might fail if RLS is tight,
    // but often we can see some info or use RPC if defined.
    // Standard way to get schema info in Supabase/Postgres:
    const { data, error } = await supabase.rpc('get_schema_info') 
    
    if (error) {
        console.log('RPC get_schema_info failed, trying direct query on public tables...')
        // Try common tables we know exist from previous turns
        const tables = ['BD_moldes', 'moldes', 'planta_moldes', 'base_datos_historico_moldes']
        for (const table of tables) {
            const { count, error: tableError } = await supabase.from(table).select('*', { count: 'exact', head: true })
            if (tableError) {
                console.log(`Table ${table}: Not accessible or doesn't exist (${tableError.message})`)
            } else {
                console.log(`Table ${table}: Accessible, count = ${count}`)
            }
        }
    } else {
        console.log('Schema Info:', data)
    }
}

inspectProject()
