import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
    console.log('Checking BD_moldes schema...')
    const { data, error } = await supabase
        .from('BD_moldes')
        .select('id, ID, "CODIGO MOLDE"')
        .order('id', { ascending: false })
        .limit(5)

    if (error) {
        console.error('Error fetching data:', error)
        return
    }

    console.log('Recent records:')
    data.forEach(r => {
        console.log(`id (lowercase): ${r.id}, ID (uppercase): ${r.ID}, Code: ${r["CODIGO MOLDE"]}`)
    })
}

checkSchema()
