import { createClient } from '@/lib/supabase'
import { MoldActive } from './molds.service'

export interface IndicatorStats {
    totalComprometidas: number
    totalEntregadasATiempo: number
    totalPendientes: number
    nivelServicio: number
    desglosePorCategoria: Record<string, number>
    detalles: MoldActive[]
}

export const indicatorsService = {
    async getKPIs(dateRange: { start: string, end: string }, classification?: string): Promise<IndicatorStats> {
        const supabase = createClient()

        let query = supabase
            .from('Base_datos_moldes_dinámica')
            .select('*')
            .gte('FECHA ESPERADA', dateRange.start)
            .lte('FECHA ESPERADA', dateRange.end)

        const { data, error } = await query
        if (error) throw error

        const molds = data as MoldActive[]

        // Entregados a tiempo: FECHA ENTREGA <= FECHA ESPERADA
        const entregadasATiempo = molds.filter(m => {
            if (!m["FECHA ENTREGA"]) return false
            const entrega = new Date(m["FECHA ENTREGA"])
            const esperada = new Date(m["FECHA ESPERADA"])
            return entrega <= esperada
        })

        const pendientes = molds.filter(m => !m["FECHA ENTREGA"] || m["ESTADO"] !== 'ENTREGADO')

        const totalComprometidas = molds.length
        const totalEntregadasATiempo = entregadasATiempo.length
        const totalPendientes = pendientes.length
        const nivelServicio = totalComprometidas > 0 ? (totalEntregadasATiempo / totalComprometidas) * 100 : 0

        // Desglose por categoría
        const categorias = {
            'REPARACION_RAPIDA': 0,
            'REPARACION_ESPECIAL': 0,
            'MOLDE_NUEVO': 0,
            'MODELO_NUEVO': 0
        }

        molds.forEach(m => {
            const tipo = (m["Tipo de reparacion"] || '').toUpperCase().trim()
            const defecto = (m["DEFECTOS A REPARAR"] || '').toUpperCase().trim()

            if (defecto === 'MOLDE NUEVO') {
                categorias['MOLDE_NUEVO']++
            } else if (tipo === 'REPARACIÓN RÁPIDA') {
                categorias['REPARACION_RAPIDA']++
            } else if (tipo === 'REPARACIÓN ESPECIAL') {
                categorias['REPARACION_ESPECIAL']++
            } else if (tipo === 'MODELO NUEVO') {
                categorias['MODELO_NUEVO']++
            }
        })

        return {
            totalComprometidas,
            totalEntregadasATiempo,
            totalPendientes,
            nivelServicio,
            desglosePorCategoria: categorias as any,
            detalles: molds
        }
    }
}
