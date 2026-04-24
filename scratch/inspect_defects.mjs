
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function inspect() {
    const { data, error } = await supabase
        .from('BD_moldes')
        .select('"DEFECTOS A REPARAR", "Tipo de reparacion"')
        .or('"Tipo de reparacion".ilike.%rapida%,"Tipo de reparacion".ilike.%rápida%')

    if (error) {
        console.error(error)
        return
    }

    const defects = data.map(r => r['DEFECTOS A REPARAR']).filter(Boolean)
    const uniqueDefects = [...new Set(defects)]
    
    console.log('Unique Defects in Rapida records:')
    uniqueDefects.forEach(d => console.log(`- ${d}`))

    const desmancheRecords = data.filter(r => (r['DEFECTOS A REPARAR'] || '').toLowerCase().includes('desmanch'))
    console.log(`\nFound ${desmancheRecords.length} records containing "desmanch"`)
    // desmancheRecords.forEach(r => console.log(`- ${r['DEFECTOS A REPARAR']}`))

    const brillRecords = data.filter(r => (r['DEFECTOS A REPARAR'] || '').toLowerCase().includes('brill'))
    console.log(`\nFound ${brillRecords.length} records containing "brill"`)
    // brillRecords.forEach(r => console.log(`- ${r['DEFECTOS A REPARAR']}`))
}

inspect()
