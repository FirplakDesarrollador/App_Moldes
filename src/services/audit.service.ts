import { createClient } from '@/lib/supabase'

// Mapeo detallado de la auditoría según requerimientos
export interface AuditData {
    id?: number
    created_at?: string

    // Auditor (Usuario logueado)
    auditor_id: string | number
    auditor_nombre: string

    // Relación con el molde
    id_molde: string | number

    // 1. Tablet
    tablet_ok: boolean
    tablet_op_id?: number | string

    // 2. Encerado
    encerado_ok: boolean
    encerado_op_id?: number | string

    // 3. Prensado
    prensado_ok: boolean
    prensado_op_id?: number | string
    comentario_prensado?: string // Después de Q3

    // 4. Recuperador de mezcla
    recuperador_ok: boolean
    recuperador_op_id?: number | string

    // 5. Despinzado
    despinzado_ok: boolean
    despinzado_op_id?: number | string

    // 6. Desprensado #2
    desprensado_2_ok: boolean
    desprensado_2_op_id?: number | string
    comentario_contramolde?: string // Después de Q6

    // 7. Desmolde
    desmolde_ok: boolean
    desmolde_op_id?: number | string
    comentario_desmolde?: string // Asociado a Q7

    // 8. Retorno de molde
    retorno_molde_ok: boolean
    retorno_molde_op_id?: number | string

    // Notas generales (opcional, manteniendo compatibilidad si se desea)
    observaciones_generales?: string
}

export const auditService = {
    // Obtener operarios de la tabla "Datos personal completa"
    async getPersonnel() {
        const supabase = createClient()
        // Quitamos el filtro de Estado temporalmente para ver si hay algún dato en la tabla
        const { data, error } = await supabase
            .from('Datos personal completa')
            .select('*')
            .order('NombreCompleto', { ascending: true })

        if (error) {
            console.error('Error fetching personnel:', error)
            return []
        }

        console.log('Personal cargado de la DB:', data?.length || 0)
        return data || []
    },

    // Guardar en la tabla "pv_moldes"
    async saveAudit(audit: AuditData) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('pv_moldes')
            .insert([audit])
            .select()

        if (error) {
            console.error('Error saving audit:', error)
            throw error
        }
        return data ? data[0] : null
    },

    // Buscar auditorías previas de un molde
    async getAuditsForMold(moldeId: string | number) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('pv_moldes')
            .select('*')
            .eq('id_molde', moldeId)
            .order('created_at', { ascending: false })

        if (error) throw error
        return data || []
    }
}
