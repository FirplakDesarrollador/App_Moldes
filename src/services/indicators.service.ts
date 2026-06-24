// PV_MOLDES V2.4 - HISTORICAL DATA MIGRATION
import { createClient } from '@/lib/supabase'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'

dayjs.extend(isBetween)
dayjs.extend(isSameOrBefore)

const ACTIVE_STATES = [
    'En reparación',
    'En reparacion',
    'EN REPARACION',
    'En espera - Produccion',
    'En espera - Producción',
    'En espera produccion',
    'EN ESPERA - PRODUCCION',
    'En espera - Moldes',
    'En espera - reparación',
    'En espera moldes',
    'EN ESPERA - MOLDES',
]

// ── Historical Record Structure ──────────────────────────────────────────────
export interface HistoricalMoldRaw {
    id: number
    titulo: string | null
    codigo_molde: string | null
    fecha_entrada: string | null
    fecha_esperada: string | null
    fecha_entrega: string | null
    estado: string | null
    defectos_a_reparar: string | null
    tipo_de_reparacion: string | null
    tipo: string | null
    responsable: string | null
    created?: string
    repair_event_id?: string | null
    [key: string]: any // Permite acceder a columnas con espacios de Supabase
}

// ── Normalised row for the UI ─────────────────────────────────────────────────
export interface MoldIndicatorRow {
    id: number
    serial: string
    nombre_articulo: string
    fecha_esperada: string | null
    fecha_entrega: string | null
    fecha_entrada: string | null
    estado: string
    tipo_de_reparacion: string
    tipo: string
    defectos: string
    responsable: string
}

// ── IndicatorStats ────────────────────────────────────────────────────────────
export interface IndicatorStats {
    comprometidos: MoldIndicatorRow[]
    entregados: MoldIndicatorRow[]
    detalles: MoldIndicatorRow[]
    totalComprometidas: number
    totalEntregadasATiempo: number
    totalPendientes: number
    nivelServicio: number
    desglosePorCategoria: Record<string, number>
}

