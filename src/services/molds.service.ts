// PV_MOLDES V2.4
import { createClient, createClientTH } from '@/lib/supabase'

export interface Mold {
    id?: number
    created_at?: string
    serial: string
    nombre_articulo: string
    estado: string
    Estado_reparacion?: string
    Responsable?: string
    Tipo_de_reparacion?: string
    Fecha_de_ingreso?: string
    Fecha_esperada?: string
    Fecha_de_entrega?: string
    vueltas_actuales?: number
    vueltas_acumuladas?: number
    observaciones?: string
    Observaciones_reparacion?: string
    modificado_por?: string
    modified_at?: string
    Nombre?: string
}

export interface MoldActive {
    id: number
    ID?: number
    Título: string
    Nombre?: string
    "CODIGO MOLDE": string
    Prioridad?: string
    ESTADO: string
    "FECHA ENTRADA"?: string
    "FECHA ESPERADA"?: string
    "FECHA ENTREGA"?: string
    "DEFECTOS A REPARAR"?: string
    OBSERVACIONES?: string
    Usuario?: string
    "Tipo de reparacion"?: string
    Created?: string
    Modified?: string
}

export const moldsService = {
    // Return all records from MASTER 'moldes' table
    async getAll() {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('moldes')
            .select('*')
            .order('Fecha_esperada', { ascending: true })

        if (error) throw error
        return data
    },

    // SEARCH: Buscador Rápido (Dashboard) connects to BD_moldes (Requirement 2.4 / 2.3)
    async searchMolds(query: string) {
        if (!query.trim()) return []
        const supabase = createClient()
        const term = `%${query.trim()}%`
        
        // Search in BD_moldes using provided table schema
        const { data, error } = await supabase
            .from('BD_moldes')
            .select('*')
            .or(`"Título".ilike.${term},"CODIGO MOLDE".ilike.${term}`)
            .limit(10)
            
        if (error) {
            console.error('Error in searchMolds:', error.message)
            return []
        }
        
        // Return mapped records for MoldSearch component (serial, nombre_articulo, estado)
        return (data || []).map((m: any) => ({
            ...m,
            id: m.id,
            serial: m["CODIGO MOLDE"] || 'S/C',
            nombre_articulo: m["Título"] || 'Sin Título',
            estado: m["ESTADO"] || 'Sin Estado',
            
            // Inclusion for AddMoldModal compatibility
            Fecha_de_ingreso: m["FECHA ENTRADA"],
            Fecha_esperada: m["FECHA ESPERADA"],
            Fecha_de_entrega: m["FECHA ENTREGA"],
            Responsable: m["Responsable"],
            Tipo_de_reparacion: m["Tipo de reparacion"],
            Observaciones_reparacion: m["OBSERVACIONES"]
        }))
    },

    // ALIAS: For compatibility with AddMoldModal (Dashboard)
    async saveMold(record: any) {
        return this.saveRegistro({
            ...record,
            titulo: record.nombre_articulo,
            codigo_molde: record.serial,
            fecha_entrada: record.Fecha_de_ingreso,
            fecha_esperada: record.Fecha_esperada,
            fecha_entrega: record.Fecha_de_entrega,
            observaciones: record.Observaciones_reparacion || record.observaciones,
            responsable: record.Responsable,
            tipo_de_reparacion: record.Tipo_de_reparacion,
            usuario: record.modificado_por
        }, (!record.id || record.id === 'NEW' || record.id === 0))
    },

    // SEARCH: Registro Moldes module uses BD_moldes for searching/autocomplete
    async searchRegistroMoldes(query: string) {
        if (!query.trim()) return []
        const supabase = createClient()
        const term = `%${query.trim()}%`
        // New exact column names: "Título", "CODIGO MOLDE"
        const { data, error } = await supabase
            .from('BD_moldes')
            .select('*')
            .or(`"Título".ilike.${term},"CODIGO MOLDE".ilike.${term}`)
            .limit(15)
            
        if (error) {
            console.error('Error searching BD_moldes:', error.message)
            return []
        }
        // Map back to internal consistent names: titulo, codigo_molde
        return (data || []).map((m: any) => ({
            ...m,
            id: m.id,
            titulo: m["Título"],
            codigo_molde: m["CODIGO MOLDE"],
            defectos_a_reparar: m["DEFECTOS A REPARAR"],
            estado: m["ESTADO"]
        }))
    },

    // SEARCH: Master 'moldes' table still used for reference or creation
    async searchMoldsMaster(query: string) {
        if (!query.trim()) return []
        const supabase = createClient()
        const term = `%${query.trim()}%`
        const { data, error } = await supabase
            .from('moldes')
            .select('*')
            .or(`nombre_articulo.ilike.${term},serial.ilike.${term}`)
            .limit(10)
            
        if (error) return []
        return data
    },

    // Get defects from 'Defectos_moldes' with tiempo info
    async getDefectsCatalog() {
        const supabase = createClient()
        // We use select('*') and map manually to handle the exact casing from the DB (Título, Tiempo)
        const { data, error } = await supabase
            .from('Defectos_moldes')
            .select('*')

        if (error) {
            console.warn('Error fetching Defectos_moldes:', error.message)
            return []
        }
        
        if (!data || data.length === 0) {
            console.warn('Defectos_moldes returned 0 records. Check RLS policies.')
            return []
        }

        return data.map((d: any) => ({
            id: d.id,
            titulo: d.Título || d.titulo || d.Nombre || 'Sin Título',
            tiempo: parseFloat(d.Tiempo || d.tiempo || 0)
        })).sort((a, b) => a.titulo.localeCompare(b.titulo))
    },

    // Get personnel
    async getPersonnel() {
        const supabase = createClient()
        const { data, error } = await supabase
            .from('Personal app moldes')
            .select('Nombre, Cedula')
            .order('Nombre', { ascending: true })

        if (error) return []
        return data.map((p: any) => ({
            NombreCompleto: p.Nombre,
            Cedula: p.Cedula
        }))
    },

    // Module: HISTÓRICO MOLDES (public."base_datos_historico_moldes")
    async getHistoricoMoldes(limit = 100, offset = 0, search = '', filters?: any) {
        const supabase = createClient()
        let query = supabase
            .from('base_datos_historico_moldes')
            .select('*')
            .order('fecha_entrada', { ascending: false })

        if (search.trim()) {
            const term = `%${search.trim()}%`
            query = query.or(`codigo_molde.ilike.${term},titulo.ilike.${term},defectos_a_reparar.ilike.${term},estado.ilike.${term}`)
        }

        const { data, error } = await query.range(offset, offset + limit - 1)
        if (error) {
            console.error('Error fetching base_datos_historico_moldes:', error)
            return []
        }
        return data || []
    },

    // Module: REGISTRO MOLDES (public."BD_moldes")
    async getRegistroMoldes(limit = 50, offset = 0, search = '', filters?: any) {
        const supabase = createClient()
        console.log('--- FETCHING BD_moldes ---', { limit, offset, search, filters })
        // New exact column names: "FECHA ENTRADA", "Título", "CODIGO MOLDE", "DEFECTOS A REPARAR", "ESTADO"
        let query = supabase
            .from('BD_moldes')
            .select('*')
            .order('"FECHA ENTRADA"', { ascending: false, nullsFirst: false })

        if (search.trim()) {
            const term = `%${search.trim()}%`
            query = query.or(`"CODIGO MOLDE".ilike.${term},"Título".ilike.${term},"DEFECTOS A REPARAR".ilike.${term},"ESTADO".ilike.${term}`)
        }

        // 2.3 logic: ONLY show active reparative states, EXCLUDE Destruido/Entregado
        // Including non-accented variants and common variants to match real data (e.g. 'En espera - Produccion')
        query = query.in('ESTADO', [
            'En espera en moldes', 'EN ESPERA EN MOLDES', 'En espera moldes', 'En espera - Moldes',
            'En reparación', 'En reparacion', 'EN REPARACIÓN', 'EN REPARACION',
            'En espera en producción', 'En espera en produccion', 'EN ESPERA EN PRODUCCIÓN',
            'En espera producción', 'En espera produccion', 'En espera - Producción', 'En espera - Produccion'
        ])

        if (filters?.repair_type && filters.repair_type !== 'Todos') {
            const rt = filters.repair_type.toLowerCase();
            if (rt === 'reparaciones') {
                // General repairs view
                query = query.or(`"ESTADO".ilike.%reparacion%,"Tipo de reparacion".ilike.%reparacion%,"Tipo de reparacion".ilike.%rapida%,"Tipo de reparacion".ilike.%especial%`)
            } else if (rt.includes('rapida') || rt.includes('rápida')) {
                // Specific: Rapida
                query = query.ilike('Tipo de reparacion', '%rapida%')
            } else if (rt.includes('especial')) {
                // Specific: Especial
                query = query.ilike('Tipo de reparacion', '%especial%')
            } else {
                // Other exact matches
                query = query.eq('Tipo de reparacion', filters.repair_type)
            }
        }

        const { data, error } = await query.range(offset, offset + limit - 1)
        if (error) {
            console.error('Error fetching BD_moldes:', error)
            return []
        }
        
        // Return mapped records for UI consistency
        return (data || []).map((m: any) => ({
            ...m,
            titulo: m["Título"],
            codigo_molde: m["CODIGO MOLDE"],
            defectos_a_reparar: m["DEFECTOS A REPARAR"],
            fecha_entrada: m["FECHA ENTRADA"],
            fecha_esperada: m["FECHA ESPERADA"],
            fecha_entrega: m["FECHA ENTREGA"],
            estado: m["ESTADO"],
            observaciones: m["OBSERVACIONES"],
            usuario: m["Usuario"],
            responsable: m["Responsable"],
            tipo_de_reparacion: m["Tipo de reparacion"],
            tipo: m["Tipo"]
        }))
    },

    // Alias for compatibility if needed
    async getAllRegistros(limit = 20, offset = 0, search = '', filters?: any) {
        return this.getRegistroMoldes(limit, offset, search, filters)
    },

    async getHistoryFromHistoricoTable(limit = 50, offset = 0, search = '', filters?: any) {
        return this.getHistoricoMoldes(limit, offset, search, filters)
    },

    // Save to BOTH 'BD_moldes' and 'moldes' (Sync remains as described in previous turn)
    async saveRegistro(record: any, isNew: boolean) {
        const supabase = createClient()
        let saved;
        
        // Map internal names back to strange DB names for BD_moldes
        const dbRecord = {
            "Título": record.titulo,
            "CODIGO MOLDE": record.codigo_molde,
            "DEFECTOS A REPARAR": record.defectos_a_reparar,
            "FECHA ENTRADA": record.fecha_entrada,
            "FECHA ESPERADA": record.fecha_esperada,
            "FECHA ENTREGA": record.fecha_entrega,
            "ESTADO": record.estado,
            "OBSERVACIONES": record.observaciones,
            "Usuario": record.usuario,
            "Responsable": record.responsable,
            "Tipo de reparacion": record.tipo_de_reparacion,
            "Tipo": record.tipo,
            "Modified": new Date().toISOString(),
            "Modified By": record.usuario || record.modified_by
        } as any;
        
        // Let's NOT attach ESTADO MOLDE directly to BD_moldes because the column doesn't exist and crashes Supabase (PGRST204)
        // You must manually create the column "ESTADO MOLDE" in Supabase if you want BD_moldes to store it permanently locally.
        // dbRecord["ESTADO MOLDE"] = record.estado_molde;

        if (isNew) {
            // Include IDs for new records if provided/managed, otherwise generate a bigint timestamp id
            (dbRecord as any).id = (!record.id || record.id === 'NEW') ? Date.now() : record.id;
            (dbRecord as any)["Created"] = new Date().toISOString();
            (dbRecord as any)["Created By"] = record.usuario;

            const { data, error } = await supabase
                .from('BD_moldes')
                .insert([dbRecord])
                .select()
            if (error) throw error
            saved = data?.[0]
        } else {
            const { data, error } = await supabase
                .from('BD_moldes')
                .update(dbRecord)
                .eq('id', record.id)
                .select()
            if (error) throw error
            saved = data?.[0]
        }

        // 2. Synchronize with MASTER 'moldes' table
        const masterUpdate = {
            estado: record.estado,
            Responsable: record.responsable,
            Tipo_de_reparacion: record.tipo_de_reparacion,
            Fecha_de_ingreso: record.fecha_entrada,
            Fecha_esperada: record.fecha_esperada,
            Fecha_de_entrega: record.fecha_entrega,
            observaciones: record.observaciones,
            modified_at: new Date().toISOString(),
            modificado_por: record.usuario
        }

        await supabase
            .from('moldes')
            .update(masterUpdate)
            .eq('serial', record.codigo_molde)

        return saved
    },

    async getSupervisorsAndLeaders() {
        const supabaseTH = createClientTH()
        const { data, error } = await supabaseTH
            .from('empleados')
            .select('id, nombreCompleto, cargo')
            .or('cargo.ilike.supervisor,cargo.ilike.jefe,cargo.ilike.lider')
            .order('nombreCompleto', { ascending: true })
        if (error) return []
        return data || []
    },

    async updateStatus(mold: MoldActive, newStatus: string, user: string) {
        const supabase = createClient()
        const { error } = await supabase
            .from('BD_moldes')
            .update({ 
                ESTADO: newStatus,
                Modified: new Date().toISOString(),
                "Modified By": user
            })
            .eq('id', mold.id)
        
        if (error) throw error
        return true
    },

    async getCountByReference(name: string) {
        if (!name) return 0
        const supabase = createClient()
        const { count, error } = await supabase
            .from('BD_moldes')
            .select('*', { count: 'exact', head: true })
            .ilike('Título', name)
        
        if (error) return 0
        return count || 0
    },

    // Raw Materials Methods
    async getRawMaterials() {
        const supabase = createClient()
        // Source table for query: public."Materia_prima_moldes"
        const { data, error } = await supabase
            .from('Materia_prima_moldes')
            .select('*')
            
        if (error) {
            console.error('Error fetching Materia_prima_moldes:', error.message)
            throw error
        }
        
        // Return records mapping to instruction-specified fields (Título, CODIGO MP, UNDS, etc.)
        return (data || []).map((m: any) => ({
            id: m.id,
            titulo: m.Título || m['Materia Prima'] || 'Sin Título',
            codigo_mp: m['CODIGO MP'] || m['Número de artículo SAP'] || 'S/C',
            unds: m.UNDS || m['Unidad de medida de compras'] || 'UN',
            mp_molde: m['MP MOLDE'] || '--',
            mp_molde_codigo: m['MP MOLDE CODIGO'] || '--',
            // Keep actual row for autocompletion
            raw: m
        })).sort((a, b) => a.titulo.localeCompare(b.titulo))
    },

    async saveRawMaterialMovement(movement: any) {
        const supabase = createClient()
        // Target table for save: public."Entradas_salidas_MP"
        const { data, error } = await supabase
            .from('Entradas_salidas_MP')
            .insert([movement])
            .select()
            
        if (error) {
            console.error('Error saving to Entradas_salidas_MP:', error.message)
            throw error
        }
        return data?.[0]
    }
}
