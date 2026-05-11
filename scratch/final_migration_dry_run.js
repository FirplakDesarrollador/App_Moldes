
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function normalize(val) {
    if (val === null || val === undefined) return '';
    let str = String(val).trim().toLowerCase();
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) str = str.substring(0, 10);
    str = str.replace(/\s+/g, ' ');
    return str;
}

function getLevel1Key(r, isHist) {
    const c = isHist ? r.codigo_molde : r["CODIGO MOLDE"];
    const fe = isHist ? r.fecha_entrada : r["FECHA ENTRADA"];
    return `${normalize(c)}|${normalize(fe)}`;
}

async function finalMigrationDryRun() {
    console.log('--- FINAL MIGRATION DRY-RUN: BD_moldes -> base_datos_historico_moldes ---');

    // 1. Fetch data
    const { data: bdData } = await supabase.from('BD_moldes').select('*');
    
    let histData = [];
    let start = 0;
    const chunkSize = 1000;
    let hasMore = true;
    while (hasMore) {
        const { data, error } = await supabase.from('base_datos_historico_moldes').select('*').range(start, start + chunkSize - 1);
        if (error || !data || data.length === 0) hasMore = false;
        else { histData = histData.concat(data); start += chunkSize; }
    }

    // Map history for quick access (get latest record for each key)
    const histLatest = {};
    histData.forEach(h => {
        const key = getLevel1Key(h, true);
        if (!histLatest[key] || h.id > histLatest[key].id) {
            histLatest[key] = h;
        }
    });

    const toInsertNew = [];
    const toInsertUpdates = [];

    bdData.forEach(r => {
        const key = getLevel1Key(r, false);
        const match = histLatest[key];

        const mappedRecord = {
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
            // Caso 1: Nuevo evento
            toInsertNew.push(mappedRecord);
        } else {
            // Caso 2: Diferencia de estado (si operativa es Entregado y histórico no)
            const bdEstado = normalize(r["ESTADO"]);
            const histEstado = normalize(match.estado);
            const bdEntrega = normalize(r["FECHA ENTREGA"]);
            const histEntrega = normalize(match.fecha_entrega);

            const needsUpdate = bdEstado.includes('entrega') && (!histEstado.includes('entrega') || !histEntrega);
            
            if (needsUpdate) {
                toInsertUpdates.push(mappedRecord);
            }
        }
    });

    console.log(`\n========================================`);
    console.log(`RESULTADOS DEL DRY-RUN:`);
    console.log(`1. EVENTOS NUEVOS: ${toInsertNew.length}`);
    console.log(`2. CIERRES DE ESTADO: ${toInsertUpdates.length}`);
    console.log(`TOTAL A INSERTAR: ${toInsertNew.length + toInsertUpdates.length}`);
    console.log(`========================================\n`);

    if (toInsertNew.length > 0) {
        console.log('\n--- VISTA PREVIA: 20 EVENTOS NUEVOS ---');
        console.table(toInsertNew.slice(0, 20).map(r => ({
            codigo: r.codigo_molde,
            entrada: r.fecha_entrada,
            estado: r.estado,
            tipo: r.tipo_de_reparacion
        })));
    }

    if (toInsertUpdates.length > 0) {
        console.log('\n--- VISTA PREVIA: 20 CIERRES (ACTUALIZACIÓN DE ESTADO) ---');
        console.table(toInsertUpdates.slice(0, 20).map(r => ({
            codigo: r.codigo_molde,
            entrada: r.fecha_entrada,
            entrega: r.fecha_entrega,
            estado: r.estado
        })));
    }

    console.log('\n--- SCRIPT DE EJECUCIÓN (LÓGICA) ---');
    console.log('1. No se realizarán UPDATES ni DELETES.');
    console.log('2. Solo se ejecutarán INSERTS en base_datos_historico_moldes.');
    console.log('3. Los registros llevan el tag: "(Migración de cierre desde BD_moldes)".');
}

finalMigrationDryRun();