// ── Reparación Rápida KPI result ─────────────────────────────────────────────
export interface RapidaKPIResult {
    totalMoldesReparados: number
    countMS: number
    countFV: number
    countDesmanchadoMS: number
    countDesmanchadoFV: number
    countDesmanchado: number
    moldesEsperados: number
    moldesEntregados: number
    metaTotal: number
    metaPorPersona: number
    totalOperarios: number
    numDays: number
    productividad: number
    nivelServicio: number
    productividadHH: number
    reparados: any[]
    esperadosList: any[]
    entregadosList: any[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Deduplication Logic:
 * Groups records by (codigo_molde + fecha_entrada + tipo_de_reparacion + defectos_a_reparar).
 * For each group, only the record with the highest ID (most recent edit) is kept.
 */
function deduplicateHistoricalRecords(records: HistoricalMoldRaw[]): HistoricalMoldRaw[] {
    const eventGroups: Record<string, HistoricalMoldRaw> = {}

    records.forEach(r => {
        const norm = (s: string | null) => (s || '').trim().toUpperCase().replace(/,+$/, '').trim()

        const codigo = r.codigo_molde || r['CODIGO MOLDE'] || '';
        const fecha = r.fecha_entrada || r['FECHA ENTRADA'] || '';

        // Clave por (codigo + fecha_entrada). Se excluye el tipo para evitar que
        // variaciones menores en el nombre del tipo generen duplicados donde el
        // registro "En reparacion" y el registro "Entregado" del mismo evento
        // tengan claves distintas y el "En reparacion" gane en los indicadores.
        const key = `${norm(codigo)}|${fecha}`

        if (!eventGroups[key]) {
            eventGroups[key] = r
            return
        }

        const existing = eventGroups[key]
        const rEntregado = !!r.fecha_entrega
        const existingEntregado = !!existing.fecha_entrega

        // Prioridad 1: preferir el registro con fecha_entrega (molde ya entregado)
        // Prioridad 2: mismo status → conservar el de mayor ID (edición más reciente)
        if (rEntregado && !existingEntregado) {
            eventGroups[key] = r
        } else if (rEntregado === existingEntregado && r.id > existing.id) {
            eventGroups[key] = r
        }
    })

    return Object.values(eventGroups)
}

function mapHistoricalRow(m: HistoricalMoldRaw): MoldIndicatorRow {
    return {
        id:               m.id,
        serial:           m.codigo_molde         || '',
        nombre_articulo:  m.titulo               || '',
        fecha_esperada:   m.fecha_esperada       ?? null,
        fecha_entrega:    m.fecha_entrega        ?? null,
        fecha_entrada:    m.fecha_entrada        ?? null,
        estado:           m.estado               || 'PROCESO',
        tipo_de_reparacion: m.tipo_de_reparacion || '',
        tipo:             m.tipo                 || '',
        defectos:         m.defectos_a_reparar   || '',
        responsable:      m.responsable          || '',
    }
}

function calcCategoryBreakdown(rows: MoldIndicatorRow[]): Record<string, number> {
    const cats: Record<string, number> = {
        REPARACION_RAPIDA: 0, REPARACION_ESPECIAL: 0,
        MOLDE_NUEVO: 0,       MODELO_NUEVO: 0,
    }
    rows.forEach(r => {
        const tr  = (r.tipo_de_reparacion || '').toUpperCase()
        const tip = (r.tipo               || '').toUpperCase()
        if (tip === 'MOLDE NUEVO')                               cats.MOLDE_NUEVO++
        else if (tr.includes('MODELO'))                          cats.MODELO_NUEVO++
        else if (tr.includes('RAPIDA') || tr.includes('RÁPIDA')) cats.REPARACION_RAPIDA++
        else if (tr.includes('ESPECIAL'))                        cats.REPARACION_ESPECIAL++
    })
    return cats
}

export function getDatesInRange(start: string, end: string): string[] {
    const dates: string[] = []
    const cur = new Date(start + 'T00:00:00')
    const endD = new Date(end + 'T00:00:00')
    while (cur <= endD) {
        dates.push(cur.toISOString().split('T')[0])
        cur.setDate(cur.getDate() + 1)
    }
    return dates
}

function classifyDefecto(defectos: string | null, tipoRep?: string | null): { desmanchado: boolean, brillado: boolean } {
    const d = (defectos || '').toLowerCase()
    const t = (tipoRep || '').toLowerCase()
    return {
        desmanchado: d.includes('desmanch') || t.includes('desmanch'),
        brillado: /\bbrillado\b/i.test(d) || /\bbrillado\b/i.test(t),
    }
}

// ── Service ───────────────────────────────────────────────────────────────────
export interface IndisponibilidadResult {
    promedioDiasFuera: number
    totalMoldes: number
    enReparacionActual: number
    indice: number
    daysInMonth: number
}

export interface IndisponibilidadRow extends IndisponibilidadResult {
    referencia: string
}

export const indicatorsService = {
    /** Devuelve los nombres únicos de referencias de moldes (para el selector). */
    async getReferencias(): Promise<string[]> {
        const supabase = createClient()
        const { data } = await supabase
            .from('moldes')
            .select('nombre_articulo')
            .neq('estado', 'Destruido')
            .order('nombre_articulo', { ascending: true })
        const unique = Array.from(new Set((data || []).map((r: any) => (r.nombre_articulo || '').trim()).filter(Boolean)))
        return unique
    },

    /**
     * Calcula el índice de indisponibilidad para una referencia de molde.
     *
     * Promedio días fuera = Σ(días en estado "En reparacion" dentro del rango por cada molde) / cantidad moldes no destruidos
     * Índice               = promedio días fuera / días del mes del rango × 100
     */
    async getIndisponibilidadByRef(
        nombreArticulo: string,
        dateRange: { start: string; end: string }
    ): Promise<IndisponibilidadResult> {
        const supabase = createClient()
        const today = new Date().toISOString().split('T')[0]

        // 1. Moldes de la referencia no destruidos
        const { data: moldMaster } = await supabase
            .from('moldes')
            .select('serial, estado')
            .ilike('nombre_articulo', nombreArticulo)

        const noDestruidos = (moldMaster || []).filter(
            (m: any) => !(m.estado || '').toLowerCase().includes('destruido')
        )
        const totalMoldes = noDestruidos.length
        if (totalMoldes === 0) {
            return { promedioDiasFuera: 0, totalMoldes: 0, enReparacionActual: 0, indice: 0, daysInMonth: 30 }
        }
        const seriales = noDestruidos.map((m: any) => (m.serial || '').trim())

        // 2. Registros activos en BD_moldes para esta referencia
        const { data: bdActivos } = await supabase
            .from('BD_moldes')
            .select('"CODIGO MOLDE", "FECHA ENTRADA", ESTADO')
            .in('"CODIGO MOLDE"', seriales)
        const enReparacionActual = (bdActivos || []).filter((r: any) =>
            (r['ESTADO'] || '').toLowerCase().includes('reparacion') ||
            (r['ESTADO'] || '').toLowerCase().includes('espera')
        ).length

        // 3. Registros históricos: un registro por evento de reparación (deduplicado por codigo_molde + fecha_entrada)
        const { data: histRaw } = await supabase
            .from('base_datos_historico_moldes')
            .select('codigo_molde, fecha_entrada, fecha_entrega, estado, id')
            .in('codigo_molde', seriales)
            .lte('fecha_entrada', dateRange.end)

        // Deduplicar por (codigo_molde | fecha_entrada): conservar el de mayor ID
        const eventMap: Record<string, any> = {}
        for (const r of (histRaw || [])) {
            const key = `${(r.codigo_molde || '').trim().toUpperCase()}|${r.fecha_entrada}`
            if (!eventMap[key] || r.id > eventMap[key].id) eventMap[key] = r
        }

        // 4. Calcular días fuera dentro del rango para cada evento
        const rangeStart = new Date(dateRange.start + 'T00:00:00')
        const rangeEnd   = new Date(dateRange.end   + 'T00:00:00')

        let totalDiasFuera = 0
        for (const r of Object.values(eventMap)) {
            const estadoNorm = (r.estado || '').toLowerCase()
            const isRepair = estadoNorm.includes('reparacion') || estadoNorm.includes('espera')
            if (!r.fecha_entrada || !isRepair) continue

            const start  = new Date(r.fecha_entrada + 'T00:00:00')
            const endRaw = r.fecha_entrega ? new Date(r.fecha_entrega + 'T00:00:00') : new Date(today + 'T00:00:00')

            const overlapStart = start  > rangeStart ? start  : rangeStart
            const overlapEnd   = endRaw < rangeEnd   ? endRaw : rangeEnd

            if (overlapEnd < overlapStart) continue
            const dias = Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 86400000) + 1
            totalDiasFuera += Math.max(0, dias)
        }

        // 5. Días del mes del período (denominador)
        const refDate   = new Date(dateRange.end + 'T00:00:00')
        const daysInMonth = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0).getDate()

        const promedioDiasFuera = totalDiasFuera / totalMoldes
        const indice = (promedioDiasFuera / daysInMonth) * 100

        return { promedioDiasFuera, totalMoldes, enReparacionActual, indice, daysInMonth }
    },

