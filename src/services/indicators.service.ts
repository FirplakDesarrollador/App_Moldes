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

        // Soporte para ambos formatos de nombre (snake_case y ESPACIOS MAYÚSCULAS)
        const codigo = r.codigo_molde || r['CODIGO MOLDE'] || '';
        const fecha = r.fecha_entrada || r['FECHA ENTRADA'] || '';
        const tipo = r.tipo_de_reparacion || r['Tipo de reparacion'] || '';

        const tipoNorm = norm(tipo).replace('Á', 'A').replace('É', 'E').replace('Í', 'I').replace('Ó', 'O').replace('Ú', 'U');
        
        // Clave única robusta
        const key = `${norm(codigo)}|${fecha}|${tipoNorm}`

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
export const indicatorsService = {
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

        // B. Entregados: FECHA ENTREGA in range
        const entregadosRaw = deduplicated.filter(r => 
            r.fecha_entrega && r.fecha_entrega >= dateRange.start && r.fecha_entrega <= dateRange.end
        )

        // C. Atrasados previos: Esperados antes del inicio y que sigan activos en el historial más reciente
        const atrasadosRaw = deduplicated.filter(r => 
            r.fecha_esperada && r.fecha_esperada < dateRange.start && ACTIVE_STATES.includes(r.estado || '')
        )

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
        
        const totalPendientes = comprometidos.filter(r => !r.fecha_entrega).length
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
        
        // 4. Esperados en Rango
        const esperadosRows = deduplicated.filter(r => {
            const fes = r.fecha_esperada
            return fes && dayjs(fes).isBetween(dateRange.start, dateRange.end, 'day', '[]')
        })
        const moldesEsperados = esperadosRows.length

        // 5. Entregados a Tiempo (Esperados en rango y entregados antes del fin del rango)
        const entregadosRows = deduplicated.filter(r => {
            const fe  = r.fecha_entrega
            const fes = r.fecha_esperada
            const status = (r.estado || '').toLowerCase()
            if (!fe || !fes || !status.includes('entrega')) return false
            return (dayjs(fes).isBetween(dateRange.start, dateRange.end, 'day', '[]') && dayjs(fe).isSameOrBefore(dayjs(dateRange.end), 'day'))
        })
        const moldesEntregados = entregadosRows.length

        const productividad   = metaTotal > 0     ? totalMoldesReparados / metaTotal    : 0
        const nivelServicio   = moldesEsperados > 0 ? moldesEntregados / moldesEsperados : 0
        const productividadHH = totalOperarios > 0  ? totalMoldesReparados / totalOperarios : 0

        return {
            totalMoldesReparados,
            countMS, countFV, 
            countDesmanchadoMS, countDesmanchadoFV,
            countDesmanchado,
            moldesEsperados, moldesEntregados,
            metaTotal, metaPorPersona, totalOperarios, numDays,
            productividad, nivelServicio, productividadHH,
            reparados: reparadosFormatted,
            esperadosList: esperadosRows.map(mapHistoricalRow),
            entregadosList: entregadosRows.map(mapHistoricalRow)
        }
    },

    getDatesInRange,
}
