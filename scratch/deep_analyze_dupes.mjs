import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function deepAnalyze() {
    console.log('=== BÚSQUEDA PROFUNDA DE DUPLICADOS ===\n');

    // Traemos más datos para asegurar que no se nos escape nada
    const { data: records, error } = await supabase
        .from('BD_moldes')
        .select('id, "CODIGO MOLDE", "FECHA ENTRADA", "Tipo de reparacion"')
        .order('id', { ascending: false });

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    const seen = {};
    
    records.forEach(r => {
        const codigo = (r["CODIGO MOLDE"] || '').trim();
        const fecha = r["FECHA ENTRADA"];
        const tipo = (r["Tipo de reparacion"] || '').trim();
        
        const key = `${codigo}|${fecha}`;
        if (!seen[key]) seen[key] = [];
        seen[key].push(r);
    });

    let found = false;
    for (const [key, rows] of Object.entries(seen)) {
        if (rows.length > 1) {
            found = true;
            const [codigo, fecha] = key.split('|');
            console.log(`Molde: ${codigo} | Fecha: ${fecha}`);
            rows.forEach(row => {
                console.log(`  - ID: ${row.id} | Tipo: "${row["Tipo de reparacion"]}"`);
            });
            
            const tipos = rows.map(r => r["Tipo de reparacion"]?.toLowerCase().trim());
            const uniqueTipos = new Set(tipos);
            
            if (uniqueTipos.size === rows.length) {
                console.log('  ✅ CUMPLE: Tipos diferentes el mismo día.');
            } else {
                console.log('  ❌ INCUMPLE: Mismo tipo el mismo día.');
            }
            console.log('---');
        }
    }

    if (!found) {
        console.log('No se encontraron moldes con exactamente la misma fecha de entrada repetida.');
        console.log('\nAnalizando los últimos del 0177-18 por si acaso:');
        const m0177 = records.filter(r => r["CODIGO MOLDE"] === '0177-18').slice(0, 3);
        m0177.forEach(r => {
            console.log(`ID: ${r.id} | Fecha: ${r["FECHA ENTRADA"]} | Tipo: ${r["Tipo de reparacion"]}`);
        });
    }
}

deepAnalyze();
