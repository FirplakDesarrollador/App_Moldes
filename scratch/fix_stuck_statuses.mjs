import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fixStuckStatuses() {
    console.log('=== INICIANDO CORRECCIÓN MASIVA DE ESTADOS ATASCADOS ===\n');

    // 1. Buscar registros que ya fueron entregados pero siguen "En reparación"
    const { data: stuckRecords, error } = await supabase
        .from('BD_moldes')
        .select('id, "CODIGO MOLDE", "FECHA ENTREGA", "ESTADO"')
        .not('FECHA ENTREGA', 'is', null)
        .ilike('ESTADO', 'En repara%');

    if (error) {
        console.error('Error al consultar registros:', error.message);
        return;
    }

    console.log(`Se encontraron ${stuckRecords.length} registros atascados.\n`);

    if (stuckRecords.length === 0) {
        console.log('No hay registros que requieran corrección.');
        return;
    }

    // 2. Corregirlos uno por uno (para disparar los triggers de sincronización)
    let fixedCount = 0;
    for (const record of stuckRecords) {
        process.stdout.write(`Corrigiendo molde ${record["CODIGO MOLDE"]} (ID: ${record.id})... `);
        
        const { error: updateError } = await supabase
            .from('BD_moldes')
            .update({ ESTADO: 'Entregado' })
            .eq('id', record.id);

        if (updateError) {
            console.log(`❌ Error: ${updateError.message}`);
        } else {
            console.log('✅ OK');
            fixedCount++;
        }
    }

    console.log(`\n🎉 PROCESO FINALIZADO.`);
    console.log(`Registros actualizados a "Entregado": ${fixedCount}`);
}

fixStuckStatuses();