    /**
     * Calcula el índice de indisponibilidad para TODAS las referencias en 3 queries.
     * Devuelve solo las que tienen indice > 0, ordenadas de mayor a menor.
     */
    async getAllIndisponibilidad(
        dateRange: { start: string; end: string }
    ): Promise<IndisponibilidadRow[]> {
        const supabase = createClient()
        const today = new Date().toISOString().split('T')[0]

        const refDate = new Date(dateRange.end + 'T00:00:00')
        const daysInMonth = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0).getDate()

        // 1. Todos los moldes no destruidos agrupados por referencia
        const { data: allMoldes } = await supabase
            .from('moldes')
            .select('serial, nombre_articulo, estado')

        const refMap: Record<string, string[]> = {}
        for (const m of (allMoldes || [])) {
            const ref = (m.nombre_articulo || '').trim()
            if (!ref || (m.estado || '').toLowerCase().includes('destruido')) continue
            if (!refMap[ref]) refMap[ref] = []
            refMap[ref].push((m.serial || '').trim())
        }

        // 2. Reparaciones activas actuales en BD_moldes
        const { data: bdActivos } = await supabase
            .from('BD_moldes')
            .select('"CODIGO MOLDE", ESTADO')

        const activosSet = new Set<string>()
        for (const r of (bdActivos || [])) {
            const estado = (r['ESTADO'] || '').toLowerCase()
            if (estado.includes('reparacion') || estado.includes('espera')) {
                activosSet.add((r['CODIGO MOLDE'] || '').trim().toUpperCase())
            }
        }

