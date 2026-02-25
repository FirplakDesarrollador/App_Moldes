import { createClient } from '@/lib/supabase'
import { MoldActive } from './molds.service'

export interface IndicatorData {
    totalComprometidas: number
    totalEntregadas: number
    nivelServicio: number
    detalles: MoldActive[]
}

export const indicatorsService = {
    async getIndicatorStats(dateRange: { start: string, end: string }, type?: string): Promise<IndicatorData> {
        const supabase = createClient()

        let query = supabase
            .from('moldes_activos')
            .select('*')
            .gte('fecha_entrega_esperada', dateRange.start)
            .lte('fecha_entrega_esperada', dateRange.end)

        if (type) {
            query = query.eq('tipo_reparacion', type)
        }

        const { data, error } = await query
        if (error) throw error

        const molds = data as MoldActive[]

        // Logic for "delivered" needs to be defined based on status
        const entregadas = molds.filter(m => m.estado === 'En espera en producción' || m.estado === 'Destruido')

        const totalComprometidas = molds.length
        const totalEntregadas = entregadas.length
        const nivelServicio = totalComprometidas > 0 ? (totalEntregadas / totalComprometidas) * 100 : 0

        return {
            totalComprometidas,
            totalEntregadas,
            nivelServicio,
            detalles: molds
        }
    }
}
