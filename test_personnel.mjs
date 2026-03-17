import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testPersonnel() {
    console.log('Querying "Datos personal completa"...')
    const { data, error } = await supabase
        .from('Datos personal completa')
        .select('NombreCompleto, Estado, ID, Cedula')
        .limit(10)

    if (error) {
        console.error('Error fetching personnel:', error)
        return
    }

    console.log(`Found ${data.length} records.`)
    data.forEach(p => {
        console.log(`- ${p.NombreCompleto} [${p.Estado}] ID: ${p.ID} Cedula: ${p.Cedula}`)
    })
}

testPersonnel()
