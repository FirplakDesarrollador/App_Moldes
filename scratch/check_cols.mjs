import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkCols() {
    const { data: m1, error: e1 } = await supabase.from('moldes').select('*').limit(1);
    console.log('moldes:', m1?.[0] ? Object.keys(m1[0]) : e1);
    
    const { data: m2, error: e2 } = await supabase.from('BD_moldes').select('*').limit(1);
    console.log('BD_moldes:', m2?.[0] ? Object.keys(m2[0]) : e2);
}

checkCols();
