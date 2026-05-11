
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function gapAnalysis() {
    console.log('--- GAP ANALYSIS: BD_moldes vs base_datos_historico_moldes ---');

    // 1. Count BD_moldes
    const { count: countBD, error: errBD } = await supabase
        .from('BD_moldes')
        .select('*', { count: 'exact', head: true });
    
    // 2. Count Historical
    const { count: countHist, error: errHist } = await supabase
        .from('base_datos_historico_moldes')
        .select('*', { count: 'exact', head: true });

    if (errBD || errHist) {
        console.error('Error counting tables:', errBD?.message || errHist?.message);
        return;
    }

    console.log(`Total records in BD_moldes: ${countBD}`);
    console.log(`Total records in base_datos_historico_moldes: ${countHist}`);

    // 3. Fetch all codes from both (using pagination if needed, but for counts we can just compare)
    // Actually, let's fetch ALL codes from BD_moldes (it's around 40k+ according to code comments?)
    // Wait, the code says "Optimización 40k+", but let's see how many there really are.
    
    // Fetch unique codes from BD_moldes
    const { data: bdData, error: errBdData } = await supabase
        .from('BD_moldes')
        .select('"CODIGO MOLDE", id, "Título", "FECHA ENTRADA", "FECHA ESPERADA", "FECHA ENTREGA", "ESTADO", "Tipo de reparacion", "DEFECTOS A REPARAR"');

    if (errBdData) {
        console.error('Error fetching BD_moldes data:', errBdData.message);
        return;
    }

    // Fetch unique codes from Historico
    const { data: histData, error: errHistData } = await supabase
        .from('base_datos_historico_moldes')
        .select('codigo_molde');

    if (errHistData) {
        console.error('Error fetching Historical data:', errHistData.message);
        return;
    }

    const histCodes = new Set(histData.map(r => (r.codigo_molde || '').trim().toUpperCase()));
    
    const missingInHist = bdData.filter(r => {
        const code = (r["CODIGO MOLDE"] || '').trim().toUpperCase();
        return !histCodes.has(code);
    });

    console.log(`\nMold codes in BD_moldes missing from Historico: ${missingInHist.length}`);

    if (missingInHist.length > 0) {
        console.log('\n--- SAMPLE OF MISSING RECORDS ---');
        const sample = missingInHist.slice(0, 50); // Show first 50
        console.table(sample.map(r => ({
            id: r.id,
            codigo: r["CODIGO MOLDE"],
            titulo: (r["Título"] || '').substring(0, 20),
            entrada: r["FECHA ENTRADA"],
            esperada: r["FECHA ESPERADA"],
            entrega: r["FECHA ENTREGA"],
            estado: r["ESTADO"],
            tipo: r["Tipo de reparacion"],
            defectos: (r["DEFECTOS A REPARAR"] || '').substring(0, 20)
        })));

        if (missingInHist.length > 50) {
            console.log(`... and ${missingInHist.length - 50} more.`);
        }

        // Analysis of missing data
        const entregadosFaltantes = missingInHist.filter(r => (r["ESTADO"] || '').toLowerCase().includes('entrega')).length;
        const activosFaltantes = missingInHist.filter(r => !((r["ESTADO"] || '').toLowerCase().includes('entrega'))).length;
        const sinFechaEntrada = missingInHist.filter(r => !r["FECHA ENTRADA"]).length;

        console.log('\n--- ANALYSIS ---');
        console.log(`Missing records marked as "Entregado": ${entregadosFaltantes}`);
        console.log(`Missing records marked as "Active" (WIP): ${activosFaltantes}`);
        console.log(`Missing records without "FECHA ENTRADA": ${sinFechaEntrada}`);
    }
}

gapAnalysis();
