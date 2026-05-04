import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkColumns() {
    console.log('Checking column types for BD_moldes...')
    // We can query the information_schema via a raw SQL query if we have a function for it
    // Or we can try to insert a dummy record and see the error or success
    
    const { data, error } = await supabase.rpc('get_table_info', { table_name: 'BD_moldes' })
    if (error) {
        console.error('RPC Error:', error)
        
        // Alternative: try to insert a record with a known ID to see if it works
        console.log('Trying a test insert with manual ID...')
        const testId = 999999
        const { error: insertError } = await supabase
            .from('BD_moldes')
            .insert([{ id: testId, "CODIGO MOLDE": 'TEST-99', "ESTADO": 'En reparacion' }])
        
        if (insertError) {
            console.error('Test Insert Error:', insertError.message)
        } else {
            console.log('Test Insert Success with ID 999999')
            // Clean up
            await supabase.from('BD_moldes').delete().eq('id', testId)
        }
    } else {
        console.log('Table Info:', data)
    }
}

checkColumns()
