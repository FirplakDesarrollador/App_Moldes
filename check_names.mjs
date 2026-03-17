import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://vuiuorjzonpyobpelyld.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXVvcmp6b25weW9icGVseWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4MDM2OTksImV4cCI6MjAyMjM3OTY5OX0.ARDJuGYox9CY3K8z287nEEFBmWVLTs6yCLkHHeMMTKw'
)

async function listTables() {
    // This is a trick to list some tables by attempting a generic query, 
    // or we can use the supabase client to fetch types if available.
    // However, the best way is to try the names we suspect.
    const suspectNames = [
        'base_datos_moldes',
        'Base_datos_moldes',
        'Base_datos_moldes_dinámica',
        'defectos_moldes',
        'Defectos moldes',
        'Datos personal completa',
        'pv_moldes'
    ]

    for (const name of suspectNames) {
        const { count, error } = await supabase.from(name).select('*', { count: 'exact', head: true })
        if (!error) {
            console.log(`- ${name}: Found (${count} records)`)
        } else {
            console.log(`- ${name}: Not found or error: ${error.message}`)
        }
    }
}

listTables()
