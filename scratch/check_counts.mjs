import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://vuiuorjzonpyobpelyld.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXVvcmp6b25weW9icGVseWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4MDM2OTksImV4cCI6MjAyMjM3OTY5OX0.ARDJuGYox9CY3K8z287nEEFBmWVLTs6yCLkHHeMMTKw'
)

async function run() {
    console.log("--- Checking total count in BD_moldes ---")
    const { count, error } = await supabase.from('BD_moldes').select('*', { count: 'exact', head: true })
    if (error) {
        console.error("Error:", error.message)
        return
    }
    console.log("Total count:", count)

    console.log("\n--- Checking count per state ---")
    const { data } = await supabase.from('BD_moldes').select('ESTADO')
    const counts = {}
    data.forEach(r => {
        counts[r.ESTADO] = (counts[r.ESTADO] || 0) + 1
    })
    console.log("States distribution:", counts)
}
run()
