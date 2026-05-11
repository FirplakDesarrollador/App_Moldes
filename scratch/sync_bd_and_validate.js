
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function normalize(val) {
    if (val === null || val === undefined) return '';
    let str = String(val).trim().toLowerCase().replace(/\s+/g, ' ');
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) str = str.substring(0, 10);
    return str;
}

async function syncBdMoldesAndValidate() {
    console.log('--- STEP 1: Sync BD_moldes ---');

    // Fetch history with their IDs
    let histData = [];
    let start = 0;
    while (true) {
        const { data, error } = await supabase.from('base_datos_historico_moldes')
            .select('codigo_molde, fecha_entrada, tipo_de_reparacion, defectos_a_reparar, repair_event_id')
            .not('repair_event_id', 'is', null)
            .range(start, start + 999);
        if (error || !data || data.length === 0) break;
        histData = histData.concat(data);
        start += 1000;
    }
    console.log(`Fetched ${histData.length} historical records with IDs.`);

    // Build key -> ID map from historical
    const keyToIdMap = {};
    histData.forEach(r => {
        const key = `${normalize(r.codigo_molde)}|${normalize(r.fecha_entrada)}|${normalize(r.tipo_de_reparacion)}|${normalize(r.defectos_a_reparar)}`;
        if (!keyToIdMap[key]) keyToIdMap[key] = r.repair_event_id;
    });

    // Fetch BD_moldes
    const { data: bdData, error: bdErr } = await supabase.from('BD_moldes').select('*');
    if (bdErr) { console.error('Error fetching BD_moldes:', bdErr.message); return; }

    let synced = 0;
    let skipped = 0;
    for (const r of bdData) {
        const key = `${normalize(r["CODIGO MOLDE"])}|${normalize(r["FECHA ENTRADA"])}|${normalize(r["Tipo de reparacion"])}|${normalize(r["DEFECTOS A REPARAR"])}`;
        const id = keyToIdMap[key];
        if (id) {
            const { error } = await supabase.from('BD_moldes').update({ repair_event_id: id }).eq('id', r.id);
            if (!error) synced++;
        } else {
            skipped++;
        }
    }
    console.log(`BD_moldes sync complete: ${synced} synced, ${skipped} skipped (no history match).`);

    console.log('\n--- STEP 2: Validation ---');

    // Count with repair_event_id
    const { count: withId } = await supabase.from('base_datos_historico_moldes')
        .select('*', { count: 'exact', head: true })
        .not('repair_event_id', 'is', null);

    const { count: withoutId } = await supabase.from('base_datos_historico_moldes')
        .select('*', { count: 'exact', head: true })
        .is('repair_event_id', null);

    const { count: bdSynced } = await supabase.from('BD_moldes')
        .select('*', { count: 'exact', head: true })
        .not('repair_event_id', 'is', null);

    const { count: bdTotal } = await supabase.from('BD_moldes')
        .select('*', { count: 'exact', head: true });

    console.log(`\nHistorical Records WITH repair_event_id:    ${withId}`);
    console.log(`Historical Records WITHOUT repair_event_id: ${withoutId}`);
    console.log(`BD_moldes WITH repair_event_id:              ${bdSynced}/${bdTotal}`);

    // Quick indicator test
    const { data: sample } = await supabase.from('base_datos_historico_moldes')
        .select('id, codigo_molde, estado, repair_event_id')
        .gte('fecha_esperada', '2026-05-01')
        .lte('fecha_esperada', '2026-05-31')
        .limit(5);
    
    console.log('\n--- May 2026 Sample (indicators still running) ---');
    console.table(sample?.map(r => ({
        id: r.id,
        codigo: r.codigo_molde,
        estado: r.estado,
        has_event_id: !!r.repair_event_id
    })));

    console.log('\n[BACKFILL VALIDATION COMPLETE]');
}

syncBdMoldesAndValidate();
