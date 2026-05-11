
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function normalize(val) {
    if (val === null || val === undefined) return '';
    let str = String(val).trim().toLowerCase();
    // Normalizar fechas si parecen fechas (YYYY-MM-DD...)
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        str = str.substring(0, 10);
    }
    // Quitar dobles espacios
    str = str.replace(/\s+/g, ' ');
    return str;
}

function getLevel1Key(r, isHist) {
    const c = isHist ? r.codigo_molde : r["CODIGO MOLDE"];
    const fe = isHist ? r.fecha_entrada : r["FECHA ENTRADA"];
    return `${normalize(c)}|${normalize(fe)}`;
}

function getLevel2Key(r, isHist) {
    const l1 = getLevel1Key(r, isHist);
    const tr = isHist ? r.tipo_de_reparacion : r["Tipo de reparacion"];
    return `${l1}|${normalize(tr)}`;
}

function getLevel3Key(r, isHist) {
    const l2 = getLevel2Key(r, isHist);
    const fs = isHist ? r.fecha_esperada : r["FECHA ESPERADA"];
    const ft = isHist ? r.fecha_entrega : r["FECHA ENTREGA"];
    const dr = isHist ? r.defectos_a_reparar : r["DEFECTOS A REPARAR"];
    const st = isHist ? r.estado : r["ESTADO"];
    return `${l2}|${normalize(fs)}|${normalize(ft)}|${normalize(dr)}|${normalize(st)}`;
}

async function detailedAnalysis() {
    console.log('--- DETAILED GAP ANALYSIS (3 LEVELS) ---');

    const { data: bdData } = await supabase.from('BD_moldes').select('*');
    
    // Fetch History in chunks
    let histData = [];
    let start = 0;
    const chunkSize = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data, error } = await supabase
            .from('base_datos_historico_moldes')
            .select('*')
            .range(start, start + chunkSize - 1);
        
        if (error || !data || data.length === 0) {
            hasMore = false;
        } else {
            histData = histData.concat(data);
            start += chunkSize;
        }
    }

    console.log(`Fetched ${bdData.length} records from BD_moldes`);
    console.log(`Fetched ${histData.length} records from Historico`);

    const histL1 = new Set(histData.map(r => getLevel1Key(r, true)));
    const histL2 = new Set(histData.map(r => getLevel2Key(r, true)));
    const histL3 = new Set(histData.map(r => getLevel3Key(r, true)));

    const results = {
        L1: { matched: [], missing: [] },
        L2: { matched: [], missing: [] },
        L3: { matched: [], missing: [] }
    };

    bdData.forEach(r => {
        const k1 = getLevel1Key(r, false);
        const k2 = getLevel2Key(r, false);
        const k3 = getLevel3Key(r, false);

        if (histL1.has(k1)) results.L1.matched.push(r); else results.L1.missing.push(r);
        if (histL2.has(k2)) results.L2.matched.push(r); else results.L2.missing.push(r);
        if (histL3.has(k3)) results.L3.matched.push(r); else results.L3.missing.push(r);
    });

    console.log(`\nNIVEL 1 (Código + Entrada): Matched: ${results.L1.matched.length}, Missing: ${results.L1.missing.length}`);
    console.log(`NIVEL 2 (+ Tipo Rep): Matched: ${results.L2.matched.length}, Missing: ${results.L2.missing.length}`);
    console.log(`NIVEL 3 (+ Esperada + Entrega + Defectos + Estado): Matched: ${results.L3.matched.length}, Missing: ${results.L3.missing.length}`);

    // Show samples for Level 1 (to see why they match)
    if (results.L1.matched.length > 0) {
        console.log('\n--- 20 EXAMPLES OF MATCHED (LEVEL 1) ---');
        console.table(results.L1.matched.slice(0, 20).map(r => ({
            codigo: r["CODIGO MOLDE"],
            entrada: r["FECHA ENTRADA"],
            tipo: r["Tipo de reparacion"]
        })));
    }

    if (results.L1.missing.length > 0) {
        console.log('\n--- 20 EXAMPLES OF MISSING (LEVEL 1) ---');
        console.table(results.L1.missing.slice(0, 20).map(r => ({
            codigo: r["CODIGO MOLDE"],
            entrada: r["FECHA ENTRADA"],
            tipo: r["Tipo de reparacion"]
        })));
    }

    // Identify causes of failure in Level 3 vs Level 1
    console.log('\n--- ANALYSIS OF DIFFERENCES ---');
    const diffRecords = results.L1.matched.filter(r => !results.L3.matched.includes(r)).slice(0, 10);
    
    diffRecords.forEach(r => {
        const k1 = getLevel1Key(r, false);
        const matchHist = histData.find(h => getLevel1Key(h, true) === k1);
        
        console.log(`\nMolde: ${r["CODIGO MOLDE"]} (${r["FECHA ENTRADA"]})`);
        console.log(`BD_moldes:  Estado: ${r["ESTADO"]}, Entrega: ${r["FECHA ENTREGA"]}, Tipo: ${r["Tipo de reparacion"]}, Defectos: ${r["DEFECTOS A REPARAR"]}`);
        console.log(`Historico:  Estado: ${matchHist.estado}, Entrega: ${matchHist.fecha_entrega}, Tipo: ${matchHist.tipo_de_reparacion}, Defectos: ${matchHist.defectos_a_reparar}`);
    });
}

detailedAnalysis();
