import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkMold() {
    const code = '01234'
    console.log(`Checking mold ${code}...`)

    const { data: bdData } = await supabase
        .from('BD_moldes')
        .select('*')
        .ilike('CODIGO MOLDE', code)
    
    console.log('Results in BD_moldes:', bdData?.length || 0)
    if (bdData && bdData.length > 0) {
        console.log('BD_moldes record:', bdData[0])
    }

    const { data: moldesData } = await supabase
        .from('moldes')
        .select('*')
        .ilike('serial', code)

    console.log('Results in moldes:', moldesData?.length || 0)
    if (moldesData && moldesData.length > 0) {
        console.log('moldes record:', moldesData[0])
    }
}

checkMold()
