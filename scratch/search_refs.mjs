import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://vuiuorjzonpyobpelyld.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXVvcmp6b25weW9icGVseWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4MDM2OTksImV4cCI6MjAyMjM3OTY5OX0.ARDJuGYox9CY3K8z287nEEFBmWVLTs6yCLkHHeMMTKw'
)

async function run() {
    console.log("--- Searching for any table with 'numero_de_serie' column ---")
    const { data: b1 } = await supabase.from('moldes').select('*').limit(1)
    console.log("moldes rows:", b1?.length || 0)
    
    // Let's try to query 'referencias'
    const { data: r1 } = await supabase.from('referencias').select('*').limit(1)
    if (r1) console.log("referencias exists")
    
    // Let's try to find if 'plantas' is another name
    const { data: p1 } = await supabase.from('plantas').select('*').limit(1)
    if (p1) console.log("plantas exists")
}
run()
