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

    // SEARCH: Registro Moldes - busca en historico y enriquece con datos actuales de BD_moldes
    async searchRegistroMoldes(query: string, type?: 'codigo' | 'titulo') {
        if (!query.trim()) return []
        const supabase = createClient()
        const term = `%${query.trim()}%`

        // 1. Buscar en base_datos_historico_moldes como fuente de búsqueda
        let q = supabase
            .from('base_datos_historico_moldes')
            .select('*')
        
        if (type === 'codigo') {
            q = q.ilike('codigo_molde', term)
        } else if (type === 'titulo') {
            q = q.ilike('titulo', term)
        } else {
            q = q.or(`codigo_molde.ilike.${term},titulo.ilike.${term}`)
        }

        const { data: historicoData, error: historicoError } = await q
            .order('fecha_entrada', { ascending: false })
            .limit(20)

        if (historicoError) {
            console.error('Error searching historico:', historicoError.message)
            return []
        }

        // Obtener códigos únicos de la búsqueda en historico
        const codigosUnicos = [...new Set((historicoData || []).map((m: any) => m.codigo_molde?.trim()).filter(Boolean))]

        if (codigosUnicos.length === 0) return []

        // 2. Obtener los registros de BD_moldes para todos los códigos en UNA SOLA consulta (Optimización 40k+)
        const bdMoldesMap: Record<string, any> = {}
        const { data: allBdData, error: bdError } = await supabase
            .from('BD_moldes')
            .select('"CODIGO MOLDE", "ESTADO", "Tipo de reparacion", "Responsable", "FECHA ENTRADA"')
            .in('"CODIGO MOLDE"', codigosUnicos)
            .order('"FECHA ENTRADA"', { ascending: false })

        if (!bdError && allBdData) {
            // Procesar en JS para quedarnos con el más reciente de cada uno
            allBdData.forEach((row: any) => {
                const key = (row["CODIGO MOLDE"] || '').trim().toUpperCase()
                if (!bdMoldesMap[key]) {
                    bdMoldesMap[key] = row
                }
            })
        }

        // 3. Desduplicar por codigo_molde (un resultado por molde) y ordenar por similitud
        const seen = new Set<string>()
        const results: any[] = []
        const queryLower = query.trim().toLowerCase()

        for (const m of (historicoData || [])) {
            const key = (m.codigo_molde || '').trim().toUpperCase()
            if (seen.has(key)) continue
            seen.add(key)

            const bdRecord = bdMoldesMap[key] || {}
            results.push({
                ...m,
                id: m.id,
                titulo: m.titulo,
                codigo_molde: m.codigo_molde,
                defectos_a_reparar: m.defectos_a_reparar,
                // Estado, tipo y responsable del registro MÁS RECIENTE en BD_moldes
                estado: bdRecord["ESTADO"] || m.estado || '',
                tipo_de_reparacion: bdRecord["Tipo de reparacion"] || m.tipo_de_reparacion || '',
                responsable: bdRecord["Responsable"] || m.responsable || '',
            })
        }

        // Ordenar por similitud
        return results.sort((a, b) => {
            const aCode = (a.codigo_molde || '').toLowerCase()
            const bCode = (b.codigo_molde || '').toLowerCase()
            const aTitle = (a.titulo || '').toLowerCase()
            const bTitle = (b.titulo || '').toLowerCase()

            // Prioridad 1: Empieza exactamente por el código
            const aStartsCode = aCode.startsWith(queryLower)
            const bStartsCode = bCode.startsWith(queryLower)
            if (aStartsCode && !bStartsCode) return -1
            if (!aStartsCode && bStartsCode) return 1

            // Prioridad 2: Empieza exactamente por el título
            const aStartsTitle = aTitle.startsWith(queryLower)
            const bStartsTitle = bTitle.startsWith(queryLower)
            if (aStartsTitle && !bStartsTitle) return -1
            if (!aStartsTitle && bStartsTitle) return 1

            return 0
        })
    },

    // SEARCH: Sugerencias directas desde BD_moldes (para el buscador de la lista principal)
    async searchMoldsInBD(query: string) {
        if (!query.trim()) return []
        const supabase = createClient()
        const term = `%${query.trim()}%`

        const { data, error } = await supabase
            .from('BD_moldes')
            .select('"CODIGO MOLDE", "Título", "ESTADO"')
            .or(`"CODIGO MOLDE".ilike.${term},"Título".ilike.${term}`)
            .limit(10)

        if (error) {
            console.error('Error in searchMoldsInBD:', error.message)
            return []
        }

        return (data || []).map((m: any) => ({
            serial: m["CODIGO MOLDE"],
            titulo: m["Título"],
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
    // Muestra SOLO estados activos: En reparación, En espera producción, En espera moldes
    async getRegistroMoldes(limit = 50, offset = 0, search = '', filters?: any) {
        const supabase = createClient()
        console.log('--- FETCHING BD_moldes (estados activos) ---', { limit, offset, search, filters })

        // Estados activos permitidos para el módulo Registro Moldes (coincidiendo con BD_moldes)
        const ACTIVE_STATES = [
            'En reparación',
            'En reparacion',
            'EN REPARACION',
            'En espera - Produccion',
            'En espera - Producción',
            'En espera produccion',
            'EN ESPERA - PRODUCCION',
            'En espera - Moldes',
            'En espera - reparación',
            'En espera moldes',
            'EN ESPERA - MOLDES',
        ]

        let query = supabase
            .from('BD_moldes')
            .select('*')
            .order('"FECHA ENTRADA"', { ascending: false, nullsFirst: false })

        if (search.trim()) {
            const term = `%${search.trim()}%`
            query = query.or(`"CODIGO MOLDE".ilike.${term},"Título".ilike.${term},"DEFECTOS A REPARAR".ilike.${term}`)
        }

        // Filtrar SOLO estados activos (inclusión explícita, más precisa que exclusión)
        query = query.in('ESTADO', ACTIVE_STATES)

        if (filters?.repair_type && filters.repair_type !== 'Todos') {
            const rt = filters.repair_type.toLowerCase();
            if (rt.includes('rapida') || rt.includes('rápida')) {
                query = query.or('"Tipo de reparacion".ilike.%rapida%,"Tipo de reparacion".ilike.%rápida%')
            } else if (rt.includes('especial')) {
                query = query.or('"Tipo de reparacion".ilike.%especial%,"Tipo de reparacion".ilike.%Especial%')
            } else {
                query = query.ilike('Tipo de reparacion', `%${filters.repair_type}%`)
            }
        }

        const { data, error } = await query.range(offset, offset + limit - 1)
        if (error) {
            console.error('Error fetching BD_moldes:', error)
            return []
        }
        
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

    // ── syncMoldEstado: Mapea el estado de BD_moldes al estado en la tabla maestra 'moldes' ──
    async syncMoldEstado(codigoMolde: string, estadoBD: string, titulo?: string): Promise<void> {
        const supabase = createClient()

        // 1. Normalizar código y estado
        const codigoNorm = (codigoMolde || '').trim()
        const estadoNorm = (estadoBD || '').trim().toLowerCase()

        if (!codigoNorm) {
            console.warn('[syncMoldEstado] Código de molde vacío, omitiendo sincronización.')
            return
        }

        // 2. Mapeo de estado BD_moldes → estado en tabla 'moldes'
        // Reglas solicitadas:
        // - "Entregado" (BD_moldes) -> "Disponible" (moldes)
        // - "En reparacion", "En espera - Moldes", "En espera - Produccion" (BD_moldes) -> "En reparacion" (moldes)
        // - "Destruido" (BD_moldes) -> "Destruido" (moldes)
        
        let estadoDestino: string
        if (estadoNorm.includes('entregado')) {
            estadoDestino = 'Disponible'
        } else if (
            estadoNorm.includes('reparacion') || 
            estadoNorm.includes('reparación') || 
            estadoNorm.includes('espera')
        ) {
            estadoDestino = 'En reparacion'
        } else if (estadoNorm.includes('destruido')) {
            estadoDestino = 'Destruido'
        } else {
            // Si es otro estado, podemos optar por no sincronizar o loguear
            console.warn(`[syncMoldEstado] Estado "${estadoBD}" no mapeado para sincronización maestra.`)
            return
        }

        // 3. Buscar en moldes por serial (tolerante a espacios y casing)
        const { data: moldData, error: findError } = await supabase
            .from('moldes')
            .select('id, serial, estado')
            .ilike('serial', codigoNorm)
            .limit(1)

        if (findError) {
            console.warn('[syncMoldEstado] Error buscando molde:', findError.message)
            return
        }

        if (!moldData || moldData.length === 0) {
            // INSERT: Si el molde es totalmente nuevo y no existe en la maestra
            console.log(`[syncMoldEstado] Molde "${codigoNorm}" no encontrado. Creando en tabla maestra...`)
            
            // Determinar un tipo_molde_id razonable (Requerido por la DB)
            // 474 es el ID común para "Moldes" en la base de datos actual
            const tipoId = (titulo || '').toLowerCase().includes('contramolde') ? 474 : 474; 

            const { error: insertError } = await supabase
                .from('moldes')
                .insert([{ 
                    serial: codigoNorm, 
                    nombre_articulo: titulo || 'Molde Nuevo',
                    estado: estadoDestino,
                    vueltas_actuales: estadoDestino === 'Disponible' ? 0 : 0,
                    tipo_molde_id: tipoId,
                    modificado_por: 'Sistema',
                    modificado_desde: 'supabase'
                }])

            if (insertError) {
                console.warn('[syncMoldEstado] Error creando molde nuevo en maestra:', insertError.message)
            }
            return
        }

        // 4. Actualizar SOLO el campo 'estado' (y resetear vueltas si está disponible)
        const updateData: any = { estado: estadoDestino }
        if (estadoDestino === 'Disponible') {
            updateData.vueltas_actuales = 0
        }

        const { error: updateError } = await supabase
            .from('moldes')
            .update(updateData)
            .eq('id', moldData[0].id)

        if (updateError) {
            console.warn('[syncMoldEstado] Error actualizando estado en moldes:', updateError.message)
        } else {
            console.log(`[syncMoldEstado] Molde "${codigoNorm}" → estado en moldes actualizado a: "${estadoDestino}"`)
        }
    },

    // ── saveRegistro: UPSERT en BD_moldes + INSERT en histórico + sync estado en moldes ──
    async saveRegistro(record: any, isNew: boolean) {
        const supabase = createClient()
        let saved: any
        const now = new Date().toISOString()
        const codigoMolde = (record.codigo_molde || '').trim()

        // 1. Construir el objeto para BD_moldes
        const dbRecord: any = {
            "Título": record.titulo,
            "CODIGO MOLDE": codigoMolde,
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
            "Modified": now,
            "Modified By": record.usuario || record.modified_by
        }

        // 2. LÓGICA DE GUARDADO (Priorizar UPDATE si conocemos el ID o si el CODIGO MOLDE ya existe)
        let existingId = record.id;

        // Si no tenemos ID (es nuevo) pero el código ya existe en BD_moldes, hacemos UPSERT
        if (!existingId || isNew) {
            const { data: existingData } = await supabase
                .from('BD_moldes')
                .select('id')
                .ilike('CODIGO MOLDE', codigoMolde)
                .limit(1)
            
            if (existingData && existingData.length > 0) {
                existingId = existingData[0].id;
                console.log(`[saveRegistro] Molde detectado por código → UPSERT en ID: ${existingId}`);
            }
        }

        if (existingId) {
            // UPDATE: El registro ya existe (por ID o por coincidencia de código)
            console.log(`[saveRegistro] ACTUALIZANDO BD_moldes → ID: ${existingId}, CODIGO: "${codigoMolde}"`)
            const { data, error } = await supabase
                .from('BD_moldes')
                .update(dbRecord)
                .eq('id', existingId)
                .select()
            
            if (error) {
                console.error('[saveRegistro] Error en UPDATE BD_moldes:', error.message)
                throw error
            }
            saved = data?.[0]
        } else {
            // INSERT: Registro totalmente nuevo
            console.log(`[saveRegistro] INSERTANDO NUEVO en BD_moldes → CODIGO: "${codigoMolde}"`)
            dbRecord.id = Date.now() // Generar ID manual para evitar error de NOT NULL
            dbRecord["Created"] = now
            dbRecord["Created By"] = record.usuario || 'Mantenimiento'
            
            const { data, error } = await supabase
                .from('BD_moldes')
                .insert([dbRecord])
                .select()
            
            if (error) {
                console.error('[saveRegistro] Error en INSERT BD_moldes:', error.message)
                throw error
            }
            saved = data?.[0]
        }

        // 3. HISTÓRICO: SIEMPRE INSERT (es un log completo de cambios)
        const historicoRecord = {
            id: Date.now() + 10, // ID único manual para histórico
            titulo: record.titulo,
            codigo_molde: codigoMolde,
            defectos_a_reparar: record.defectos_a_reparar,
            fecha_entrada: record.fecha_entrada,
            fecha_esperada: record.fecha_esperada,
            fecha_entrega: record.fecha_entrega,
            estado: record.estado,
            observaciones: record.observaciones,
            usuario: record.usuario,
            recibido: record.recibido,
            created: new Date().toISOString().split('T')[0],
            responsable: record.responsable,
            tipo_de_reparacion: record.tipo_de_reparacion,
            tipo: record.tipo
        }
        const { error: histError } = await supabase
            .from('base_datos_historico_moldes')
            .insert([historicoRecord])
        if (histError) {
            console.warn('[saveRegistro] Error al insertar en histórico:', histError.message)
            // No rompe el flujo
        }

        // 4. SINCRONIZAR ESTADO en tabla maestra 'moldes' (solo campo estado)
        await this.syncMoldEstado(codigoMolde, record.estado, record.titulo)

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
    },

    async saveHistoricoMP(record: any) {
        const supabase = createClient()
        // Target table: public."historico_BD_entradas _salidas_MP"
        const { data, error } = await supabase
            .from('historico_BD_entradas _salidas_MP')
            .insert([record])
            .select()

        if (error) {
            console.error('Error saving to historico_BD_entradas _salidas_MP:', error.message)
            throw error
        }
        return data?.[0]
    }
}
