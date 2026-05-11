
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function normalize(val) {
    if (val === null || val === undefined) return '';
    let str = String(val).trim().toLowerCase().replace(/\s+/g, ' ');
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) str = str.substring(0, 10);
    return str;
}

function getL1Key(r, isHist) {
    const c = isHist ? r.codigo_molde : r["CODIGO MOLDE"];
    const fe = isHist ? r.fecha_entrada : r["FECHA ENTRADA"];
    return `${normalize(c)}|${normalize(fe)}`;
}

async function executeMigration() {
    console.log('--- STARTING REAL MIGRATION ---');

    // 1. Fetch BD_moldes
    const { data: bdData } = await supabase.from('BD_moldes').select('*');
    
    // 2. Fetch History in chunks
    let histData = [];
    let start = 0;
    while (true) {
        const { data, error } = await supabase.from('base_datos_historico_moldes').select('*').range(start, start + 999);
        if (error || !data || data.length === 0) break;
        histData = histData.concat(data);
        start += 1000;
    }

    const histLatest = {};
    histData.forEach(h => {
        const k = getL1Key(h, true);
        if (!histLatest[k] || h.id > histLatest[k].id) histLatest[k] = h;
    });

    const toInsert = [];

    bdData.forEach(r => {
        const k = getL1Key(r, false);
        const match = histLatest[k];

        const record = {
            id: Date.now() + Math.floor(Math.random() * 1000000),
            titulo: r["Título"],
            codigo_molde: r["CODIGO MOLDE"],
            defectos_a_reparar: r["DEFECTOS A REPARAR"],
            fecha_entrada: r["FECHA ENTRADA"] ? normalize(r["FECHA ENTRADA"]) : null,
            fecha_esperada: r["FECHA ESPERADA"] ? normalize(r["FECHA ESPERADA"]) : null,
            fecha_entrega: r["FECHA ENTREGA"] ? normalize(r["FECHA ENTREGA"]) : null,
            estado: r["ESTADO"],
            observaciones: (r["OBSERVACIONES"] || '') + " (Migración de cierre desde BD_moldes)",
            usuario: r["Usuario"] || r["Created By"] || 'Sistema Migración',
            responsable: r["Responsable"],
            tipo_de_reparacion: r["Tipo de reparacion"],
            tipo: r["Tipo"],
            created: new Date().toISOString().split('T')[0]
        };

        if (!match) {
            toInsert.push(record);
        } else {
            const bdEstado = normalize(r["ESTADO"]);
            const histEstado = normalize(match.estado);
            const bdEntrega = normalize(r["FECHA ENTREGA"]);
            const histEntrega = normalize(match.fecha_entrega);
            const needsUpdate = bdEstado.includes('entrega') && (!histEstado.includes('entrega') || !histEntrega);
            if (needsUpdate) toInsert.push(record);
        }
    });

    console.log(`Prepared ${toInsert.length} records for insertion.`);

    if (toInsert.length === 0) {
        console.log('Nothing to insert.');
        return;
    }

    // 3. Batch insert (Supabase limit is usually around 1000 per request)
    const chunkSize = 100;
    let insertedCount = 0;
    let errors = [];

    for (let i = 0; i < toInsert.length; i += chunkSize) {
        const chunk = toInsert.slice(i, i + chunkSize);
        const { error } = await supabase.from('base_datos_historico_moldes').insert(chunk);
        
        if (error) {
            console.error(`Error inserting chunk ${i}:`, error.message);
            errors.push(error.message);
        } else {
            insertedCount += chunk.length;
            console.log(`Inserted ${insertedCount}/${toInsert.length}...`);
        }
    }

    console.log(`\n--- MIGRATION COMPLETE ---`);
    console.log(`Successfully inserted: ${insertedCount}`);
    console.log(`Errors: ${errors.length}`);
    if (errors.length > 0) console.log('Error details:', errors);
}

executeMigration();
