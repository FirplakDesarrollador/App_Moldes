
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

async function findDesmanchados() {
    // Assuming the user is querying April 20, 2026 based on the screenshot
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
        if (!fe) return false

        // Caso 1: Entregado en el rango actual
        if (fe >= dateRange.start && fe <= dateRange.end) {
            if (fes && fes > dateRange.end) return false
            return true
        }

        // Caso 2: Entregado antes del rango (adelantado), pero el compromiso es para ESTE rango
        if (fe < dateRange.start) {
            if (fes && fes >= dateRange.start && fes <= dateRange.end) return true
            return false
        }

        return false
    })

    const desmanchados = filtered.filter(r => {
        const d = (r['DEFECTOS A REPARAR'] || '').toLowerCase()
        return d.includes('desmanch')
    })

    console.log(`Found ${desmanchados.length} desmanchados for ${dateRange.start}:`)
    desmanchados.forEach(r => {
        console.log(`- ID: ${r.id}, Code: ${r['CODIGO MOLDE']}, Title: ${r['Título']}, Defect: ${r['DEFECTOS A REPARAR']}, Delivered: ${r['FECHA ENTREGA']}, Expected: ${r['FECHA ESPERADA']}`)
    })
}

findDesmanchados()
