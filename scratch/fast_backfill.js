
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

function getEventKey(r) {
    const c = r.codigo_molde;
    const fe = r.fecha_entrada;
    const tr = r.tipo_de_reparacion;
    const dr = r.defectos_a_reparar;
    if (!c || !fe) return null;
    return `${normalize(c)}|${normalize(fe)}|${normalize(tr)}|${normalize(dr)}`;
}

async function fastBackfill() {
    console.log('--- STARTING FAST BACKFILL ---');

    // 1. Fetch
    let histData = [];
    let start = 0;
    while (true) {
        const { data, error } = await supabase.from('base_datos_historico_moldes').select('*').range(start, start + 999);
        if (error || !data || data.length === 0) break;
        histData = histData.concat(data);
        start += 1000;
        process.stdout.write(`Fetched ${histData.length} records...\r`);
    }
    console.log(`\nFetched ${histData.length} records.`);

    // 2. Map
    const keyToIdMap = {};
    const recordsToUpdate = [];

    histData.forEach(r => {
        const key = getEventKey(r);
        if (!key) return;
        if (!keyToIdMap[key]) keyToIdMap[key] = crypto.randomUUID();
        
        recordsToUpdate.push({
            id: r.id,
            repair_event_id: keyToIdMap[key]
        });
    });

    console.log(`Prepared ${recordsToUpdate.length} updates for history.`);

    // 3. Upsert History in chunks
    const chunkSize = 500;
    for (let i = 0; i < recordsToUpdate.length; i += chunkSize) {
        const chunk = recordsToUpdate.slice(i, i + chunkSize);
        const { error } = await supabase.from('base_datos_historico_moldes').upsert(chunk, { onConflict: 'id' });
        if (error) console.error(`Error in chunk ${i}:`, error.message);
        process.stdout.write(`History Progress: ${Math.min(i + chunkSize, recordsToUpdate.length)}/${recordsToUpdate.length}\r`);
    }
    console.log('\nHistory update complete.');

    // 4. Sync BD_moldes
    const { data: bdData } = await supabase.from('BD_moldes').select('*');
    const bdUpdates = [];
    bdData.forEach(r => {
        const key = `${normalize(r["CODIGO MOLDE"])}|${normalize(r["FECHA ENTRADA"])}|${normalize(r["Tipo de reparacion"])}|${normalize(r["DEFECTOS A REPARAR"])}`;
        if (keyToIdMap[key]) {
            bdUpdates.push({
                id: r.id,
                repair_event_id: keyToIdMap[key]
            });
        }
    });

    console.log(`Prepared ${bdUpdates.length} updates for BD_moldes.`);
    for (let i = 0; i < bdUpdates.length; i += chunkSize) {
        const chunk = bdUpdates.slice(i, i + chunkSize);
        await supabase.from('BD_moldes').upsert(chunk, { onConflict: 'id' });
        process.stdout.write(`BD_moldes Progress: ${Math.min(i + chunkSize, bdUpdates.length)}/${bdUpdates.length}\r`);
    }
    console.log('\nSync complete.');
}

fastBackfill();
