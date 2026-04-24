import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://vuiuorjzonpyobpelyld.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXVvcmp6b25weW9icGVseWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4MDM2OTksImV4cCI6MjAyMjM3OTY5OX0.ARDJuGYox9CY3K8z287nEEFBmWVLTs6yCLkHHeMMTKw'
)

async function run() {
    console.log("--- Listing all tables via RPC if available or common query ---")
    // Note: anonymously we can't see the full schema easily unless there's a view,
    // but we can try to query common names or meta tables if accessible.
    
    // Instead of listing tables (which might be restricted), let's check the 'moldes' table columns.
    // Maybe the information is already in 'moldes' or 'BD_moldes' under a different name.
    
    console.log('\n--- BD_moldes columns ---')
    const { data: bdData } = await supabase.from('BD_moldes').select('*').limit(1)
    if (bdData && bdData.length > 0) {
        console.log("Columns:", Object.keys(bdData[0]).join(', '))
    }
    
    console.log('\n--- moldes columns (Master table) ---')
    const { data: moldesMasterData } = await supabase.from('moldes').select('*').limit(1)
    if (moldesMasterData && moldesMasterData.length > 0) {
        console.log("Columns:", Object.keys(moldesMasterData[0]).join(', '))
    }
}
run()