        // 3. Histórico: eventos que empezaron antes del fin del rango
        const { data: histRaw } = await supabase
            .from('base_datos_historico_moldes')
            .select('codigo_molde, fecha_entrada, fecha_entrega, estado, id')
            .lte('fecha_entrada', dateRange.end)

        // Deduplicar por (codigo_molde | fecha_entrada): mayor ID gana
        const eventMap: Record<string, any> = {}
        for (const r of (histRaw || [])) {
            const key = `${(r.codigo_molde || '').trim().toUpperCase()}|${r.fecha_entrada}`
            if (!eventMap[key] || r.id > eventMap[key].id) eventMap[key] = r
        }

        // Agrupar eventos por serial
        const eventsBySerial: Record<string, any[]> = {}
        for (const r of Object.values(eventMap)) {
            const serial = (r.codigo_molde || '').trim().toUpperCase()
            if (!eventsBySerial[serial]) eventsBySerial[serial] = []
            eventsBySerial[serial].push(r)
        }

        const rangeStart = new Date(dateRange.start + 'T00:00:00')
        const rangeEnd   = new Date(dateRange.end   + 'T00:00:00')

        const results: IndisponibilidadRow[] = []

        for (const [ref, serials] of Object.entries(refMap)) {
            const totalMoldes = serials.length
            if (totalMoldes === 0) continue

            let enReparacionActual = 0
            let totalDiasFuera = 0

            for (const serial of serials) {
                const serialUpper = serial.toUpperCase()
                if (activosSet.has(serialUpper)) enReparacionActual++

                for (const r of (eventsBySerial[serialUpper] || [])) {
                    const estadoNorm = (r.estado || '').toLowerCase()
                    if (!r.fecha_entrada || !(estadoNorm.includes('reparacion') || estadoNorm.includes('espera'))) continue

                    const start  = new Date(r.fecha_entrada + 'T00:00:00')
                    const endRaw = r.fecha_entrega ? new Date(r.fecha_entrega + 'T00:00:00') : new Date(today + 'T00:00:00')

                    const overlapStart = start  > rangeStart ? start  : rangeStart
                    const overlapEnd   = endRaw < rangeEnd   ? endRaw : rangeEnd

                    if (overlapEnd < overlapStart) continue
                    const dias = Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 86400000) + 1
                    totalDiasFuera += Math.max(0, dias)
                }
            }

            const promedioDiasFuera = totalDiasFuera / totalMoldes
            const indice = (promedioDiasFuera / daysInMonth) * 100

