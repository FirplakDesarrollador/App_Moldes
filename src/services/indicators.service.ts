// PV_MOLDES V2.4
import { createClient } from '@/lib/supabase'

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
    estado: string
    tipo_de_reparacion: string
    tipo: string
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
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function mapRow(m: BDMoldRaw): MoldIndicatorRow {
    return {
        id:               m.id,
        serial:           m["CODIGO MOLDE"]      || '',
        nombre_articulo:  m["Título"]            || '',
        fecha_esperada:   m["FECHA ESPERADA"]    ?? null,
        fecha_entrega:    m["FECHA ENTREGA"]     ?? null,
        estado:           m["ESTADO"]            || 'PROCESO',
        tipo_de_reparacion: m["Tipo de reparacion"] || '',
        tipo:             m["Tipo"]              || '',
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
     * Performs TWO independent queries for the general (Especial / Molde Nuevo / etc.) dashboard:
     *   Set A – "comprometidos": FECHA ESPERADA in [start, end]
     *   Set B – "entregados":    FECHA ENTREGA  in [start, end]
     */
    async getKPIs(dateRange: { start: string; end: string }): Promise<IndicatorStats> {
        const supabase = createClient()

        const { data: dataA, error: errA } = await supabase
            .from('BD_moldes')
            .select('*')
            .not('"FECHA ESPERADA"', 'is', null)
            .gte('"FECHA ESPERADA"', dateRange.start)
            .lte('"FECHA ESPERADA"', dateRange.end)
            .order('"FECHA ESPERADA"', { ascending: true })

        if (errA) { console.error('[Indicators] Error fetching comprometidos:', errA.message); throw errA }

        const { data: dataB, error: errB } = await supabase
            .from('BD_moldes')
            .select('*')
            .not('"FECHA ENTREGA"', 'is', null)
            .gte('"FECHA ENTREGA"', dateRange.start)
            .lte('"FECHA ENTREGA"', dateRange.end)

        if (errB) { console.error('[Indicators] Error fetching entregados:', errB.message); throw errB }

        const comprometidos = ((dataA || []) as BDMoldRaw[]).map(mapRow)
        const entregados    = ((dataB || []) as BDMoldRaw[]).map(mapRow)
        const totalComprometidas     = comprometidos.length
        const totalEntregadasATiempo = entregados.length
        const totalPendientes        = comprometidos.filter(r => !r.fecha_entrega).length
        const nivelServicio          = totalComprometidas > 0
            ? (totalEntregadasATiempo / totalComprometidas) * 100
            : 0

        return {
            comprometidos,
            entregados,
            detalles: comprometidos,
            totalComprometidas,
            totalEntregadasATiempo,
            totalPendientes,
            nivelServicio,
            desglosePorCategoria: calcCategoryBreakdown(comprometidos),
        }
    },

    /**
     * Reparación Rápida KPIs
     * - Uses BD_moldes filtered by "Tipo de reparacion" Rapida/Rápida variants
     * - Crosses with planta_moldes for MS/FV classification
     * - Counts brillado/desmanchado separately with weighting
     * - operariosPorDia: Record<'YYYY-MM-DD', number>
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

        // ── Fetch all Rapida records (no date filter here – we filter in JS) ──
        const { data: allRapida, error: errRapida } = await supabase
            .from('BD_moldes')
            .select('"id", "Título", "CODIGO MOLDE", "DEFECTOS A REPARAR", "FECHA ENTRADA", "FECHA ESPERADA", "FECHA ENTREGA", "ESTADO", "Tipo de reparacion"')
            .or('"Tipo de reparacion".ilike.%rapida%,"Tipo de reparacion".ilike.%rápida%')

        if (errRapida) {
            console.error('[Indicators/Rapida] Error fetching BD_moldes:', errRapida.message)
            throw errRapida
        }

        const rows = (allRapida || []) as any[]

        // ── Fetch planta_moldes with high limit to get all 1534+ rows ──────────
        const { data: plantaData } = await supabase
            .from('planta_moldes')
            .select('numero_de_serie, planta')
            .limit(5000)

        // Helper to normalize serials (remove leading zeros and non-alphanum)
        const normalize = (s: string) => s.replace(/^0+/, '').replace(/[^A-Z0-9]/gi, '').toUpperCase()

        const plantaMap: Record<string, string> = {}
        for (const p of (plantaData || [])) {
            if (p.numero_de_serie && p.planta) {
                plantaMap[normalize(String(p.numero_de_serie))] = String(p.planta).trim().toUpperCase()
            }
        }

        // ── Moldes Reparados: Todo lo entregado en el rango (Productividad) ──
        const reparadosEnRangoRaw = rows.filter((r: any) => {
            const fe = r['FECHA ENTREGA']
            // Solo importa que la fecha de entrega real esté en el rango
            return fe && fe >= dateRange.start && fe <= dateRange.end
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
            
            // Si es un brillado, se ignora completamente según instrucción
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
                    // Default to MS weight (1/3) if MS or unknown
                    countDesmanchadoMS++
                    weightedTotal += 1 / 3
                    tipoCalculado = 'Desmanchado MS'
                }
            } else {
                // Regular: classify MS or FV
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
                fecha_entrega: r['FECHA ENTREGA']
            })
        }

        const totalMoldesReparados = weightedTotal

        // ── Moldes Esperados: FECHA ESPERADA in range ─────────────────────────
        const moldesEsperados = rows.filter((r: any) => {
            const fes = r['FECHA ESPERADA']
            return fes && fes >= dateRange.start && fes <= dateRange.end
        }).length

        // ── Moldes Entregados: Comprometidos para este periodo Y ya entregados ──
        const moldesEntregados = rows.filter((r: any) => {
            const fe  = r['FECHA ENTREGA']
            const fes = r['FECHA ESPERADA']
            if (!fe || !fes) return false

            return (fes >= dateRange.start && fes <= dateRange.end && fe <= dateRange.end)
        }).length

        // ── KPIs ──────────────────────────────────────────────────────────────
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
            reparados: reparadosFormatted
        }
    },

    getDatesInRange,
}
