import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://vuiuorjzonpyobpelyld.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXVvcmp6b25weW9icGVseWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4MDM2OTksImV4cCI6MjAyMjM3OTY5OX0.ARDJuGYox9CY3K8z287nEEFBmWVLTs6yCLkHHeMMTKw'
)

async function run() {
    console.log("--- Searching for any table with 'planta' column ---")
    // information_schema.columns is usually accessible if RLS is not blocking the schema
    const { data, error } = await supabase.from('information_schema.columns').select('table_name').eq('column_name', 'planta')
    if (error) {
        console.log("information_schema restricted, trying common tables...")
        for (const t of ['tabla_maestra_moldes', 'base_datos_maestra', 'planta_moldes_v2', 'Planta_Moldes']) {
            const { data: d } = await supabase.from(t).select('*').limit(1)
            if (d) console.log(`Found data in ${t}`)
        }
    } else {
        console.log("Tables with 'planta' column:", data.map(d => d.table_name).join(', '))
    }
}
run()
