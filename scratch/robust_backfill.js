
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

async function robustBackfill() {
    console.log('--- STARTING ROBUST BACKFILL (UPDATE MODE) ---');

    // 1. Fetch History
    let histData = [];
    let start = 0;
    while (true) {
        const { data, error } = await supabase.from('base_datos_historico_moldes').select('*').range(start, start + 999);
        if (error || !data || data.length === 0) break;
        histData = histData.concat(data);
        start += 1000;
    }
    console.log(`Fetched ${histData.length} records.`);

    // 2. Grouping
    const eventGroups = {};
    histData.forEach(r => {
        const key = getEventKey(r);
        if (!key) return;
        if (!eventGroups[key]) eventGroups[key] = [];
        eventGroups[key].push(r);
    });

    const groupKeys = Object.keys(eventGroups);
    console.log(`Processing ${groupKeys.length} event groups...`);

    // 3. Update with Concurrency
    const CONCURRENCY = 30;
    let index = 0;
    let totalUpdated = 0;

    async function worker() {
        while (index < groupKeys.length) {
            const i = index++;
            const key = groupKeys[i];
            const records = eventGroups[key];
            const newId = crypto.randomUUID();
            const ids = records.map(r => r.id);

            const { error } = await supabase
                .from('base_datos_historico_moldes')
                .update({ repair_event_id: newId })
                .in('id', ids);

            if (!error) totalUpdated += ids.length;
            if (i % 100 === 0) process.stdout.write(`Progress: ${i}/${groupKeys.length} groups (${totalUpdated} rows)\r`);
        }
    }

    const workers = Array.from({ length: CONCURRENCY }, worker);
    await Promise.all(workers);
    console.log(`\nHistory update complete: ${totalUpdated} rows updated.`);
}

robustBackfill();
