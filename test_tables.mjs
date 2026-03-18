import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://vuiuorjzonpyobpelyld.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXVvcmp6b25weW9icGVseWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4MDM2OTksImV4cCI6MjAyMjM3OTY5OX0.ARDJuGYox9CY3K8z287nEEFBmWVLTs6yCLkHHeMMTKw'
)

async function checkTables() {
    const tableNames = [
        'Datos personal completa',
        'Personal',
        'Personal app moldes',
        'Base_datos_personal',
        'Base_datos_personal_dinámica',
        'Personal_completa',
        'Hoja1',
        'moldes'
    ]

    for (const name of tableNames) {
        const { count, error } = await supabase.from(name).select('*', { count: 'exact', head: true })
        if (error) {
            console.log(`Table '${name}': Error (${error.message})`)
        } else {
            console.log(`Table '${name}': Count = ${count}`)
        }
    }
}

checkTables()
