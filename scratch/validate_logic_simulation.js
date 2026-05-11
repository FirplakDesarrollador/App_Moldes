
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Mocking the logic from molds.service.ts
async function simulateSaveLogic(record, isNew) {
    console.log(`\nSimulating save: isNew=${isNew}, Code=${record.codigo_molde}, Incoming ID=${record.repair_event_id || 'null'}`);
    
    let repairEventId = record.repair_event_id;

    if (isNew) {
        repairEventId = crypto.randomUUID();
        console.log(`Generated NEW ID: ${repairEventId}`);
    } else {
        if (!repairEventId) {
            console.log('No ID provided, searching current record...');
            const { data: current } = await supabase
                .from('BD_moldes')
                .select('repair_event_id')
                .ilike('CODIGO MOLDE', record.codigo_molde)
                .limit(1);
            
            repairEventId = current?.[0]?.repair_event_id;
            console.log(`Found in BD_moldes: ${repairEventId || 'null'}`);

            if (!repairEventId) {
                console.log('Searching in historical...');
                const { data: hist } = await supabase
                    .from('base_datos_historico_moldes')
                    .select('repair_event_id')
                    .eq('codigo_molde', record.codigo_molde)
                    .eq('fecha_entrada', record.fecha_entrada)
                    .not('repair_event_id', 'is', null)
                    .order('id', { ascending: false })
                    .limit(1);
                
                repairEventId = hist?.[0]?.repair_event_id || crypto.randomUUID();
                console.log(`Final ID (Hist search or New): ${repairEventId}`);
            }
        } else {
            console.log(`Preserving existing ID: ${repairEventId}`);
        }
    }
    return repairEventId;
}

async function runTests() {
    console.log('--- LOGIC VALIDATION TESTS ---');

    // Test 1: New record
    const id1 = await simulateSaveLogic({ codigo_molde: 'TEST-NEW' }, true);
    if (!id1) throw new Error('Test 1 failed');

    // Test 2: Edit with existing ID
    const existingId = crypto.randomUUID();
    const id2 = await simulateSaveLogic({ codigo_molde: 'TEST-EDIT', repair_event_id: existingId }, false);
    if (id2 !== existingId) throw new Error('Test 2 failed: ID was not preserved');

    // Test 3: Edit old record (without ID)
    const id3 = await simulateSaveLogic({ codigo_molde: '01155', fecha_entrada: '2026-05-11' }, false);
    if (!id3) throw new Error('Test 3 failed');

    console.log('\n--- TESTS COMPLETED SUCCESSFULLY ---');
}

runTests();
