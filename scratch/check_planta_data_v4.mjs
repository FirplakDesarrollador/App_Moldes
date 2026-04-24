import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://vuiuorjzonpyobpelyld.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXVvcmp6b25weW9icGVseWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4MDM2OTksImV4cCI6MjAyMjM3OTY5OX0.ARDJuGYox9CY3K8z287nEEFBmWVLTs6yCLkHHeMMTKw'
)

async function run() {
    console.log("--- Checking for any row with planta in 'planta_moldes' ---")
    const { data, error, count } = await supabase.from('planta_moldes').select('*', { count: 'exact' })
    if (error) console.error(error)
    console.log("Total rows in planta_moldes:", count)
    if (data && data.length > 0) {
        console.log("First 5 rows:", JSON.stringify(data.slice(0, 5), null, 2))
    }
}
run()
