
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
    
    if (!c || !fe) return null; // Invalid for grouping
    return `${normalize(c)}|${normalize(fe)}|${normalize(tr)}|${normalize(dr)}`;
}

async function backfillDryRun() {
    console.log('--- BACKFILL DRY-RUN: ASSIGNING repair_event_id ---');

    // 1. Fetch History in chunks
    let histData = [];
    let start = 0;
    while (true) {
        const { data, error } = await supabase.from('base_datos_historico_moldes').select('*').range(start, start + 999);
        if (error || !data || data.length === 0) break;
        histData = histData.concat(data);
        start += 1000;
    }

    console.log(`Total historical records: ${histData.length}`);

    // 2. Group by Event Key
    const eventGroups = {};
    const incompleteRecords = [];

    histData.forEach(r => {
        const key = getEventKey(r);
        if (!key) {
            incompleteRecords.push(r);
            return;
        }
        if (!eventGroups[key]) eventGroups[key] = [];
        eventGroups[key].push(r);
    });

    const groupKeys = Object.keys(eventGroups);
    console.log(`Unique events identified: ${groupKeys.length}`);
    console.log(`Records with incomplete data (No ID assigned): ${incompleteRecords.length}`);

    // 3. Preview Assignment
    console.log('\n--- PREVIEW: ASSIGNMENT OF UUIDs TO EVENTS (TOP 20) ---');
    const preview = groupKeys.slice(0, 20).map(key => {
        const records = eventGroups[key];
        const newId = crypto.randomUUID();
        return {
            event_key: key.substring(0, 50) + '...',
            count: records.length,
            proposed_id: newId,
            ids: records.map(r => r.id).slice(0, 2).join(', ')
        };
    });
    console.table(preview);

    if (incompleteRecords.length > 0) {
        console.log('\n--- SAMPLES OF INCOMPLETE RECORDS ---');
        console.table(incompleteRecords.slice(0, 10).map(r => ({
            id: r.id,
            codigo: r.codigo_molde,
            entrada: r.fecha_entrada,
            defectos: r.defectos_a_reparar
        })));
    }

    // 4. BD_moldes Sync Preview
    const { data: bdData } = await supabase.from('BD_moldes').select('*');
    let syncableCount = 0;
    bdData.forEach(r => {
        const key = `${normalize(r["CODIGO MOLDE"])}|${normalize(r["FECHA ENTRADA"])}|${normalize(r["Tipo de reparacion"])}|${normalize(r["DEFECTOS A REPARAR"])}`;
        if (eventGroups[key]) syncableCount++;
    });

    console.log(`\nRecords in BD_moldes that can be synced with historical IDs: ${syncableCount}/${bdData.length}`);
    console.log('\n[DRY-RUN COMPLETE] No database changes were made.');
}

backfillDryRun();
