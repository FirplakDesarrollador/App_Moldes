
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function validatePostMigration() {
    console.log('--- POST-MIGRATION VALIDATION ---');

    // 1. Total count in Historical
    const { count, error } = await supabase
        .from('base_datos_historico_moldes')
        .select('*', { count: 'exact', head: true });
    
    console.log(`Final count in base_datos_historico_moldes: ${count}`);

    // 2. Check 0177-20
    const { data: moldData } = await supabase
        .from('base_datos_historico_moldes')
        .select('*')
        .ilike('codigo_molde', '0177-20');
    
    console.log(`Records found for 0177-20: ${moldData.length}`);
    if (moldData.length > 0) {
        console.log(`Sample: ${moldData[0].codigo_molde} | ${moldData[0].estado} | ${moldData[0].observaciones}`);
    }

    // 3. KPI Check (Simulate indicator for a range including 0177-20's date: 2026-04-24)
    // We expect 0177-20 to be counted as "Entregado" because its state is "Entregado" in the migrated record.
    console.log('\n--- KPI TEST (April 2026) ---');
    const { data: aprilData } = await supabase
        .from('base_datos_historico_moldes')
        .select('codigo_molde, estado, fecha_entrega')
        .gte('fecha_entrega', '2026-04-01')
        .lte('fecha_entrega', '2026-04-30');
    
    const countEntregados = (aprilData || []).filter(r => (r.estado || '').toLowerCase().includes('entrega')).length;
    console.log(`Total delivered in April 2026 (Historical): ${countEntregados}`);
}

validatePostMigration();
