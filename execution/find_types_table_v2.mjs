import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function findTable() {
    console.log('Searching for tables...')
    const guesses = ['tipos_moldes', 'Tipo_molde', 'moldes_tipos']
    for (const g of guesses) {
        const { data, error } = await supabase.from(g).select('*').limit(1)
        if (error) {
            console.log(`Table ${g} NOT found: ${error.message}`)
        } else {
            console.log(`Table ${g} FOUND! Sample data:`, data)
        }
    }
}

findTable()
