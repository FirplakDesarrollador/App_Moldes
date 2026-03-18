import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabase = createClient(
    'https://vuiuorjzonpyobpelyld.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXVvcmp6b25weW9icGVseWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4MDM2OTksImV4cCI6MjAyMjM3OTY5OX0.ARDJuGYox9CY3K8z287nEEFBmWVLTs6yCLkHHeMMTKw'
)

async function inspect() {
    const { data: d1 } = await supabase.from('base_datos_moldes').select('*').limit(1)
    const { data: d2 } = await supabase.from('migracion_moldes').select('*').limit(1)
    
    fs.writeFileSync('tmp/schemas.json', JSON.stringify({
        base_datos: d1 ? Object.keys(d1[0] || {}) : [],
        migracion: d2 ? Object.keys(d2[0] || {}) : []
    }, null, 2))
}

inspect()
