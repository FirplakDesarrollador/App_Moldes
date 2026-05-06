import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDefects() {
    const { data, error } = await supabase
        .from('BD_moldes')
        .select('"DEFECTOS A REPARAR"')
        .not('"DEFECTOS A REPARAR"', 'is', null)
        .limit(20)

    if (error) {
        console.error(error)
        return
    }

    console.log('Sample defects:')
    data.forEach(r => console.log(`- ${r['DEFECTOS A REPARAR']}`))
}

checkDefects()
