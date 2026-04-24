import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    'https://vuiuorjzonpyobpelyld.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aXVvcmp6b25weW9icGVseWxkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDY4MDM2OTksImV4cCI6MjAyMjM3OTY5OX0.ARDJuGYox9CY3K8z287nEEFBmWVLTs6yCLkHHeMMTKw'
)

async function run() {
    // Try different possible table names
    for (const tableName of ['planta_moldes', 'PlantaMoldes', 'planta moldes', 'plantas_moldes', 'moldes_planta']) {
        const { data, error } = await supabase.from(tableName).select('*').limit(1)
        if (!error) {
            console.log(`Table "${tableName}" exists!`, data)
        } else {
            console.log(`Table "${tableName}": ${error.message}`)
        }
    }

    // Check BD_moldes for any planta-related column
    console.log('\n--- BD_moldes columns ---')
    const { data: bdData } = await supabase.from('BD_moldes').select('*').limit(1)
    if (bdData && bdData.length > 0) {
        console.log("All columns:", Object.keys(bdData[0]).join(', '))
    }
}
run()
