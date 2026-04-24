import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://vuiuorjzonpyobpelyld.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXVvcmp6b25weW9icGVseWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4MDM2OTksImV4cCI6MjAyMjM3OTY5OX0.ARDJuGYox9CY3K8z287nEEFBmWVLTs6yCLkHHeMMTKw'
)

async function run() {
    console.log("--- Searching for 'MS' or 'FV' in any column of BD_moldes or moldes ---")
    const { data: b1 } = await supabase.from('BD_moldes').select('*').or('Título.ilike.% MS %,Título.ilike.% FV %,Título.ilike.%(MS)%,Título.ilike.%(FV)%').limit(5)
    console.log("BD_moldes hints:", b1?.length || 0)
    
    const { data: b2 } = await supabase.from('moldes').select('*').or('nombre_articulo.ilike.% MS %,nombre_articulo.ilike.% FV %,descripcion_molde.ilike.%MS%,descripcion_molde.ilike.%FV%').limit(5)
    console.log("moldes hints:", b2?.length || 0)
}
run()
