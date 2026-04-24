import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://vuiuorjzonpyobpelyld.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXVvcmp6b25weW9icGVseWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4MDM2OTksImV4cCI6MjAyMjM3OTY5OX0.ARDJuGYox9CY3K8z287nEEFBmWVLTs6yCLkHHeMMTKw'
)

async function run() {
    // Try to list tables via a common hack: querying information_schema if enabled for anon
    const { data: tables, error } = await supabase.from('information_schema.tables').select('table_name').eq('table_schema', 'public')
    if (error) {
        console.log("Cannot access information_schema directly via .from()")
        // Try to query 'planta_molde' (singular)
        const { data: t1 } = await supabase.from('planta_molde').select('*').limit(1)
        if (t1) console.log("planta_molde exists")
        
        const { data: t2 } = await supabase.from('planta_moldes').select('*').limit(1)
        if (t2) console.log("planta_moldes exists and has data:", t2.length)
        
        const { data: t3 } = await supabase.from('moldes').select('planta').limit(1)
        if (t3) console.log("moldes has 'planta' column")
    } else {
        console.log("Tables:", tables.map(t => t.table_name).join(', '))
    }
}
run()
