
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

async function executeBackfill() {
    console.log('--- STARTING MASSIVE BACKFILL ---');

    // 1. Fetch History
    let histData = [];
    let start = 0;
    while (true) {
        const { data, error } = await supabase.from('base_datos_historico_moldes').select('*').range(start, start + 999);
        if (error || !data || data.length === 0) break;
        histData = histData.concat(data);
        start += 1000;
        process.stdout.write(`Fetched ${histData.length} records...\r`);
    }
    console.log(`\nFetched ${histData.length} records total.`);

    // 2. Grouping
    const eventGroups = {};
    histData.forEach(r => {
        const key = getEventKey(r);
        if (!key) return;
        if (!eventGroups[key]) eventGroups[key] = [];
        eventGroups[key].push(r);
    });

    const groupKeys = Object.keys(eventGroups);
    console.log(`Events to process: ${groupKeys.length}`);

    // 3. Update History in batches
    let totalUpdated = 0;
    let errors = 0;
    
    // We update by event group to reduce API calls
    for (let i = 0; i < groupKeys.length; i++) {
        const key = groupKeys[i];
        const records = eventGroups[key];
        const newId = crypto.randomUUID();
        const ids = records.map(r => r.id);

        const { error } = await supabase
            .from('base_datos_historico_moldes')
            .update({ repair_event_id: newId })
            .in('id', ids);

        if (error) {
            console.error(`Error in group ${i}:`, error.message);
            errors++;
        } else {
            totalUpdated += ids.length;
        }

        if (i % 100 === 0) {
            process.stdout.write(`Processed ${i}/${groupKeys.length} events (${totalUpdated} records)...\r`);
        }
    }
    console.log(`\nHistory update complete. Total rows updated: ${totalUpdated}. Errors: ${errors}`);

    // 4. Sync BD_moldes
    console.log('\n--- SYNCING BD_moldes ---');
    const { data: bdData } = await supabase.from('BD_moldes').select('*');
    let syncCount = 0;
    for (const r of bdData) {
        const key = `${normalize(r["CODIGO MOLDE"])}|${normalize(r["FECHA ENTRADA"])}|${normalize(r["Tipo de reparacion"])}|${normalize(r["DEFECTOS A REPARAR"])}`;
        
        // Find the UUID we just generated for this event
        // (We can find it by looking at any record in the group we just processed)
        const histMatch = histData.find(h => getEventKey(h) === key);
        if (histMatch) {
            // We need to re-query history to get the UUID we just assigned if we didn't store it
            // Or better, let's store it during the history update.
        }
    }
    // Optimization: I'll redo the sync part using the generated IDs map.
}

// I'll rewrite the script slightly to store the mapping
async function executeBackfillImproved() {
    console.log('--- STARTING MASSIVE BACKFILL ---');

    // 1. Fetch
    let histData = [];
    let start = 0;
    while (true) {
        const { data, error } = await supabase.from('base_datos_historico_moldes').select('*').range(start, start + 999);
        if (error || !data || data.length === 0) break;
        histData = histData.concat(data);
        start += 1000;
    }

    // 2. Map & Update
    const eventGroups = {};
    histData.forEach(r => {
        const key = getEventKey(r);
        if (!key) return;
        if (!eventGroups[key]) eventGroups[key] = [];
        eventGroups[key].push(r);
    });

    const keyToIdMap = {};
    const groupKeys = Object.keys(eventGroups);
    let totalUpdated = 0;

    for (let i = 0; i < groupKeys.length; i++) {
        const key = groupKeys[i];
        const newId = crypto.randomUUID();
        keyToIdMap[key] = newId;
        const ids = eventGroups[key].map(r => r.id);

        await supabase.from('base_datos_historico_moldes').update({ repair_event_id: newId }).in('id', ids);
        totalUpdated += ids.length;
        if (i % 50 === 0) process.stdout.write(`Progress: ${i}/${groupKeys.length}\r`);
    }
    console.log(`\nHistory updated: ${totalUpdated} rows.`);

    // 3. Sync BD_moldes
    const { data: bdData } = await supabase.from('BD_moldes').select('*');
    let syncs = 0;
    for (const r of bdData) {
        const key = `${normalize(r["CODIGO MOLDE"])}|${normalize(r["FECHA ENTRADA"])}|${normalize(r["Tipo de reparacion"])}|${normalize(r["DEFECTOS A REPARAR"])}`;
        if (keyToIdMap[key]) {
            await supabase.from('BD_moldes').update({ repair_event_id: keyToIdMap[key] }).eq('id', r.id);
            syncs++;
        }
    }
    console.log(`BD_moldes synced: ${syncs} rows.`);
}

executeBackfillImproved();
