
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrationDryRun() {
    console.log('--- MIGRATION DRY-RUN: BD_moldes -> base_datos_historico_moldes ---');

    // 1. Fetch all records from BD_moldes
    const { data: bdData, error: errBd } = await supabase
        .from('BD_moldes')
        .select('*');

    if (errBd) {
        console.error('Error fetching BD_moldes:', errBd.message);
        return;
    }

    // 2. Fetch all records from base_datos_historico_moldes (relevant fields for comparison)
    // To handle large datasets, we fetch only comparison fields
    const { data: histData, error: errHist } = await supabase
        .from('base_datos_historico_moldes')
        .select('codigo_molde, fecha_entrada, fecha_esperada, fecha_entrega, tipo_de_reparacion, defectos_a_reparar, estado');

    if (errHist) {
        console.error('Error fetching Historical data:', errHist.message);
        return;
    }

    // 3. Create a Set of existing event keys in the history
    const makeKey = (r, isHist = true) => {
        const c = isHist ? r.codigo_molde : r["CODIGO MOLDE"];
        const fe = isHist ? r.fecha_entrada : r["FECHA ENTRADA"];
        const fs = isHist ? r.fecha_esperada : r["FECHA ESPERADA"];
        const ft = isHist ? r.fecha_entrega : r["FECHA ENTREGA"];
        const tr = isHist ? r.tipo_de_reparacion : r["Tipo de reparacion"];
        const dr = isHist ? r.defectos_a_reparar : r["DEFECTOS A REPARAR"];
        const st = isHist ? r.estado : r["ESTADO"];

        return [c, fe, fs, ft, tr, dr, st]
            .map(val => String(val || '').trim().toUpperCase())
            .join('|');
    };

    const histKeys = new Set(histData.map(r => makeKey(r, true)));

    // 4. Filter BD_moldes records that are NOT in history
    const toInsert = [];
    let omittedCount = 0;

    bdData.forEach(r => {
        const key = makeKey(r, false);
        if (histKeys.has(key)) {
            omittedCount++;
        } else {
            // Mapping logic
            toInsert.push({
                // Generar ID nuevo basado en timestamp para evitar colisiones
                id: Date.now() + Math.floor(Math.random() * 1000000),
                titulo: r["Título"],
                codigo_molde: r["CODIGO MOLDE"],
                defectos_a_reparar: r["DEFECTOS A REPARAR"],
                fecha_entrada: r["FECHA ENTRADA"],
                fecha_esperada: r["FECHA ESPERADA"],
                fecha_entrega: r["FECHA ENTREGA"],
                estado: r["ESTADO"],
                observaciones: r["OBSERVACIONES"],
                usuario: r["Usuario"] || r["Created By"] || 'Migracion Sistema',
                responsable: r["Responsable"],
                tipo_de_reparacion: r["Tipo de reparacion"],
                tipo: r["Tipo"],
                created: new Date().toISOString().split('T')[0]
            });
        }
    });

    // 5. Summary and Preview
    console.log(`\nTotal records in BD_moldes: ${bdData.length}`);
    console.log(`Records already in History (Omitted): ${omittedCount}`);
    console.log(`Records to be migrated (New Events): ${toInsert.length}`);

    if (toInsert.length > 0) {
        console.log('\n--- PREVIEW: FIRST 30 RECORDS TO INSERT ---');
        console.table(toInsert.slice(0, 30).map(r => ({
            codigo: r.codigo_molde,
            entrada: r.fecha_entrada,
            entrega: r.fecha_entrega,
            estado: r.estado,
            tipo: r.tipo_de_reparacion,
            responsable: r.responsable
        })));
        
        console.log('\n[DRY-RUN COMPLETE] No data was modified.');
        console.log('To execute this migration, provide authorization.');
    } else {
        console.log('\nNo new events found to migrate.');
    }
}

migrationDryRun();
