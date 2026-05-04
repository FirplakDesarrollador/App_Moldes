import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
    console.log('Checking moldes table data...')
    const { data, error } = await supabase
        .from('moldes')
        .select('serial, nombre_articulo, tipo_molde_id')
        .limit(5)

    if (error) {
        console.error('Error fetching data:', error)
        return
    }

    console.log('Existing records:')
    data.forEach(r => {
        console.log(`Serial: ${r.serial}, Name: ${r.nombre_articulo}, TypeID: ${r.tipo_molde_id}`)
    })
}

checkSchema()
