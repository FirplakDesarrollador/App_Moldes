
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const moldCodes = ['0190-12', '01155', '0177-20'];

async function validateMolds() {
    console.log('--- VALIDATING MOLDS IN HISTORICO ---');
    
    for (const code of moldCodes) {
        console.log(`\n>>> ANALYZING: ${code}`);
        const { data, error } = await supabase
            .from('base_datos_historico_moldes')
            .select('*')
            .ilike('codigo_molde', code)
            .order('id', { ascending: false });

        if (error) {
            console.error(`Error fetching ${code}:`, error.message);
            continue;
        }

        if (!data || data.length === 0) {
            console.log(`No records found for ${code}`);
            continue;
        }

        console.table(data.map(r => ({
            id: r.id,
            codigo: r.codigo_molde,
            entrada: r.fecha_entrada,
            esperada: r.fecha_esperada,
            entrega: r.fecha_entrega,
            estado: r.estado,
            tipo: r.tipo_de_reparacion,
            defectos: (r.defectos_a_reparar || '').substring(0, 30)
        })));

        // Simple deduplication logic check
        const eventGroups = {};
        data.forEach(r => {
            const key = `${(r.codigo_molde || '').trim().toUpperCase()}|${r.fecha_entrada}|${(r.tipo_de_reparacion || '').trim().toUpperCase()}|${(r.defectos_a_reparar || '').trim().toUpperCase()}`;
            if (!eventGroups[key] || r.id > eventGroups[key].id) {
                eventGroups[key] = r;
            }
        });

        const deduplicated = Object.values(eventGroups);
        console.log(`Records after deduplication: ${deduplicated.length}`);
        
        deduplicated.forEach(r => {
            const tipo = (r.tipo_de_reparacion || '').toLowerCase();
            const isRapida = tipo.includes('rapida') || tipo.includes('rápida') || tipo.includes('desmanch') || tipo.includes('brill');
            const status = (r.estado || '').toLowerCase();
            const isEntregado = status.includes('entrega') || status === 'activo' || status === 'disponible' || status === 'ok';
            
            console.log(`- ID ${r.id}: [${r.tipo_de_reparacion}] ${r.estado}`);
            console.log(`  ¿Reparación Rápida?: ${isRapida}`);
            console.log(`  ¿Contado como Entregado?: ${isEntregado && r.fecha_entrega ? 'SÍ' : 'NO'}`);
        });
    }
}

validateMolds();