            if (indice > 0) {
                results.push({ referencia: ref, promedioDiasFuera, totalMoldes, enReparacionActual, indice, daysInMonth })
            }
        }

        return results.sort((a, b) => b.indice - a.indice)
    },

    /**
     * MIGRATED TO base_datos_historico_moldes
     */
    async getKPIs(dateRange: { start: string; end: string }): Promise<IndicatorStats & { atrasadosPrevios: MoldIndicatorRow[] }> {
        const supabase = createClient()
        
        const ACTIVE_STATES = [
            'En reparación', 'En reparacion', 'EN REPARACION',
            'En espera - Produccion', 'En espera - Producción', 'En espera produccion', 'EN ESPERA - PRODUCCION',
            'En espera - Moldes', 'En espera - reparación', 'En espera moldes', 'EN ESPERA - MOLDES',
        ]

        // 1. Fetch data from historical table
        // We fetch a slightly broader range to ensure we don't miss transitions, but deduplication handles it
        const { data: allHistorical, error } = await supabase
            .from('base_datos_historico_moldes')
            .select('*')
            .or(`fecha_esperada.gte.${dateRange.start},fecha_entrega.gte.${dateRange.start}`)

        if (error) {
            console.error('[Indicators/General] Error fetching historical:', error)
            throw error
        }

        const deduplicated = deduplicateHistoricalRecords((allHistorical || []) as HistoricalMoldRaw[])

        // A. Comprometidos: FECHA ESPERADA in range
        const comprometidosRaw = deduplicated.filter(r => 
            r.fecha_esperada && r.fecha_esperada >= dateRange.start && r.fecha_esperada <= dateRange.end
        )

        // B. Entregados: FECHA ENTREGA in range, o DESTRUIDO (usa fecha_entrega si existe, sino fecha_esperada)
        const isResuelto = (r: HistoricalMoldRaw) => {
            const estado = (r.estado || '').toLowerCase()
            const isDestruido = estado.includes('destruido')
            const fechaRef = r.fecha_entrega || (isDestruido ? r.fecha_esperada : null)
            return fechaRef && fechaRef >= dateRange.start && fechaRef <= dateRange.end
        }
        const entregadosRaw = deduplicated.filter(isResuelto)

        // C. Atrasados previos: Esperados antes del inicio y que sigan activos (destruido NO es atrasado)
        const atrasadosRaw = deduplicated.filter(r => {
            const estado = (r.estado || '').toLowerCase()
            return r.fecha_esperada && r.fecha_esperada < dateRange.start
                && ACTIVE_STATES.includes(r.estado || '')
                && !estado.includes('destruido')
        })

        const comprometidos = comprometidosRaw.map(mapHistoricalRow)
        const entregados = entregadosRaw.map(mapHistoricalRow)
        const atrasadosPrev = atrasadosRaw.map(mapHistoricalRow)

        // Unificar para la lista de detalles: Comprometidos + Entregados fuera de fecha esperada
        const todosMap: Record<string, MoldIndicatorRow> = {}
        comprometidos.forEach(r => { todosMap[r.id] = r })
        entregados.forEach(r => { todosMap[r.id] = r })
        const detallesUnificados = Object.values(todosMap).sort((a,b) => 
            (a.fecha_esperada || '').localeCompare(b.fecha_esperada || '')
        )

        const totalComprometidas = comprometidos.length
        const totalEntregadasATiempo = entregados.filter(e => {
            // Solo cuenta como "A tiempo" si se entregó en el rango Y estaba comprometida
            return comprometidos.some(c => c.id === e.id)
        }).length
        
        const totalPendientes = comprometidos.filter(r => {
            const isDestruido = (r.estado || '').toLowerCase().includes('destruido')
            return !r.fecha_entrega && !isDestruido
        }).length
        const nivelServicio = totalComprometidas > 0
            ? (totalEntregadasATiempo / totalComprometidas) * 100
            : 0

        return {
            comprometidos,
            entregados,
            atrasadosPrevios: atrasadosPrev,
            detalles: detallesUnificados,
            totalComprometidas,
            totalEntregadasATiempo,
            totalPendientes,
            nivelServicio,
            desglosePorCategoria: calcCategoryBreakdown(detallesUnificados),
        }
    },

    /**
     * MIGRATED TO base_datos_historico_moldes
     */
    async getRapidaKPIs(
        dateRange: { start: string; end: string },
        operariosPorDia: Record<string, number>
    ): Promise<RapidaKPIResult> {
        const supabase = createClient()

        const totalOperarios = Object.values(operariosPorDia).reduce((a, b) => a + b, 0)
        const numDays   = getDatesInRange(dateRange.start, dateRange.end).length
        const metaTotal = 24 * numDays
        const metaPorPersona = 3.4

        // 1. Fetch from Historical with strict Date and Type filters
        const { data: rawHistory, error: errRapida } = await supabase
            .from('base_datos_historico_moldes')
            .select('*')
            .or(`tipo_de_reparacion.ilike.%rapida%,tipo_de_reparacion.ilike.%rápida%,tipo_de_reparacion.ilike.%desmanch%,tipo_de_reparacion.ilike.%brill%,defectos_a_reparar.ilike.%rapida%,defectos_a_reparar.ilike.%rápida%,defectos_a_reparar.ilike.%desmanch%,defectos_a_reparar.ilike.%brill%`)
            .or(`and(fecha_entrega.gte.${dateRange.start},fecha_entrega.lte.${dateRange.end}),and(fecha_esperada.gte.${dateRange.start},fecha_esperada.lte.${dateRange.end})`)

        if (errRapida) {
            console.error('[Indicators/Rapida] Error fetching historical:', errRapida.message)
            throw errRapida
        }

        const deduplicated = deduplicateHistoricalRecords((rawHistory || []) as HistoricalMoldRaw[])

        // 2. Load Plant Map (for MS/FV classification)
        const { data: plantaData } = await supabase
            .from('planta_moldes')
            .select('numero_de_serie, planta')
            .limit(5000)

        const normalizeSerial = (s: string) => s.replace(/^0+/, '').replace(/[^A-Z0-9]/gi, '').toUpperCase()
        const plantaMap: Record<string, string> = {}
        for (const p of (plantaData || [])) {
            if (p.numero_de_serie && p.planta) {
                plantaMap[normalizeSerial(String(p.numero_de_serie))] = String(p.planta).trim().toUpperCase()
            }
        }

        // 3. Process Reparados (Delivered in range)
        const reparadosEnRangoRaw = deduplicated.filter(r => {
            const fEntrega = r.fecha_entrega
            const tipo = String(r.tipo_de_reparacion || '').toUpperCase()
            const status = (r.estado || '').toString().toLowerCase()
            const defs = String(r.defectos_a_reparar || '').toUpperCase()
            const isTargetType = tipo.includes('RAPIDA') || tipo.includes('RÁPIDA') || tipo.includes('DESMANCH') || tipo.includes('BRILL') || 
                                 defs.includes('RAPIDA') || defs.includes('RÁPIDA') || defs.includes('DESMANCH') || defs.includes('BRILL')
            return isTargetType && fEntrega && status.includes('entrega') && dayjs(fEntrega).isBetween(dateRange.start, dateRange.end, 'day', '[]')
        })

        let countMS = 0
        let countFV = 0
        let countDesmanchadoMS = 0
        let countDesmanchadoFV = 0
        let countDesmanchado = 0
        let weightedTotal = 0
        const reparadosFormatted: any[] = []

        for (const r of reparadosEnRangoRaw) {
            const { desmanchado, brillado } = classifyDefecto(r.defectos_a_reparar, r.tipo_de_reparacion)
            let tipoCalculado = 'Otros'
            const serial = normalizeSerial(String(r.codigo_molde || ''))
            const plantaVal = plantaMap[serial] || ''
            const isMS = plantaVal.includes('MS')
            const isFV = plantaVal.includes('FV')

            if (desmanchado) {
                countDesmanchado++
                if (isFV) {
                    countDesmanchadoFV++
                    weightedTotal += 1 / 2
                    tipoCalculado = 'Desmanchado FV'
                } else {
                    countDesmanchadoMS++
                    weightedTotal += 1 / 3
                    tipoCalculado = 'Desmanchado MS'
                }
            } else if (brillado) {
                weightedTotal += 0.5
                tipoCalculado = 'Brillado'
            } else {
                if (isMS) {
                    countMS++
                    weightedTotal += 1
                    tipoCalculado = 'MS'
                } else if (isFV) {
                    countFV++
                    weightedTotal += 1
                    tipoCalculado = 'FV'
                } else {
                    weightedTotal += 1
                    tipoCalculado = 'S/C'
                }
            }

            reparadosFormatted.push({
                id: r.id,
                codigo: r.codigo_molde,
                titulo: r.titulo,
                tipo_reparacion: r.tipo_de_reparacion,
                tipo_calculado: tipoCalculado,
                fecha_entrada: r.fecha_entrada,
                fecha_esperada: r.fecha_esperada,
                fecha_entrega: r.fecha_entrega,
                defectos: r.defectos_a_reparar || ''
            })
        }

        const totalMoldesReparados = weightedTotal

        // 4. ESPERADOS — Se leen de BD_moldes (estado actual) para evitar registros fantasma
        // del histórico cuando un molde fue re-registrado con distinta fecha_esperada.
        const { data: bdEsperadosRaw } = await supabase
            .from('BD_moldes')
            .select('"CODIGO MOLDE", "Título", "FECHA ENTRADA", "FECHA ESPERADA", "FECHA ENTREGA", ESTADO, "Tipo de reparacion", "DEFECTOS A REPARAR", Responsable')
            .gte('"FECHA ESPERADA"', dateRange.start)
            .lte('"FECHA ESPERADA"', dateRange.end)
            .or('"Tipo de reparacion".ilike.%rapida%,"Tipo de reparacion".ilike.%rápida%,"Tipo de reparacion".ilike.%desmanch%,"Tipo de reparacion".ilike.%brill%,"DEFECTOS A REPARAR".ilike.%rapida%,"DEFECTOS A REPARAR".ilike.%rápida%,"DEFECTOS A REPARAR".ilike.%desmanch%,"DEFECTOS A REPARAR".ilike.%brill%')

        const esperadosRows: MoldIndicatorRow[] = (bdEsperadosRaw || []).map((r: any) => ({
            id: 0,
            serial: r['CODIGO MOLDE'] || '',
            nombre_articulo: r['Título'] || '',
            fecha_entrada: r['FECHA ENTRADA'] ?? null,
            fecha_esperada: r['FECHA ESPERADA'] ?? null,
            fecha_entrega: r['FECHA ENTREGA'] ?? null,
            estado: r['ESTADO'] || '',
            tipo_de_reparacion: r['Tipo de reparacion'] || '',
            tipo: '',
            defectos: r['DEFECTOS A REPARAR'] || '',
            responsable: r['Responsable'] || '',
        }))
        const moldesEsperados = esperadosRows.length

        // Conjunto de códigos comprometidos para cruzar con entregados
        const esperadosCodigos = new Set(esperadosRows.map(r => (r.serial || '').trim().toUpperCase()))

        // 5. ENTREGADOS — Del histórico, dentro del período, cruzados contra esperados actuales
        const entregadosRows = deduplicated.filter(r => {
            const status = (r.estado || '').toLowerCase()
            const isDestruido = status.includes('destruido')
            const isEntregado = status.includes('entrega')
            if (!isEntregado && !isDestruido) return false
            const fechaRef = r.fecha_entrega || (isDestruido ? r.fecha_esperada : null)
            if (!fechaRef) return false
            const codigoNorm = (r.codigo_molde || '').trim().toUpperCase()
            return esperadosCodigos.has(codigoNorm) && dayjs(fechaRef).isSameOrBefore(dayjs(dateRange.end), 'day')
        })
        const moldesEntregados = entregadosRows.length

        const productividad   = metaTotal > 0       ? totalMoldesReparados / metaTotal    : 0
        const nivelServicio   = moldesEsperados > 0  ? moldesEntregados / moldesEsperados  : 0
        const productividadHH = totalOperarios > 0   ? totalMoldesReparados / totalOperarios : 0

        return {
            totalMoldesReparados,
            countMS, countFV,
            countDesmanchadoMS, countDesmanchadoFV,
            countDesmanchado,
            moldesEsperados, moldesEntregados,
            metaTotal, metaPorPersona, totalOperarios, numDays,
            productividad, nivelServicio, productividadHH,
            reparados: reparadosFormatted,
            esperadosList: esperadosRows,
            entregadosList: entregadosRows.map(mapHistoricalRow)
        }
    },

    getDatesInRange,
}
