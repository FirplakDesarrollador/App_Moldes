import { createIndicatorsClient } from '@/lib/indicatorsSupabase'
import { IndicatorStats, MoldIndicatorRow } from './indicators.service'

const TABLE = 'indicadores_fabricacion_moldes'
const TYPE = 'REPARACION_ESPECIAL'

// Match the category precedence used by the indicators page.
function isSpecial(row: MoldIndicatorRow) {
    const tipo = (row.tipo || '').toUpperCase()
    const repair = (row.tipo_de_reparacion || '').toUpperCase()
    return tipo !== 'MOLDE NUEVO' && !repair.includes('MODELO') &&
        !repair.includes('RAPIDA') && !repair.includes('RÁPIDA') && repair.includes('ESPECIAL')
}

export function buildDailyIndicators(stats: IndicatorStats, dates: string[], operators: Record<string, number>, planta: string, user: string) {
    const committed = stats.comprometidos.filter(isSpecial)
    const delivered = stats.entregados.filter(isSpecial)
    const calculatedAt = new Date().toISOString()
    return dates.map(fecha => {
        const ops = operators[fecha]
        if (!Number.isSafeInteger(ops) || ops < 0) throw new Error(`Operarios inválidos para ${fecha}.`)
        const comp = committed.filter(row => row.fecha_esperada === fecha)
        const entr = delivered.filter(row => row.fecha_entrega === fecha)
        const fulfilled = comp.filter(row => row.fecha_entrega && row.fecha_esperada && row.fecha_entrega <= row.fecha_esperada).length
        return {
            fecha, planta, tipo_reparacion: TYPE, operarios_activos: ops,
            moldes_comprometidos: comp.length,
            moldes_entregados: entr.length,
            entregados_anticipados: entr.filter(row => row.fecha_esperada && row.fecha_entrega! < row.fecha_esperada).length,
            entregados_en_fecha: entr.filter(row => row.fecha_esperada && row.fecha_entrega === row.fecha_esperada).length,
            entregados_tarde: entr.filter(row => row.fecha_esperada && row.fecha_entrega! > row.fecha_esperada).length,
            entregados_sin_fecha_esperada: entr.filter(row => !row.fecha_esperada).length,
            comprometidos_cumplidos: fulfilled,
            comprometidos_pendientes: comp.filter(row => !row.fecha_entrega).length,
            // Existing page equations, applied to each individual day.
            nivel_servicio_pct: comp.length > 0 ? (fulfilled / comp.length) * 100 : 0,
            productividad: ops > 0 ? entr.length / ops : 0,
            actualizado_por: user,
            calculado_en: calculatedAt,
        }
    })
}

export const dailyIndicatorsService = {
    async load(start: string, end: string, planta: string) {
        const { data, error } = await createIndicatorsClient().from(TABLE)
            .select('fecha,operarios_activos').eq('planta', planta).eq('tipo_reparacion', TYPE)
            .gte('fecha', start).lte('fecha', end)
        if (error) throw error
        return data || []
    },
    async save(rows: ReturnType<typeof buildDailyIndicators>) {
        const { error } = await createIndicatorsClient().from(TABLE)
            .upsert(rows, { onConflict: 'fecha,planta,tipo_reparacion' })
        if (error) throw error
    },
}
