import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://vuiuorjzonpyobpelyld.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXVvcmp6b25weW9icGVseWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4MDM2OTksImV4cCI6MjAyMjM3OTY5OX0.ARDJuGYox9CY3K8z287nEEFBmWVLTs6yCLkHHeMMTKw'
)

async function inspectSchema() {
    const r1 = await supabase.from('base_datos_moldes').select('*').limit(1)
    if (r1.data && r1.data[0]) {
        console.log("base_datos_moldes Columns:", Object.keys(r1.data[0]).join(', '))
        console.log("base_datos_moldes sample values:")
        console.log(JSON.stringify(r1.data[0], null, 2))
    }

    const r2 = await supabase.from('Defectos moldes').select('*').limit(1)
    if (r2.data && r2.data[0]) {
        console.log("\nDefectos moldes Columns:", Object.keys(r2.data[0]).join(', '))
        console.log("Defectos moldes sample values:")
        console.log(JSON.stringify(r2.data[0], null, 2))
    }
}

inspectSchema()
