import { createClient } from '@/lib/supabase'

export interface MoldActive {
    id?: string
    nombre: string
    codigo: string
    estado: 'En espera en moldes' | 'En reparación' | 'En espera en producción' | 'Destruido'
    defectos: string[]
    tipo_reparacion: 'Reparación rápida' | 'Reparación especial' | 'Molde nuevo'
    fecha_entrada: string
    fecha_entrega_esperada: string
    observaciones: string
    comentario_seguimiento?: string
    created_at?: string
    created_by?: string
}

export const moldsService = {
    async getActiveMolds() {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('moldes_activos')
            .select('*')
            .order('fecha_entrada', { ascending: false })

        if (error) throw error
        return data as MoldActive[]
    },

    async addMold(mold: MoldActive) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('moldes_activos')
            .insert([mold])
            .select()

        if (error) throw error
        return data[0]
    },

    async updateComment(id: string, comment: string) {
        const supabase = createClient()
        const { error } = await supabase
            .from('moldes_activos')
            .update({ comentario_seguimiento: comment })
            .eq('id', id)

        if (error) throw error
    },

    async updateStatus(id: string, status: string) {
        const supabase = createClient()
        const { error } = await supabase
            .from('moldes_activos')
            .update({ estado: status })
            .eq('id', id)

        if (error) throw error
    },

    async getDefectsCatalog() {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('Defectos moldes')
            .select('Título, Tiempo')
            .order('Título', { ascending: true })

        if (error) {
            console.error('Error fetching defects catalog:', error)
            return []
        }
        return data
    },

    async searchHistory(filters: { titles?: string[], defects?: string[], types?: string[] }) {
        const supabase = createClient()
        let query = supabase.from('moldes_activos').select('*')

        if (filters.titles && filters.titles.length > 0) {
            query = query.in('nombre', filters.titles)
        }
        if (filters.types && filters.types.length > 0) {
            query = query.in('tipo_reparacion', filters.types)
        }
        // Defects filtering might require a more complex approach if stored as array
        // For now, simple filter

        const { data, error } = await query.order('created_at', { ascending: false })
        if (error) throw error
        return data as MoldActive[]
    }
}
