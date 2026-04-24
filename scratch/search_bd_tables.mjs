import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://vuiuorjzonpyobpelyld.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXVvcmp6b25weW9icGVseWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4MDM2OTksImV4cCI6MjAyMjM3OTY5OX0.ARDJuGYox9CY3K8z287nEEFBmWVLTs6yCLkHHeMMTKw'
)

async function run() {
    console.log("--- Searching for tables starting with BD_ ---")
    const commonNames = ['BD_planta_moldes', 'BD_maestra_moldes', 'BD_moldes_maestra', 'BD_referencias']
    for (const name of commonNames) {
        const { data, error } = await supabase.from(name).select('*').limit(1)
        if (!error && data) console.log(`FOUND: ${name}`)
    }
}
run()
