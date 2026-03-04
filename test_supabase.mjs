import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://vuiuorjzonpyobpelyld.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXVvcmp6b25weW9icGVseWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4MDM2OTksImV4cCI6MjAyMjM3OTY5OX0.ARDJuGYox9CY3K8z287nEEFBmWVLTs6yCLkHHeMMTKw'
)

async function test() {
    console.log("Checking tables...")
    const r1 = await supabase.from('Personal app moldes').select('*', { count: 'exact', head: true })
    console.log("Personal app moldes:", r1.error ? r1.error.message : `Count: ${r1.count}`)

    const r2 = await supabase.from('Datos personal completa').select('*', { count: 'exact', head: true })
    console.log("Datos personal completa:", r2.error ? r2.error.message : `Count: ${r2.count}`)

    if (!r1.error) {
        const { data } = await supabase.from('Personal app moldes').select('Nombre').limit(1)
        console.log("Personal sample:", data)
    }
}

test()
