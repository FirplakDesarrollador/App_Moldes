import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function analyzeDuplicates() {
    console.log('=== ANÁLISIS DE REGLA: MISMO DÍA / DISTINTO TIPO ===\n');

    const { data: records, error } = await supabase
        .from('BD_moldes')
        .select('id, "CODIGO MOLDE", "FECHA ENTRADA", "Tipo de reparacion"')
        .order('id', { ascending: false });

    if (error) {
        console.error('Error fetching data:', error.message);
        return;
    }

    // Agrupar por Molde + Fecha
    const groups = {};
    records.forEach(r => {
        const key = `${(r["CODIGO MOLDE"] || '').trim()}|${r["FECHA ENTRADA"]}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(r);
    });

    let foundViolations = 0;
    let foundValid = 0;

    console.log('Casos detectados el mismo día:\n');

    for (const [key, rows] of Object.entries(groups)) {
        if (rows.length > 1) {
            const [molde, fecha] = key.split('|');
            const tipos = rows.map(r => r["Tipo de reparacion"]);
            const uniqueTipos = new Set(tipos.map(t => (t || '').trim().toLowerCase()));

            console.log(`Molde: ${molde} | Fecha: ${fecha}`);
            console.log(`  - Registros encontrados: ${rows.length}`);
            console.log(`  - Tipos detectados: [${tipos.join(', ')}]`);

            if (uniqueTipos.size < rows.length) {
                console.log('  ❌ INCUMPLE: Hay registros del MISMO TIPO el mismo día.');
                foundViolations++;
            } else {
                console.log('  ✅ CUMPLE: Los tipos son DIFERENTES.');
                foundValid++;
            }
            console.log('---');
        }
    }

    console.log(`\nResumen:`);
    console.log(`- Casos válidos (distinto tipo): ${foundValid}`);
    console.log(`- Casos inválidos (mismo tipo): ${foundViolations}`);
}

analyzeDuplicates();
