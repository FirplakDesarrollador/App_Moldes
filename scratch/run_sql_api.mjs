import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

async function runSql() {
    const token = process.env.SUPABASE_ACCESS_TOKEN;
    const projectRef = 'vuiuorjzonpyobpelyld'; // Extracted from NEXT_PUBLIC_SUPABASE_URL
    const sql = fs.readFileSync('execution/trigger_auto_desmanchado_v2.sql', 'utf8');

    const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/query`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: sql })
    });

    if (!res.ok) {
        const err = await res.text();
        console.error('Error executing SQL:', res.status, err);
    } else {
        const data = await res.json();
        console.log('Success:', data);
    }
}

runSql();
