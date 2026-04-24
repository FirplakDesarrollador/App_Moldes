import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://vuiuorjzonpyobpelyld.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXVvcmp6b25weW9icGVseWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4MDM2OTksImV4cCI6MjAyMjM3OTY5OX0.ARDJuGYox9CY3K8z287nEEFBmWVLTs6yCLkHHeMMTKw'
)

async function run() {
    console.log("--- Inspecting Materia_prima_moldes ---")
    const { data: mp } = await supabase.from('Materia_prima_moldes').select('*').limit(1)
    if (mp && mp[0]) {
        console.log(JSON.stringify(mp[0], null, 2))
    } else {
        console.log("No data found in Materia_prima_moldes")
    }

    console.log("\n--- Inspecting Entradas_salidas_MP ---")
    const { data: es } = await supabase.from('Entradas_salidas_MP').select('*').limit(1)
    if (es && es[0]) {
        console.log(JSON.stringify(es[0], null, 2))
    } else {
        console.log("No data found in Entradas_salidas_MP")
    }
}
run()
