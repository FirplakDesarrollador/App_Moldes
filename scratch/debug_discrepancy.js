
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

async function debugDiscrepancy() {
    const { data: bdData } = await supabase.from('BD_moldes').select('*');
    
    let histData = [];
    let start = 0;
    while (true) {
        const { data, error } = await supabase.from('base_datos_historico_moldes').select('*').range(start, start + 999);
        if (error || !data || data.length === 0) break;
        histData = histData.concat(data);
        start += 1000;
    }

    console.log(`BD Count: ${bdData.length}`);
    console.log(`Hist Count: ${histData.length}`);

    const histL1Keys = new Set(histData.map(h => getL1Key(h, true)));
    
    let matchedL1 = 0;
    let missingL1 = 0;
    
    bdData.forEach(r => {
        const k = getL1Key(r, false);
        if (histL1Keys.has(k)) matchedL1++; else missingL1++;
    });

    console.log(`--- ANALYSIS RESULTS ---`);
    console.log(`L1 Matched: ${matchedL1}`);
    console.log(`L1 Missing (Events to Insert): ${missingL1}`);

    // Now check closures among matched
    let closures = 0;
    const histLatest = {};
    histData.forEach(h => {
        const k = getL1Key(h, true);
        if (!histLatest[k] || h.id > histLatest[k].id) histLatest[k] = h;
    });

    bdData.forEach(r => {
        const k = getL1Key(r, false);
        if (histL1Keys.has(k)) {
            const match = histLatest[k];
            const bdEstado = normalize(r["ESTADO"]);
            const histEstado = normalize(match.estado);
            const bdEntrega = normalize(r["FECHA ENTREGA"]);
            const histEntrega = normalize(match.fecha_entrega);

            const needsUpdate = bdEstado.includes('entrega') && (!histEstado.includes('entrega') || !histEntrega);
            if (needsUpdate) closures++;
        }
    });

    console.log(`Closures Needed: ${closures}`);
}

debugDiscrepancy();
