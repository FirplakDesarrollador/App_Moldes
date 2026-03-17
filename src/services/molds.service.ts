import { createClient } from '@/lib/supabase'

export interface Mold {
    ID?: number
    Nombre: string
    "CODIGO MOLDE": string
    "DEFECTOS A REPARAR": string
    "FECHA ENTRADA": string
    "FECHA ESPERADA": string
    "FECHA ENTREGA"?: string
    "ESTADO": string
    "OBSERVACIONES": string
    "Usuario": string
    "Recibido"?: string
    "Prioridad"?: string
    "Tipo de reparacion": string
    "Created"?: string
    "Modified"?: string
    "Modified By"?: string
}

export interface DefectItem {
    Título: string
    Tiempo: number | string
}

export const moldsService = {
    // Retorna todos los registros de base_datos_moldes
    async getAll() {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('base_datos_moldes')
            .select('*')
            .order('FECHA ESPERADA', { ascending: true })

        if (error) {
            console.error('Error in getAll:', error)
            throw error
        }
        return data as Mold[]
    },

    // Obtener catálogo de nombres de moldes existentes
    async getMoldsCatalog() {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('base_datos_moldes')
            .select('Nombre')
            .order('Nombre', { ascending: true })

        if (error) return []

        const unique = Array.from(new Set((data as any[] || []).map(m => m.Nombre))).filter(Boolean)
        return unique
    },

    // Obtener catálogo de defectos
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
        return data as DefectItem[]
    },

    // Obtener catálogo de personal (operarios)
    async getPersonnel() {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('Datos personal completa')
            .select('ID, NombreCompleto, Cedula')
            .order('NombreCompleto', { ascending: true })

        if (error) {
            console.error('Error fetching personnel:', error)
            return []
        }
        return data
    },

    // Conteo por referencia en reparación
    async getCountByReference(nombreReferencia: string) {
        const supabase = createClient()
        const { count, error } = await supabase
            .from('base_datos_moldes')
            .select('*', { count: 'exact', head: true })
            .eq('Nombre', nombreReferencia)
            .ilike('ESTADO', '%reparacion%')

        if (error) return 0
        return count || 0
    },

    // Guardar o Actualizar (Upsert por CODIGO MOLDE)
    async saveMold(moldData: Mold) {
        const supabase = createClient()

        // Verificamos si existe por código molde
        const { data: existing } = await supabase
            .from('base_datos_moldes')
            .select('ID')
            .eq('CODIGO MOLDE', moldData["CODIGO MOLDE"])
            .maybeSingle()

        if (existing) {
            const { error } = await supabase
                .from('base_datos_moldes')
                .update({
                    ...moldData,
                    Modified: new Date().toISOString(),
                    "Modified By": moldData["Modified By"] || moldData.Usuario
                })
                .eq('CODIGO MOLDE', moldData["CODIGO MOLDE"])
            if (error) throw error
        } else {
            const { error } = await supabase
                .from('base_datos_moldes')
                .insert([{
                    ...moldData,
                    Created: new Date().toISOString()
                }])
            if (error) throw error
        }
    }
}
