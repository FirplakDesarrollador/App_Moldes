import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://vuiuorjzonpyobpelyld.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXVvcmp6b25weW9icGVseWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4MDM2OTksImV4cCI6MjAyMjM3OTY5OX0.ARDJuGYox9CY3K8z287nEEFBmWVLTs6yCLkHHeMMTKw'
)

async function run() {
    console.log("--- Searching for any table with 'planta' or 'maestra' ---")
    const searchTerms = ['planta', 'maestra', 'master', 'referencia']
    // We can't query information_schema easily via .from()
    // but maybe there's a view?
    
    // Let's try to find if 'plantas' exists
    for (const t of ['plan_moldes', 'maestro_moldes', 'base_maestra_moldes', 'moldes_maestro']) {
        const { data, error } = await supabase.from(t).select('*').limit(1)
        if (!error) console.log(`Table "${t}" exists!`)
    }
}
run()
