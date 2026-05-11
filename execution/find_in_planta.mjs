import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

const envConfig = dotenv.parse(fs.readFileSync('.env'))
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function findInPlanta() {
    console.log('--- Searching for 0175-40 in planta_moldes ---')
    const { data, error } = await supabase
        .from('planta_moldes')
        .select('*')
        .ilike('numero_de_serie', '%0175-40%')
    
    if (error) {
        console.error('Error:', error.message)
        return
    }

    console.log('Results:', JSON.stringify(data, null, 2))
}

findInPlanta()
