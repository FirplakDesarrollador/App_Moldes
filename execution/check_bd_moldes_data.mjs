import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

const envConfig = dotenv.parse(fs.readFileSync('.env'))
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkStates() {
    console.log('--- Checking Unique States in BD_moldes ---')
    const { data, error } = await supabase
        .from('BD_moldes')
        .select('ESTADO')
    
    if (error) {
        console.error('Error:', error.message)
        return
    }

    const states = [...new Set(data.map(d => d.ESTADO))]
    console.log('Unique States found:', states)
    
    // Also check first 5 rows to see structure
    const { data: rows } = await supabase.from('BD_moldes').select('*').limit(5)
    console.log('Sample Rows:', JSON.stringify(rows, null, 2))
}

checkStates()
