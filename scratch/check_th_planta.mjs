import { createClient } from '@supabase/supabase-js'

const supabaseTH = createClient(
    'https://jdtjtkncptwqdhlxmzds.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkdGp0a25jcHR3cWRobHhtemRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTExODQwMDAsImV4cCI6MjAwNjc2MDAwMH0.CKSoqx81iXamo3ftitaQwOiyJ3OsIOMO8xlxwEBp5oE'
)

async function run() {
    console.log("--- Checking planta_moldes in TH project ---")
    const { data, count, error } = await supabaseTH.from('planta_moldes').select('*', { count: 'exact' })
    if (error) {
        console.error("Error:", error.message)
    } else {
        console.log("Total rows in TH project planta_moldes:", count)
        if (data && data.length > 0) {
            console.log("Sample Data:", JSON.stringify(data.slice(0, 3), null, 2))
        }
    }
}
run()
