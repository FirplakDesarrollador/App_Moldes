
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Loader2, Package, Clock, Filter, AlertCircle, Calendar, CheckCircle2, Activity, User, RotateCcw } from 'lucide-react'
import { moldsService } from '@/services/molds.service'

export default function MoldsModule() {
    const [records, setRecords] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('')
    const [defectFilter, setDefectFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [expectedDateFilter, setExpectedDateFilter] = useState('')
    const [deliveryDateFilter, setDeliveryDateFilter] = useState('')
    const [responsibleFilter, setResponsibleFilter] = useState('')
    const [responsiblesList, setResponsiblesList] = useState<string[]>([])

    useEffect(() => {
        moldsService.getHistoricoResponsables().then(list => {
            if (list && list.length > 0) {
                setResponsiblesList(list)
            }
        }).catch(console.error)
    }, [])

    const fetchHistory = useCallback(async () => {
        setLoading(true)
        try {
            // Updated to fetch from the NEW table 'base_datos_historico_moldes'
            const data = await moldsService.getHistoryFromHistoricoTable(100, 0, searchQuery, {
                defecto: defectFilter,
                categoria: categoryFilter,
                estado: statusFilter,
                fecha_esperada: expectedDateFilter,
                fecha_entrega: deliveryDateFilter,
                responsable: responsibleFilter
            })
            setRecords(data || [])
        } catch (e) {
            console.error('Error loading history:', e)
        } finally {
            setLoading(false)
        }
    }, [searchQuery, defectFilter, categoryFilter, statusFilter, expectedDateFilter, deliveryDateFilter, responsibleFilter])

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchHistory()
        }, 400)
        return () => clearTimeout(timer)
    }, [fetchHistory])

    const hasActiveFilters = Boolean(
        searchQuery || categoryFilter || defectFilter || statusFilter ||
        expectedDateFilter || deliveryDateFilter || responsibleFilter
    )

    const resetFilters = () => {
        setSearchQuery('')
        setCategoryFilter('')
        setDefectFilter('')
        setStatusFilter('')
        setExpectedDateFilter('')
        setDeliveryDateFilter('')
        setResponsibleFilter('')
    }

    const getStatusStyles = (st: string) => {
        const s = (st || '').toUpperCase()
        if (s.includes('REPARACION') || s.includes('PROCESO')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
        if (s.includes('ESPERA')) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
        if (s.includes('ENTREGADO') || s.includes('OK')) return 'bg-green-500/10 text-green-400 border-green-500/20'
        return 'bg-white/5 text-gray-400 border-white/10'
    }

    const getCategoryLabel = (r: { tipo?: string | null; tipo_de_reparacion?: string | null; observaciones?: string | null; defectos_a_reparar?: string | null }) => {
        const tipo = (r.tipo || '').toUpperCase()
        const tipoRep = (r.tipo_de_reparacion || '').toUpperCase()
        const obs = (r.observaciones || '').toUpperCase()
        const def = (r.defectos_a_reparar || '').toUpperCase()

        if (tipo === 'MOLDE NUEVO' || obs.includes('MOLDE NUEVO')) return 'Molde nuevo'
        if (tipoRep.includes('MODELO') || obs.includes('MODELO NUEVO')) return 'Modelo nuevo'
        if (tipoRep.includes('RAPIDA') || tipoRep.includes('RÁPIDA')) return 'Reparación rápida'
        if (tipoRep.includes('ESPECIAL') || obs.includes('ESPECIAL')) return 'Reparación especial'
        if (tipoRep.includes('DESMANCHADO') || def.includes('DESMANCHADO') || obs.includes('DESMANCHAR')) return 'Desmanchado'
        if (r.tipo_de_reparacion) return r.tipo_de_reparacion
        if (r.tipo && r.tipo !== 'Molde') return r.tipo
        return 'General'
    }

    const getCategoryStyles = (r: { tipo?: string | null; tipo_de_reparacion?: string | null; observaciones?: string | null; defectos_a_reparar?: string | null }) => {
        const cat = getCategoryLabel(r)
        switch (cat) {
            case 'Reparación rápida':
                return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
            case 'Reparación especial':
                return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
            case 'Molde nuevo':
                return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            case 'Modelo nuevo':
                return 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20'
            case 'Desmanchado':
                return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20'
            default:
                return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
        }
    }

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '—'
        return dateStr.split('T')[0]
    }

    return (
        <div className="w-full space-y-6 animate-in fade-in duration-700">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white uppercase flex items-center gap-3">
                        <Clock className="w-8 h-8 text-blue-500" />
                        Histórico de <span className="text-blue-500">Calidad</span>
                    </h2>
                    <p className="text-gray-500 text-sm font-medium">Trazabilidad histórica desde la nueva base de datos</p>
                </div>
            </div>

            {/* Filter Controls Grid */}
            <div className="space-y-3">
                {/* Row 1: Principales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* Título / Código */}
                    <div className="glass-card p-4 rounded-2xl border border-black/5 dark:border-white/5 relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500" />
                        <input
                            type="text"
                            placeholder="Buscar título o código..."
                            className="w-full bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-xl py-3 pl-12 pr-4 text-xs font-bold text-slate-900 dark:text-white outline-none transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <label className="absolute -top-2 left-6 px-2 bg-white dark:bg-[#0f172a] text-[9px] font-black text-blue-500 uppercase">Título / Código</label>
                    </div>

                    {/* Categoría */}
                    <div className="glass-card p-4 rounded-2xl border border-black/5 dark:border-white/5 relative group">
                        <Filter className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 pointer-events-none" />
                        <select
                            className="w-full bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-xl py-3 pl-12 pr-4 text-xs font-bold text-slate-900 dark:text-white outline-none transition-all cursor-pointer"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="" className="dark:bg-slate-900">Todas las categorías</option>
                            <option value="Reparación rápida" className="dark:bg-slate-900">Reparación rápida</option>
                            <option value="Reparación especial" className="dark:bg-slate-900">Reparación especial</option>
                            <option value="Desmanchado" className="dark:bg-slate-900">Desmanchado</option>
                            <option value="Molde nuevo" className="dark:bg-slate-900">Molde nuevo</option>
                            <option value="Modelo nuevo" className="dark:bg-slate-900">Modelo nuevo</option>
                        </select>
                        <label className="absolute -top-2 left-6 px-2 bg-white dark:bg-[#0f172a] text-[9px] font-black text-blue-500 uppercase">Categoría</label>
                    </div>

                    {/* Estado */}
                    <div className="glass-card p-4 rounded-2xl border border-black/5 dark:border-white/5 relative group">
                        <Activity className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 pointer-events-none" />
                        <select
                            className="w-full bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-xl py-3 pl-12 pr-4 text-xs font-bold text-slate-900 dark:text-white outline-none transition-all cursor-pointer"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="" className="dark:bg-slate-900">Todos los estados</option>
                            <option value="Entregado" className="dark:bg-slate-900">Entregado</option>
                            <option value="En reparacion" className="dark:bg-slate-900">En reparación</option>
                            <option value="En espera - Moldes" className="dark:bg-slate-900">En espera - Moldes</option>
                            <option value="En espera - Produccion" className="dark:bg-slate-900">En espera - Producción</option>
                            <option value="Destruido" className="dark:bg-slate-900">Destruido</option>
                        </select>
                        <label className="absolute -top-2 left-6 px-2 bg-white dark:bg-[#0f172a] text-[9px] font-black text-blue-500 uppercase">Estado</label>
                    </div>

                    {/* Responsable */}
                    <div className="glass-card p-4 rounded-2xl border border-black/5 dark:border-white/5 relative group">
                        <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 pointer-events-none" />
                        <select
                            className="w-full bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-xl py-3 pl-12 pr-4 text-xs font-bold text-slate-900 dark:text-white outline-none transition-all cursor-pointer"
                            value={responsibleFilter}
                            onChange={(e) => setResponsibleFilter(e.target.value)}
                        >
                            <option value="" className="dark:bg-slate-900">Todos los responsables</option>
                            {responsiblesList.map((resp) => (
                                <option key={resp} value={resp} className="dark:bg-slate-900">{resp}</option>
                            ))}
                        </select>
                        <label className="absolute -top-2 left-6 px-2 bg-white dark:bg-[#0f172a] text-[9px] font-black text-blue-500 uppercase">Responsable</label>
                    </div>
                </div>

                {/* Row 2: Defecto, Fechas y Limpieza */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {/* Defecto */}
                    <div className="glass-card p-4 rounded-2xl border border-black/5 dark:border-white/5 relative group">
                        <AlertCircle className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500" />
                        <input
                            type="text"
                            placeholder="Filtrar por defecto..."
                            className="w-full bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-xl py-3 pl-12 pr-4 text-xs font-bold text-slate-900 dark:text-white outline-none transition-all"
                            value={defectFilter}
                            onChange={(e) => setDefectFilter(e.target.value)}
                        />
                        <label className="absolute -top-2 left-6 px-2 bg-white dark:bg-[#0f172a] text-[9px] font-black text-blue-500 uppercase">Defecto</label>
                    </div>

                    {/* F. Esperada */}
                    <div className="glass-card p-4 rounded-2xl border border-black/5 dark:border-white/5 relative group">
                        <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 pointer-events-none" />
                        <input
                            type="date"
                            className="w-full bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-xl py-3 pl-12 pr-4 text-xs font-bold text-slate-900 dark:text-white outline-none transition-all cursor-pointer"
                            value={expectedDateFilter}
                            onChange={(e) => setExpectedDateFilter(e.target.value)}
                        />
                        <label className="absolute -top-2 left-6 px-2 bg-white dark:bg-[#0f172a] text-[9px] font-black text-blue-500 uppercase">F. Esperada</label>
                    </div>

                    {/* F. Real Entrega */}
                    <div className="glass-card p-4 rounded-2xl border border-black/5 dark:border-white/5 relative group">
                        <CheckCircle2 className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-green-500 pointer-events-none" />
                        <input
                            type="date"
                            className="w-full bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-xl py-3 pl-12 pr-4 text-xs font-bold text-slate-900 dark:text-white outline-none transition-all cursor-pointer"
                            value={deliveryDateFilter}
                            onChange={(e) => setDeliveryDateFilter(e.target.value)}
                        />
                        <label className="absolute -top-2 left-6 px-2 bg-white dark:bg-[#0f172a] text-[9px] font-black text-green-500 uppercase">F. Real Entrega</label>
                    </div>

                    {/* Estado de Filtros & Limpiar */}
                    <div className="glass-card p-4 rounded-2xl border border-black/5 dark:border-white/5 flex items-center justify-between gap-3">
                        <div className="text-xs font-bold text-slate-500 dark:text-gray-400">
                            {loading ? (
                                <span className="inline-flex items-center gap-2">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                                    Cargando...
                                </span>
                            ) : (
                                <span>{records.length} registros</span>
                            )}
                        </div>
                        {hasActiveFilters && (
                            <button
                                onClick={resetFilters}
                                className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Limpiar
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-6">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                    <p className="text-gray-500 text-xs font-black uppercase tracking-[0.4em]">Consultando Base Histórica...</p>
                </div>
            ) : records.length > 0 ? (
                <div className="w-full overflow-x-auto rounded-[2rem] border border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/20 shadow-2xl glass-card relative">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
                                <th className="py-4 px-4 text-[10px] font-black uppercase text-gray-500 tracking-wider min-w-[200px]">Título</th>
                                <th className="py-4 px-4 text-[10px] font-black uppercase text-gray-500 tracking-wider whitespace-nowrap">Código</th>
                                <th className="py-4 px-4 text-[10px] font-black uppercase text-gray-500 tracking-wider whitespace-nowrap">Categoría</th>
                                <th className="py-4 px-4 text-[10px] font-black uppercase text-gray-500 tracking-wider whitespace-nowrap">Estado</th>
                                <th className="py-4 px-4 text-[10px] font-black uppercase text-gray-500 tracking-wider whitespace-nowrap">F. Entrada</th>
                                <th className="py-4 px-4 text-[10px] font-black uppercase text-gray-500 tracking-wider whitespace-nowrap">F. Esperada</th>
                                <th className="py-4 px-4 text-[10px] font-black uppercase text-gray-500 tracking-wider whitespace-nowrap">F. Real Entrega</th>
                                <th className="py-4 px-4 text-[10px] font-black uppercase text-gray-500 tracking-wider min-w-[200px]">Defectos & Obs.</th>
                                <th className="py-4 px-4 text-[10px] font-black uppercase text-gray-500 tracking-wider whitespace-nowrap">Responsable</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                            {records.map((r, i) => (
                                <tr key={`${r.id}-${i}`} className="group hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                                    <td className="py-4 px-4 align-middle font-bold text-slate-900 dark:text-white uppercase leading-snug text-xs min-w-[200px]">
                                        {r.titulo || 'S/N'}
                                    </td>
                                    <td className="py-4 px-4 align-middle whitespace-nowrap">
                                        <span className="font-mono text-xs font-bold text-slate-500 uppercase">{r.codigo_molde || 'S/C'}</span>
                                    </td>
                                    <td className="py-4 px-4 align-middle whitespace-nowrap">
                                        <div className={`inline-flex px-3 py-1.5 rounded-full text-[9px] font-black uppercase border tracking-wider ${getCategoryStyles(r)}`}>
                                            {getCategoryLabel(r)}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 align-middle whitespace-nowrap">
                                        <div className={`inline-flex px-3 py-1.5 rounded-full text-[9px] font-black uppercase border tracking-wider ${getStatusStyles(r.estado)}`}>
                                            {r.estado || 'SIN ESTADO'}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 align-middle whitespace-nowrap">
                                        <div className="font-mono text-xs font-bold text-slate-600 dark:text-gray-400">
                                            {formatDate(r.fecha_entrada)}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 align-middle whitespace-nowrap">
                                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-700 dark:text-gray-300">
                                            <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                            {formatDate(r.fecha_esperada)}
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 align-middle whitespace-nowrap">
                                        {r.fecha_entrega ? (
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 font-mono text-xs font-bold border border-green-500/20">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                                {formatDate(r.fecha_entrega)}
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-gray-400 dark:text-gray-500 italic font-medium">Pendiente</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-4 align-middle min-w-[200px]">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-red-500 font-bold line-clamp-1">{r.defectos_a_reparar || '--'}</p>
                                            <p className="text-[10px] text-gray-500 italic line-clamp-1">{r.observaciones || '--'}</p>
                                        </div>
                                    </td>
                                    <td className="py-4 px-4 align-middle whitespace-nowrap">
                                        <div className="text-[10px] font-black text-slate-600 dark:text-gray-400">
                                            {r.responsable || 'N/A'}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="py-40 text-center space-y-6 bg-black/5 dark:bg-white/[0.02] rounded-[3rem] border border-dashed border-black/10 dark:border-white/10">
                    <Package className="w-16 h-16 text-gray-300 mx-auto opacity-50" />
                    <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-sm italic">
                        La tabla de histórico aún está en proceso de migración o no se encontraron resultados.
                    </p>
                </div>
            )}
        </div>
    )
}
