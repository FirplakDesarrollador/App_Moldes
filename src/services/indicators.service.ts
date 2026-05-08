// PV_MOLDES V2.4
import { createClient } from '@/lib/supabase'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'

dayjs.extend(isBetween)
dayjs.extend(isSameOrBefore)

// ── Raw row from BD_moldes ────────────────────────────────────────────────────
export interface BDMoldRaw {
    id: number
    "Título": string | null
    "CODIGO MOLDE": string | null
    "FECHA ENTRADA": string | null
    "FECHA ESPERADA": string | null
    "FECHA ENTREGA": string | null
    "ESTADO": string | null
    "DEFECTOS A REPARAR": string | null
    "Tipo de reparacion": string | null
    "Tipo": string | null
    "Responsable": string | null
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
}

// ── IndicatorStats includes both data sets ────────────────────────────────────
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
    totalMoldesReparados: number   // weighted: MS+FV + brillados*0.5 + desmanchados*0.333
    countMS: number
    countFV: number
    countDesmanchadoMS: number     // new: MS desmanchados (weight 1/3)
    countDesmanchadoFV: number     // new: FV desmanchados (weight 1/2)
    countDesmanchado: number       // total raw count (for compatibility)
    moldesEsperados: number        // FECHA ESPERADA in range
    moldesEntregados: number       // FECHA ENTREGA in range AND FECHA ESPERADA <= range end
    metaTotal: number              // 24 × numDays
    metaPorPersona: number         // fixed 3.4
    totalOperarios: number         // sum of daily operators
    numDays: number
    productividad: number          // totalMoldesReparados / metaTotal
    nivelServicio: number          // moldesEntregados / moldesEsperados
    productividadHH: number        // totalMoldesReparados / totalOperarios
    reparados: any[]               // Detailed list of repaired molds
    esperadosList: any[]           // New: Detailed list of expected molds
    entregadosList: any[]          // New: Detailed list of delivered (at time) molds
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function mapRow(m: BDMoldRaw): MoldIndicatorRow {
    return {
        id:               m.id,
        serial:           m["CODIGO MOLDE"]      || '',
        nombre_articulo:  m["Título"]            || '',
        fecha_esperada:   m["FECHA ESPERADA"]    ?? null,
        fecha_entrega:    m["FECHA ENTREGA"]     ?? null,
        fecha_entrada:    m["FECHA ENTRADA"]     ?? null,
        estado:           m["ESTADO"]            || 'PROCESO',
        tipo_de_reparacion: m["Tipo de reparacion"] || '',
        tipo:             m["Tipo"]              || '',
        defectos:         m["DEFECTOS A REPARAR"] || '',
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

/** Generate all dates between start and end (inclusive), YYYY-MM-DD */
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

/** Detect brillado/desmanchado from defectos string */
function classifyDefecto(defectos: string | null): { desmanchado: boolean } {
    const d = (defectos || '').toLowerCase()
    return {
        desmanchado: d.includes('desmanch'),
    }
}

// ── Service ───────────────────────────────────────────────────────────────────
export const indicatorsService = {
    /**
     * Performs independent queries for the general dashboard:
     *   Set A – "comprometidos": FECHA ESPERADA in [start, end]
     *   Set B – "entregados":    FECHA ENTREGA  in [start, end]
     *   Set C - "atrasadosPrevios": FECHA ESPERADA < start AND status active
     */
    async getKPIs(dateRange: { start: string; end: string }): Promise<IndicatorStats & { atrasadosPrevios: MoldIndicatorRow[] }> {
        const supabase = createClient()
        
        const ACTIVE_STATES = [
            'En reparación', 'En reparacion', 'EN REPARACION',
            'En espera - Produccion', 'En espera - Producción', 'En espera produccion', 'EN ESPERA - PRODUCCION',
            'En espera - Moldes', 'En espera - reparación', 'En espera moldes', 'EN ESPERA - MOLDES',
        ]

        // A. Comprometidos en el rango
        const { data: dataA, error: errA } = await supabase
            .from('BD_moldes')
            .select('*')
            .not('"FECHA ESPERADA"', 'is', null)
            .gte('"FECHA ESPERADA"', dateRange.start)
            .lte('"FECHA ESPERADA"', dateRange.end)
            .order('"FECHA ESPERADA"', { ascending: true })

        if (errA) { console.error('[Indicators] Error fetching comprometidos:', errA.message); throw errA }

        // B. Entregados en el rango
        const { data: dataB, error: errB } = await supabase
            .from('BD_moldes')
            .select('*')
            .not('"FECHA ENTREGA"', 'is', null)
            .gte('"FECHA ENTREGA"', dateRange.start)
            .lte('"FECHA ENTREGA"', dateRange.end)

        if (errB) { console.error('[Indicators] Error fetching entregados:', errB.message); throw errB }

        // C. Atrasados previos (Esperados antes del inicio y que sigan activos)
        const { data: dataC, error: errC } = await supabase
            .from('BD_moldes')
            .select('*')
            .lt('"FECHA ESPERADA"', dateRange.start)
            .in('ESTADO', ACTIVE_STATES)

        if (errC) { console.error('[Indicators] Error fetching atrasados previos:', errC.message); throw errC }

        const comprometidos   = ((dataA || []) as BDMoldRaw[]).map(mapRow)
        const entregados      = ((dataB || []) as BDMoldRaw[]).map(mapRow)
        const atrasadosPrev   = ((dataC || []) as BDMoldRaw[]).map(mapRow)

        const totalComprometidas     = comprometidos.length
        const totalEntregadasATiempo = entregados.length
        const totalPendientes        = comprometidos.filter(r => !r.fecha_entrega).length
        const nivelServicio          = totalComprometidas > 0
            ? (totalEntregadasATiempo / totalComprometidas) * 100
            : 0

        return {
            comprometidos,
            entregados,
            atrasadosPrevios: atrasadosPrev,
            detalles: comprometidos,
            totalComprometidas,
            totalEntregadasATiempo,
            totalPendientes,
            nivelServicio,
            desglosePorCategoria: calcCategoryBreakdown(comprometidos),
        }
    },

    async getRapidaKPIs(
        dateRange: { start: string; end: string },
        operariosPorDia: Record<string, number>
    ): Promise<RapidaKPIResult> {
        const supabase = createClient()

        const totalOperarios = Object.values(operariosPorDia).reduce((a, b) => a + b, 0)
        const numDays   = getDatesInRange(dateRange.start, dateRange.end).length
        const metaTotal = 24 * numDays
        const metaPorPersona = 3.4

        const { data: allRapida, error: errRapida } = await supabase
            .from('BD_moldes')
            .select('"id", "Título", "CODIGO MOLDE", "DEFECTOS A REPARAR", "FECHA ENTRADA", "FECHA ESPERADA", "FECHA ENTREGA", "ESTADO", "Tipo de reparacion"')
            .or('"Tipo de reparacion".ilike.%rapida%,"Tipo de reparacion".ilike.%rápida%')

        if (errRapida) {
            console.error('[Indicators/Rapida] Error fetching BD_moldes:', errRapida.message)
            throw errRapida
        }

        const rows = (allRapida || []) as any[]

        const { data: plantaData } = await supabase
            .from('planta_moldes')
            .select('numero_de_serie, planta')
            .limit(5000)

        const normalize = (s: string) => s.replace(/^0+/, '').replace(/[^A-Z0-9]/gi, '').toUpperCase()
        const plantaMap: Record<string, string> = {}
        for (const p of (plantaData || [])) {
            if (p.numero_de_serie && p.planta) {
                plantaMap[normalize(String(p.numero_de_serie))] = String(p.planta).trim().toUpperCase()
            }
        }

        const reparadosEnRangoRaw = rows.filter(r => {
            const fEntrega = r['FECHA ENTREGA']
            const tipo = String(r['Tipo de reparacion'] || '').toUpperCase()
            const status = (r['ESTADO'] || '').toString().toLowerCase()
            return (tipo.includes('RAPIDA') || tipo.includes('RÁPIDA')) && fEntrega && status.includes('entrega') && dayjs(fEntrega).isBetween(dateRange.start, dateRange.end, 'day', '[]')
        })

        let countMS = 0
        let countFV = 0
        let countDesmanchadoMS = 0
        let countDesmanchadoFV = 0
        let countDesmanchado = 0
        let weightedTotal = 0
        const reparadosFormatted: any[] = []

        for (const r of reparadosEnRangoRaw) {
            const defectStr = (r['DEFECTOS A REPARAR'] || '').toLowerCase()
            if (defectStr.includes('brill')) continue;

            const { desmanchado } = classifyDefecto(r['DEFECTOS A REPARAR'])
            let tipoCalculado = 'Otros'
            const serial = normalize(String(r['CODIGO MOLDE'] || ''))
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
                codigo: r['CODIGO MOLDE'],
                titulo: r['Título'],
                tipo_reparacion: r['Tipo de reparacion'],
                tipo_calculado: tipoCalculado,
                fecha_entrada: r['FECHA ENTRADA'],
                fecha_esperada: r['FECHA ESPERADA'],
                fecha_entrega: r['FECHA ENTREGA'],
                defectos: r['DEFECTOS A REPARAR'] || ''
            })
        }

        const totalMoldesReparados = weightedTotal
        const esperadosRows = rows.filter((r: any) => {
            const fes = r['FECHA ESPERADA']
            return fes && dayjs(fes).isBetween(dateRange.start, dateRange.end, 'day', '[]')
        })
        const moldesEsperados = esperadosRows.length

        const entregadosRows = rows.filter((r: any) => {
            const fe  = r['FECHA ENTREGA']
            const fes = r['FECHA ESPERADA']
            if (!fe || !fes) return false
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
            esperadosList: esperadosRows.map(mapRow),
            entregadosList: entregadosRows.map(mapRow)
        }
    },

    getDatesInRange,
}
