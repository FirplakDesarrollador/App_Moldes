import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://vuiuorjzonpyobpelyld.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXVvcmp6b25weW9icGVseWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4MDM2OTksImV4cCI6MjAyMjM3OTY5OX0.ARDJuGYox9CY3K8z287nEEFBmWVLTs6yCLkHHeMMTKw'
)

async function run() {
    console.log("--- Fetching unique states in BD_moldes ---")
    const { data, error } = await supabase.from('BD_moldes').select('ESTADO')
    if (error) {
        console.error("Error:", error.message)
        return
    }
    const states = [...new Set(data.filter(r => r.ESTADO).map(r => r.ESTADO))]
    console.log("Unique states:", states)

    console.log("\n--- Fetching unique repair types in BD_moldes ---")
    const { data: types, error: err2 } = await supabase.from('BD_moldes').select('"Tipo de reparacion"')
    if (err2) {
        console.error("Error:", err2.message)
        return
    }
    const rt = [...new Set(types.filter(r => r['Tipo de reparacion']).map(r => r['Tipo de reparacion']))]
    console.log("Unique repair types:", rt)
}
run()
