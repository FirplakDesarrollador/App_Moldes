import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function findTable() {
    // Try to query information_schema.columns to find where tipo_molde_id is used or if there's a table like '%tipo%'
    console.log('Searching for tables containing "tipo" or "moldes"...')
    
    // Since we don't have direct SQL access easily, let's try a few more guesses
    const guesses = ['Tipo_molde', 'tipos_moldes', 'molde_tipo', 'catalog_tipos', 'tipo_articulo']
    for (const g of guesses) {
        const { data, error } = await supabase.from(g).select('*').limit(1)
        if (!error) {
            console.log(`Table found: ${g}`)
            return
        }
    }
    console.log('No matches found in guesses.')
}

findTable()
