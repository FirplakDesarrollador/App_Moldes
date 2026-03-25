const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    try {
        const record = {
            titulo: 'test',
            codigo_molde: 'TEST',
            defectos_a_reparar: '',
            fecha_entrada: '2026-03-25',
            fecha_esperada: '2026-03-25',
            estado: 'Disponible',
            observaciones: 'test',
            usuario: 'TestUser',
            responsable: 'TestUser',
            tipo_de_reparacion: 'Reparación rápida',
            tipo: 'Molde',
            id: 'NEW'
        };

        const dbRecord = {
            "Título": record.titulo,
            "CODIGO MOLDE": record.codigo_molde,
            "DEFECTOS A REPARAR": record.defectos_a_reparar,
            "FECHA ENTRADA": record.fecha_entrada,
            "FECHA ESPERADA": record.fecha_esperada,
            "ESTADO": record.estado,
            "OBSERVACIONES": record.observaciones,
            "Usuario": record.usuario,
            "Responsable": record.responsable,
            "Tipo de reparacion": record.tipo_de_reparacion,
            "Tipo": record.tipo,
            "Modified": new Date().toISOString(),
            "Modified By": record.usuario
        };

        dbRecord['Created'] = new Date().toISOString();
        dbRecord['Created By'] = record.usuario;

        const res1 = await supabase.from('BD_moldes').insert([dbRecord]).select();
        console.log("Error details:", res1.error ? `${res1.error.message} - ${res1.error.details}` : null);

    } catch (e) {
        console.error("Crash:", e);
    }
}
run();
