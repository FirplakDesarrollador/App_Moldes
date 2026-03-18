import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://vuiuorjzonpyobpelyld.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXVvcmp6b25weW9icGVseWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4MDM2OTksImV4cCI6MjAyMjM3OTY5OX0.ARDJuGYox9CY3K8z287nEEFBmWVLTs6yCLkHHeMMTKw'
)

async function inspect() {
    const { data: d1, error: e1, count: c1 } = await supabase.from('base_datos_moldes').select('*', { count: 'exact', head: false }).limit(1)
    console.log('base_datos_moldes error:', e1, 'count:', c1)
    if (d1 && d1.length > 0) console.log('Cols:', Object.keys(d1[0]).join(', '))

    const { data: d2, error: e2, count: c2 } = await supabase.from('migracion_moldes').select('*', { count: 'exact', head: false }).limit(1)
    console.log('migracion_moldes error:', e2, 'count:', c2)
    if (d2 && d2.length > 0) console.log('Cols:', Object.keys(d2[0]).join(', '))
}

inspect()
