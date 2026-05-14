import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function cleanupDuplicates() {
    console.log('=== INICIANDO DEPURACIÓN DE BD_moldes ===\n');

    // 1. Obtener todos los registros
    const { data: records, error } = await supabase
        .from('BD_moldes')
        .select('id, "CODIGO MOLDE", "Tipo de reparacion"')
        .order('id', { ascending: false });

    if (error) {
        console.error('Error al obtener datos:', error.message);
        return;
    }

    console.log(`Total registros analizados: ${records.length}`);

    // 2. Identificar registros a conservar (el más reciente por código y tipo)
    const toKeep = new Set();
    const duplicates = [];
    const seen = new Set();

    records.forEach(r => {
        const codigo = (r["CODIGO MOLDE"] || '').trim().toUpperCase();
        const tipo = (r["Tipo de reparacion"] || '').trim().toUpperCase();
        const key = `${codigo}|${tipo}`;

        if (!seen.has(key)) {
            // Es el más reciente de este par (Código + Tipo)
            seen.add(key);
            toKeep.add(r.id);
        } else {
            // Es un duplicado más antiguo
            duplicates.push(r.id);
        }
    });

    console.log(`Registros a conservar: ${seen.size}`);
    console.log(`Registros a eliminar (duplicados): ${duplicates.length}`);

    if (duplicates.length === 0) {
        console.log('No se encontraron duplicados para depurar.');
        return;
    }

    // 3. Eliminar en lotes de 100 para evitar errores de timeout
    console.log('\nEliminando duplicados...');
    
    for (let i = 0; i < duplicates.length; i += 100) {
        const chunk = duplicates.slice(i, i + 100);
        const { error: delError } = await supabase
            .from('BD_moldes')
            .delete()
            .in('id', chunk);

        if (delError) {
            console.error(`Error eliminando lote ${i}:`, delError.message);
        } else {
            console.log(`Lote ${i/100 + 1} eliminado (${chunk.length} registros).`);
        }
    }

    console.log('\n✅ DEPURACIÓN COMPLETADA CON ÉXITO.');
}

cleanupDuplicates();
