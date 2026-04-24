import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://vuiuorjzonpyobpelyld.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXVvcmp6b25weW9icGVseWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4MDM2OTksImV4cCI6MjAyMjM3OTY5OX0.ARDJuGYox9CY3K8z287nEEFBmWVLTs6yCLkHHeMMTKw'
)

async function run() {
    console.log("--- Checking planta_moldes data ---")
    const { data, count, error } = await supabase.from('planta_moldes').select('*', { count: 'exact' })
    if (error) {
        console.error("Error:", error.message)
    } else {
        console.log("Total rows:", count)
        if (data && data.length > 0) {
            console.log("Sample:", JSON.stringify(data.slice(0, 5), null, 2))
        } else {
            console.log("Table is STILL EMPTY.")
        }
    }
}
run()
