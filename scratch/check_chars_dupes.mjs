import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkChars() {
    const { data: records, error } = await supabase
        .from('BD_moldes')
        .select('id, "Tipo de reparacion"')
        .ilike('CODIGO MOLDE', '0124-34');

    if (error) {
        console.error(error);
        return;
    }

    records.forEach(m => {
        const t = m['Tipo de reparacion'] || '';
        const charCodes = [...t].map(c => `${c}(${c.charCodeAt(0)})`).join(' ');
        console.log(`ID: ${m.id} | Tipo: "${t}" | Chars: ${charCodes}`);
    });
}

checkChars();
