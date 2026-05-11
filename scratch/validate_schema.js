
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function validateSchema() {
    console.log('--- SCHEMA VALIDATION ---');

    // 1. Check BD_moldes
    const { data: bdSample, error: bdError } = await supabase.from('BD_moldes').select('*').limit(1);
    if (bdError) {
        console.error('Error querying BD_moldes:', bdError.message);
    } else if (bdSample && bdSample.length >= 0) {
        const hasCol = bdSample.length > 0 ? ('repair_event_id' in bdSample[0]) : 'Table empty, check manually';
        console.log(`Column 'repair_event_id' in BD_moldes: ${hasCol}`);
    }

    // 2. Check base_datos_historico_moldes
    const { data: histSample, error: histError } = await supabase.from('base_datos_historico_moldes').select('*').limit(1);
    if (histError) {
        console.error('Error querying Historico:', histError.message);
    } else if (histSample && histSample.length >= 0) {
        const hasCol = histSample.length > 0 ? ('repair_event_id' in histSample[0]) : 'Table empty, check manually';
        console.log(`Column 'repair_event_id' in base_datos_historico_moldes: ${hasCol}`);
    }

    // 3. Test App stability (just checking if existing indicators query still works)
    const { data: kpiSample, error: kpiError } = await supabase
        .from('base_datos_historico_moldes')
        .select('id')
        .limit(5);
    
    if (kpiError) {
        console.error('App indicators query test: FAILED', kpiError.message);
    } else {
        console.log('App indicators query test: SUCCESS');
    }
}

validateSchema();
