import { createClient } from '@/lib/supabase'

export interface AuditRecord {
    id?: string
    id_molde: string
    fecha: string
    pregunta_id: string
    seccion: string
    pregunta: string
    ejecutado: boolean
    responsable_id: string | number
    responsable_nombre: string
    comentario?: string
    usuario_registro: string
    created_at?: string
}

export const auditService = {
    async getPersonnel() {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('Personal app moldes')
            .select('Nombre, Cedula')
            .order('Nombre', { ascending: true })
        if (error) throw error
        return data || []
    },

    async saveAuditBatch(records: AuditRecord[]) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('Auditoria_Moldes')
            .insert(records)
            .select()
        if (error) throw error
        return data
    }
}
