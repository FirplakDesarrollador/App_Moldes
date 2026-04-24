
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function findBrillados() {
    const dateRange = {
        start: '2026-04-20',
        end: '2026-04-20'
    }

    const { data: rows, error } = await supabase
        .from('BD_moldes')
        .select('"id", "Título", "CODIGO MOLDE", "DEFECTOS A REPARAR", "FECHA ENTRADA", "FECHA ESPERADA", "FECHA ENTREGA", "Tipo de reparacion"')
        .or('"Tipo de reparacion".ilike.%rapida%,"Tipo de reparacion".ilike.%rápida%')

    if (error) {
        console.error(error)
        return
    }

    const filtered = rows.filter((r) => {
        const fe  = r['FECHA ENTREGA']
        const fes = r['FECHA ESPERADA']
        if (!fe || !fes) return false

        // REGLA: Comprometido para este periodo Y entregado hoy o antes
        return (fes >= dateRange.start && fes <= dateRange.end && fe <= dateRange.end)
    })

    const brillados = filtered.filter(r => {
        const d = (r['DEFECTOS A REPARAR'] || '').toLowerCase()
        return d.includes('brill')
    })

    console.log(`Found ${brillados.length} brillados for ${dateRange.start}:`)
    brillados.forEach(r => {
        console.log(`- ID: ${r.id}, Code: ${r['CODIGO MOLDE']}, Title: ${r['Título']}, Defect: ${r['DEFECTOS A REPARAR']}, Delivered: ${r['FECHA ENTREGA']}, Expected: ${r['FECHA ESPERADA']}`)
    })
}

findBrillados()
