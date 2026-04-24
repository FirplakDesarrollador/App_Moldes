import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://vuiuorjzonpyobpelyld.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXVvcmp6b25weW9icGVseWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4MDM2OTksImV4cCI6MjAyMjM3OTY5OX0.ARDJuGYox9CY3K8z287nEEFBmWVLTs6yCLkHHeMMTKw'
)

async function run() {
    console.log("--- Fetching active records in BD_moldes ---")
    const { data, error } = await supabase.from('BD_moldes')
        .select('*')
        .not('ESTADO', 'in', '("Entregado","Destruido","Baja","Activo")')
        .limit(10)
        
    if (error) {
        console.error("Error:", error.message)
        return
    }
    console.log("Found:", data.length, "active records")
    if (data.length > 0) {
        console.log("Sample active record:", JSON.stringify(data[0], null, 2))
    }
}
run()
