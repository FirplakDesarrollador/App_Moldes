import { createClient } from '@/lib/supabase'

export function normalizePlantTitle(value: unknown): string {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase().replace(/\s+/g, ' ')
}

export function inferMoldPlant(title: unknown): 'MS' | 'FV' | null {
    const text = normalizePlantTitle(title)
    if (/\b(SANTORINI|CATALUNA|CALIMA)\b/.test(text)) return 'FV'
    return /\b(LAVAMANOS|LAVARROPAS|MESON(?:ES)?|LAVATRAPEROS?|BARRAS?)\b/.test(text) ? 'MS' : null
}

/** Registra la planta de un código antes del ingreso, sin sobrescribir clasificaciones existentes. */
export async function ensureMoldPlant(code: string, title: string, selectedPlant?: string): Promise<void> {
    const serial = String(code || '').trim().toUpperCase()
    if (!serial || ['S/C', 'SC', 'SIN CODIGO', 'SIN CÓDIGO'].includes(serial)) return
    const db = createClient()
    const { data: existing, error: lookupError } = await db.from('planta_moldes')
        .select('numero_de_serie, planta').ilike('numero_de_serie', serial).limit(1)
    if (lookupError) throw lookupError
    if (existing?.length) return

    const explicit = ['MS', 'FV'].includes(selectedPlant || '') ? selectedPlant : null
    // Clasificaciones FV confirmadas por la responsable de moldes.
    let plant = explicit || (inferMoldPlant(title) === 'FV' ? 'FV' : null)
    if (!plant && title?.trim()) {
        const { data: reference, error } = await db.from('planta_moldes')
            .select('planta').eq('numero_de_articulo', title.trim())
        if (error) throw error
        const known = [...new Set((reference || []).map(r => String(r.planta || '').trim().toUpperCase()).filter(p => ['MS', 'FV', 'RTM'].includes(p)))]
        if (known.length === 1) plant = known[0]
        if (known.length > 1) throw new Error('La referencia tiene varias plantas. Selecciona MS o FV antes de guardar.')
    }
    plant ||= inferMoldPlant(title)
    if (!plant) throw new Error('No se pudo determinar la planta de este código nuevo. Selecciona MS o FV antes de guardar.')
    const row = { numero_de_serie: serial, numero_de_articulo: title.trim(), planta: plant }
    let manualId: number | undefined
    for (let attempt = 0; attempt < 3; attempt++) {
        const { error } = await db.from('planta_moldes').insert(manualId === undefined ? row : { ...row, id: manualId })
        if (!error) return
        if (error.code !== '23505') throw error
        const { data, error: retryError } = await db.from('planta_moldes').select('numero_de_serie').ilike('numero_de_serie', serial).limit(1)
        if (retryError) throw retryError
        if (data?.length) return
        // La secuencia existente está atrasada. Elegir un ID libre y reintentar sin sobrescribir.
        const { data: highest, error: idError } = await db.from('planta_moldes').select('id').order('id', { ascending: false }).limit(1)
        if (idError) throw idError
        manualId = Number(highest?.[0]?.id || 0) + 1
    }
    throw new Error('No se pudo registrar la planta por un ingreso simultáneo. Intenta guardar nuevamente.')
}
