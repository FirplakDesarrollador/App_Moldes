import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debugKey() {
    console.log('=== DEBUG CLAVE DEDUPLICACIÓN 0124-34 ===\n');
    const { data: records } = await supabase
        .from('BD_moldes')
        .select('*')
        .ilike('CODIGO MOLDE', '0124-34');

    const norm = (s) => (s || '').trim().toUpperCase().replace(/,+$/, '').trim();

    records.forEach(r => {
        const t = r["Tipo de reparacion"] || '';
        const tipoNorm = norm(t).replace('Á', 'A').replace('É', 'E').replace('Í', 'I').replace('Ó', 'O').replace('Ú', 'U');
        const key = `${norm(r["CODIGO MOLDE"])}|${r.fecha_entrada}|${tipoNorm}`;
        
        console.log(`ID: ${r.id}`);
        console.log(`  Código: "${r["CODIGO MOLDE"]}"`);
        console.log(`  Fecha: "${r.fecha_entrada}"`);
        console.log(`  Tipo: "${t}"`);
        console.log(`  KEY GENERADA: [${key}]`);
        console.log('---');
    });
}

debugKey();
