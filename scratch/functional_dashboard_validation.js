
const { createClient } = require('@supabase/supabase-js');
const dayjs = require('dayjs');
const isBetween = require('dayjs/plugin/isBetween');
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore');
require('dotenv').config();

dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- Logic from indicators.service.ts ---
function deduplicateHistoricalRecords(records) {
    const eventGroups = {};
    records.forEach(r => {
        const key = `${(r.codigo_molde || '').trim().toUpperCase()}|${r.fecha_entrada}|${(r.tipo_de_reparacion || '').trim().toUpperCase()}|${(r.defectos_a_reparar || '').trim().toUpperCase()}`;
        if (!eventGroups[key] || r.id > eventGroups[key].id) {
            eventGroups[key] = r;
        }
    });
    return Object.values(eventGroups);
}

async function testKPIs(start, end) {
    let allHistorical = [];
    let curStart = 0;
    while (true) {
        const { data, error } = await supabase.from('base_datos_historico_moldes').select('*').range(curStart, curStart + 999);
        if (error || !data || data.length === 0) break;
        allHistorical = allHistorical.concat(data);
        curStart += 1000;
    }
    
    const deduplicated = deduplicateHistoricalRecords(allHistorical || []);
    
    const comprometidos = deduplicated.filter(r => 
        r.fecha_esperada && r.fecha_esperada >= start && r.fecha_esperada <= end
    );

    const entregados = deduplicated.filter(r => 
        r.fecha_entrega && r.fecha_entrega >= start && r.fecha_entrega <= end
    );

    const activeStates = ['En reparación', 'En reparacion', 'EN REPARACION', 'En espera - Produccion', 'En espera - Producción'];
    const atrasados = deduplicated.filter(r => 
        r.fecha_esperada && r.fecha_esperada < start && activeStates.includes(r.estado)
    );

    return { comprometidos, entregados, atrasados };
}

async function testRapida(start, end) {
    let allHistorical = [];
    let curStart = 0;
    while (true) {
        const { data, error } = await supabase
            .from('base_datos_historico_moldes')
            .select('*')
            .or(`tipo_de_reparacion.ilike.%rapida%,tipo_de_reparacion.ilike.%rápida%,tipo_de_reparacion.ilike.%desmanch%,tipo_de_reparacion.ilike.%brill%`)
            .range(curStart, curStart + 999);
        if (error || !data || data.length === 0) break;
        allHistorical = allHistorical.concat(data);
        curStart += 1000;
    }
    
    const deduplicated = deduplicateHistoricalRecords(allHistorical || []);
    
    const reparados = deduplicated.filter(r => {
        const fe = r.fecha_entrega;
        const status = (r.estado || '').toLowerCase();
        return fe && status.includes('entrega') && dayjs(fe).isBetween(start, end, 'day', '[]');
    });

    return reparados;
}

async function runValidation() {
    console.log('--- DASHBOARD FUNCTIONAL VALIDATION ---');

    // 1. April 2026
    const april = await testKPIs('2026-04-01', '2026-04-30');
    console.log(`\nAbril 2026:`);
    console.log(`- Comprometidos: ${april.comprometidos.length}`);
    console.log(`- Entregados: ${april.entregados.length}`);
    console.log(`- Atrasados: ${april.atrasados.length}`);

    // 2. May 2026
    const mayo = await testKPIs('2026-05-01', '2026-05-31');
    console.log(`\nMayo 2026:`);
    console.log(`- Comprometidos: ${mayo.comprometidos.length}`);
    console.log(`- Entregados: ${mayo.entregados.length}`);

    // 3. Casos Especiales
    console.log(`\n--- CASOS ESPECIALES ---`);
    
    // 0190-12
    const m0190 = mayo.comprometidos.find(r => r.codigo_molde === '0190-12') || april.entregados.find(r => r.codigo_molde === '0190-12');
    if (m0190) {
        console.log(`- 0190-12: Estado en histórico: ${m0190.estado}, Fecha Entrega: ${m0190.fecha_entrega}`);
    } else {
        console.log('- 0190-12: No encontrado en el rango activo/reciente.');
    }

    // 01155
    const rapidaMayo = await testRapida('2026-05-01', '2026-05-31');
    const m01155 = rapidaMayo.find(r => r.codigo_molde === '01155');
    console.log(`- 01155: ¿Aparece en Reparación Rápida hoy?: ${m01155 ? 'SÍ' : 'NO'}`);
    if (m01155) console.log(`  Estado: ${m01155.estado}, Defecto: ${m01155.defectos_a_reparar}`);

    // 0177-20
    const m0177 = april.entregados.find(r => r.codigo_molde === '0177-20');
    console.log(`- 0177-20: ¿Aparece en historial de Abril?: ${m0177 ? 'SÍ' : 'NO'}`);
}

runValidation();
