import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
    console.log('Checking BD_moldes schema...')
    const { data, error } = await supabase
        .from('BD_moldes')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Error fetching data:', error)
        return
    }

    if (data && data.length > 0) {
        console.log('Sample record keys:', Object.keys(data[0]))
        console.log('Sample ID value:', data[0].id)
    } else {
        console.log('Table is empty.')
    }
}

checkSchema()
