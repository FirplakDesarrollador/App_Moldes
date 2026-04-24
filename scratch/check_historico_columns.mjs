import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://vuiuorjzonpyobpelyld.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXVvcmp6b25weW9icGVseWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4MDM2OTksImV4cCI6MjAyMjM3OTY5OX0.ARDJuGYox9CY3K8z287nEEFBmWVLTs6yCLkHHeMMTKw'
)

async function run() {
    console.log("--- Inspecting base_datos_historico_moldes ---")
    const { data, error } = await supabase.from('base_datos_historico_moldes').select('*').limit(1)
    if (error) {
        console.error("Error:", error.message)
        return
    }
    if (data && data.length > 0) {
        console.log("Columns:", Object.keys(data[0]).join(', '))
        console.log("Sample:", JSON.stringify(data[0], null, 2))
    } else {
        console.log("No data found")
    }
}
run()
