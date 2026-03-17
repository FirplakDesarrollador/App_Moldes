import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://vuiuorjzonpyobpelyld.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXVvcmp6b25weW9icGVseWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4MDM2OTksImV4cCI6MjAyMjM3OTY5OX0.ARDJuGYox9CY3K8z287nEEFBmWVLTs6yCLkHHeMMTKw'
)

async function checkData() {
    const { data, error } = await supabase.from('base_datos_moldes').select('*').limit(5)
    if (error) {
        console.error(error)
        return
    }
    console.log("Sample rows:")
    data.forEach(row => {
        console.log({
            ID: row.ID,
            Nombre: row.Nombre,
            "FECHA ENTRADA": row["FECHA ENTRADA"],
            "FECHA ESPERADA": row["FECHA ESPERADA"]
        })
    })
}

checkData()
