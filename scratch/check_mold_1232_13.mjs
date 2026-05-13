/**
 * DIAGNÓSTICO ESPECÍFICO: Molde 1232-13
 * Verifica por qué no entra en los indicadores del 12 de mayo.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkMold() {
    console.log('=== INVESTIGACIÓN MOLDE 1232-13 ===\n');

    const { data: records, error } = await supabase
        .from('base_datos_historico_moldes')
        .select('*')
        .ilike('codigo_molde', '1232-13')
        .order('id', { ascending: false });

    if (error) {
        console.error('Error:', error.message);
        return;
    }

    console.log(`Se encontraron ${records?.length} registros en el histórico.\n`);

    records?.forEach((r, i) => {
        console.log(`Registro ${i + 1} (ID: ${r.id}):`);
        console.log(`  - Entrada: ${r.fecha_entrada}`);
        console.log(`  - Esperada: ${r.fecha_esperada}`);
        console.log(`  - Entrega: ${r.fecha_entrega}`);
        console.log(`  - Estado: "${r.estado}"`);
        console.log(`  - Tipo Rep: "${r.tipo_reparacion}"`);
        
        // Simular lógica de indicadores
        const isEntregado = (r.estado || '').toLowerCase().includes('entrega') || (r.estado || '').toLowerCase() === 'activo';
        const isEnReparacion = (r.estado || '').toLowerCase().includes('repara') || (r.estado || '').toLowerCase().includes('espera');
        
        console.log(`  - ¿Es detectado como entregado?: ${isEntregado}`);
        console.log(`  - ¿Es detectado como pendiente?: ${isEnReparacion}`);
        
        if (r.fecha_entrega === '2026-05-12') {
            console.log(`  => 🎯 ESTE ES EL REGISTRO DEL 12 DE MAYO`);
            if (!isEntregado) {
                console.log(`  ⚠️  BLOQUEO: No se cuenta como entrega porque el estado es "${r.estado}" y no "Entregado".`);
            }
        }
        console.log('---');
    });
}

checkMold().catch(console.error);
