import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://vuiuorjzonpyobpelyld.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXVvcmp6b25weW9icGVseWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4MDM2OTksImV4cCI6MjAyMjM3OTY5OX0.ARDJuGYox9CY3K8z287nEEFBmWVLTs6yCLkHHeMMTKw'
)

async function run() {
    const prefixes = ['', 'bd_', 'base_', 'db_']
    const cores = ['planta_molde', 'planta_moldes', 'molde_planta', 'moldes_planta', 'plantas', 'planta']
    
    for (const p of prefixes) {
        for (const c of cores) {
            const tableName = p + c
            const { data, error } = await supabase.from(tableName).select('*').limit(1)
            if (!error && data) {
                console.log(`FOUND: "${tableName}" with data!`)
            }
        }
    }
}
run()
