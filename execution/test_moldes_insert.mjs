import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testInsert() {
    console.log('Testing insert into moldes...')
    const { data, error } = await supabase
        .from('moldes')
        .insert([{ 
            serial: 'TEST-INSERT', 
            nombre_articulo: 'Test Insert', 
            estado: 'Disponible' 
        }])
        .select()

    if (error) {
        console.error('Insert Error:', error.message)
    } else {
        console.log('Insert Success:', data[0])
        // Cleanup
        await supabase.from('moldes').delete().eq('serial', 'TEST-INSERT')
    }
}

testInsert()
