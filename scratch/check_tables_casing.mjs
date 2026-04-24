import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://vuiuorjzonpyobpelyld.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXVvcmp6b25weW9icGVseWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4MDM2OTksImV4cCI6MjAyMjM3OTY5OX0.ARDJuGYox9CY3K8z287nEEFBmWVLTs6yCLkHHeMMTKw'
)

async function run() {
    const list = [
        'PLANTAS_MOLDES', 'PLANTA_MOLDES', 'MOLDES_PLANTA', 
        'DB_PLANTA_MOLDES', 'BD_PLANTA_MOLDES', 'Base_Maestra_Moldes'
    ]
    for (const name of list) {
        const { data, count, error } = await supabase.from(name).select('*', { count: 'exact', head: true })
        if (!error) {
            console.log(`Table "${name}" exists with ${count} rows.`)
        }
    }
}
run()
