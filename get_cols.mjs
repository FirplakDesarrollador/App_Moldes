import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://vuiuorjzonpyobpelyld.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXVvcmp6b25weW9icGVseWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4MDM2OTksImV4cCI6MjAyMjM3OTY5OX0.ARDJuGYox9CY3K8z287nEEFBmWVLTs6yCLkHHeMMTKw'
)

async function run() {
    const { data } = await supabase.from('base_datos_moldes').select('*').limit(1)
    if (data && data[0]) {
        console.log("COLUMNS_BASE_DATOS_MOLDES=" + Object.keys(data[0]).join(','))
    }

    const { data: data2 } = await supabase.from('Defectos moldes').select('*').limit(1)
    if (data2 && data2[0]) {
        console.log("COLUMNS_DEFECTOS_MOLDES=" + Object.keys(data2[0]).join(','))
    }
}
run()
