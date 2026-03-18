import { createClient } from '@/lib/supabase'

export interface Mold {
    id?: number
    created_at?: string
    modificado_desde?: string
    modified_at?: string
    vueltas_mto_atipicas?: number
    Fecha_de_ingreso?: string
    Fecha_de_entrega?: string
    Fecha_esperada?: string
    Estado_reparacion?: string
    Tipo_de_reparacion?: string
    estado: string
    vueltas_actuales?: number
    vueltas_acumuladas?: number
    tipo_molde_id?: number
    serial: string
    nombre_articulo: string
    descripcion_molde?: string
    tipo_molde_sku?: string
    Observaciones_reparacion?: string
    observaciones?: string
    modificado_por?: string
    Responsable?: string
}

export type MoldActive = any;

export interface DefectItem {
    Título: string
    Tiempo: number | string
}

export const moldsService = {
    // Retorna todos los registros de moldes
    async getAll() {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('moldes')
            .select('*')
            .order('Fecha_esperada', { ascending: true })

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
            .from('moldes')
            .select('nombre_articulo')
            .order('nombre_articulo', { ascending: true })

        if (error) return []

        const unique = Array.from(new Set((data as any[] || []).map(m => m.nombre_articulo))).filter(Boolean)
        return unique
    },

    // Obtener catálogo de defectos
    async getDefectsCatalog() {
        const supabase = createClient()
        // 1. Intentamos obtener del catálogo oficial
        const { data: catData, error: catError } = await supabase
            .from('Defectos moldes')
            .select('Título,Tiempo')
            .order('Título', { ascending: true })

        if (!catError && catData && catData.length > 0) {
            return catData
        }

        // 2. Si el catálogo está vacío, extraemos valores únicos de la tabla de registros
        console.warn('Defectos moldes table is empty, extracting from registros_moldes...')
        const { data: regData } = await supabase
            .from('registros_moldes')
            .select('"DEFECTOS A REPARAR"')
            .not('"DEFECTOS A REPARAR"', 'is', null)
            .limit(500)

        if (regData) {
            const allDefects = new Set<string>()
            regData.forEach(r => {
                const val = r['DEFECTOS A REPARAR']
                if (val) {
                    // Divide por comas si hay múltiples y limpia
                    val.split(',').forEach((d: string) => {
                        const clean = d.trim()
                        if (clean && clean !== 'NULL') allDefects.add(clean)
                    })
                }
            })
            return Array.from(allDefects).sort().map(d => ({ Título: d }))
        }

        return []
    },

    // Obtener catálogo de personal (operarios)
    async getPersonnel() {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('Personal app moldes')
            .select('Nombre, Cedula')
            .order('Nombre', { ascending: true })

        if (error) {
            console.error('Error fetching personnel:', error)
            return []
        }
        // Map to a consistent format
        return data.map((p: any) => ({
            NombreCompleto: p.Nombre,
            Cedula: p.Cedula
        }))
    },

    // Conteo por referencia en reparación
    async getCountByReference(nombreReferencia: string) {
        const supabase = createClient()
        const { count, error } = await supabase
            .from('moldes')
            .select('*', { count: 'exact', head: true })
            .eq('nombre_articulo', nombreReferencia)
            .ilike('estado', '%reparacion%')

        if (error) return 0
        return count || 0
    },

    // Guardar o Actualizar
    async saveMold(moldData: Mold) {
        const supabase = createClient()

        if (moldData.id) {
            const { error: updateError } = await supabase
                .from('moldes')
                .update({
                    ...moldData,
                    modified_at: new Date().toISOString(),
                    modificado_por: moldData.modificado_por || moldData.Responsable
                })
                .eq('id', moldData.id)
            if (updateError) throw updateError
        } else {
            const { error: insertError } = await supabase
                .from('moldes')
                .insert([{
                    ...moldData,
                    created_at: new Date().toISOString()
                }])
            if (insertError) throw insertError
        }
    },

    // Obtener historial completo de un molde
    async getHistoryForMold(codigoMolde: string) {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('moldes')
            .select('*')
            .eq('serial', codigoMolde)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching history:', error)
            return []
        }
        return data as MoldActive[]
    },

    // Actualizar estado
    async updateStatus(mold: Mold, newStatus: string, user: string) {
        const supabase = createClient()
        const { error } = await supabase
            .from('moldes')
            .update({ 
                estado: newStatus,
                modified_at: new Date().toISOString(),
                modificado_por: user
            })
            .eq('serial', mold.serial)
            
        if (error) throw error
    },

    // Obtener todos los registros unificados (base_datos_moldes + migracion_moldes + BD Moldes.csv)
    async getAllRegistros(limit = 20, offset = 0, search = '', filters?: { defecto?: string, responsable?: string, fecha_desde?: string, fecha_hasta?: string }) {
        const supabase = createClient()
        let query = supabase
            .from('registros_moldes')
            .select('*')
            // Order by FECHA ENTRADA descending (most recent first)
            .order('FECHA ENTRADA', { ascending: false, nullsFirst: false })

        if (search.trim()) {
            const term = `%${search.trim()}%`
            // Construct OR filter for multiple columns
            query = query.or(`"CODIGO MOLDE".ilike.${term},Nombre.ilike.${term},"DEFECTOS A REPARAR".ilike.${term},OBSERVACIONES.ilike.${term},Usuario.ilike.${term}`)
        }

        // Apply filters
        if (filters) {
            if (filters.defecto) {
                // Since defects might be comma separated in the data, we use ilike with wildcards
                query = query.ilike('DEFECTOS A REPARAR', `%${filters.defecto}%`)
            }
            if (filters.responsable) {
                query = query.eq('Responsable', filters.responsable)
            }
            if (filters.fecha_desde) {
                query = query.gte('FECHA ENTRADA', filters.fecha_desde)
            }
            if (filters.fecha_hasta) {
                query = query.lte('FECHA ENTRADA', filters.fecha_hasta)
            }
        }

        const { data, error } = await query.range(offset, offset + limit - 1)

        if (error) {
            console.error('Error fetching registros:', error)
            return []
        }
        return data
    }
}
