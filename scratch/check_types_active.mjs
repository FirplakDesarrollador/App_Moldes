import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://vuiuorjzonpyobpelyld.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXVvcmp6b25weW9icGVseWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4MDM2OTksImV4cCI6MjAyMjM3OTY5OX0.ARDJuGYox9CY3K8z287nEEFBmWVLTs6yCLkHHeMMTKw'
)

async function run() {
    console.log("--- Checking repair types of active records ---")
    const { data } = await supabase.from('BD_moldes')
        .select('"Tipo de reparacion"')
        .not('ESTADO', 'in', '("Entregado","Destruido","Baja","Activo")')
        
    const counts = {}
    data.forEach(r => {
        const t = r['Tipo de reparacion'] || 'NULL'
        counts[t] = (counts[t] || 0) + 1
    })
    console.log("Repair types distribution:", counts)
}
run()
