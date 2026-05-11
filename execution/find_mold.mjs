import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

const envConfig = dotenv.parse(fs.readFileSync('.env'))
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function findMold() {
    console.log('--- Searching for Mold 0175-40 ---')
    const { data, error } = await supabase
        .from('BD_moldes')
        .select('*')
        .ilike('CODIGO MOLDE', '%0175-40%')
    
    if (error) {
        console.error('Error:', error.message)
        return
    }

    console.log('Results:', JSON.stringify(data, null, 2))
}

findMold()
