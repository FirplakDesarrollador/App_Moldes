'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Package, ClipboardList, Activity, Search, Clock, Loader2, Filter, Calendar, User, Trash2, Edit2, X, Save } from 'lucide-react'
import { moldsService } from '@/services/molds.service'
import Navbar from '@/components/layout/Navbar'

const BATCH_SIZE = 20

export default function RegistrosMoldesPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [records, setRecords] = useState<any[]>([])
    
    // Filters State
    const [searchTerm, setSearchTerm] = useState('')
    const [filterDefecto, setFilterDefecto] = useState('')
    const [filterResponsable, setFilterResponsable] = useState('')
    const [filterFechaDesde, setFilterFechaDesde] = useState('')
    const [filterFechaHasta, setFilterFechaHasta] = useState('')
    
    // Catalogs State
    const [defectsCatalog, setDefectsCatalog] = useState<any[]>([])
    const [personnelCatalog, setPersonnelCatalog] = useState<any[]>([])
    const [supervisorsCatalog, setSupervisorsCatalog] = useState<any[]>([])
    
    const [offset, setOffset] = useState(0)
    const [hasMore, setHasMore] = useState(true)

    // Edit Modal State
    const [editingRecord, setEditingRecord] = useState<any>(null)
    const [editForm, setEditForm] = useState<any>({})
    const [isSaving, setIsSaving] = useState(false)
    const [defectSearch, setDefectSearch] = useState('')
    const [isCreateMode, setIsCreateMode] = useState(false)

    // Mold Search State
    const [moldSearchQuery, setMoldSearchQuery] = useState('')
    const [moldSearchResults, setMoldSearchResults] = useState<any[]>([])
    const [isSearchingMolds, setIsSearchingMolds] = useState(false)
    const [showMoldResults, setShowMoldResults] = useState(false)
    
    // Timer for debounced search
    const searchTimeout = useRef<NodeJS.Timeout | null>(null)

    // Reference for intersection observer
    const observer = useRef<IntersectionObserver | null>(null)
    const lastElementRef = useCallback((node: HTMLTableRowElement) => {
        if (loading || loadingMore) return
        if (observer.current) observer.current.disconnect()
        
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setOffset(prev => prev + BATCH_SIZE)
            }
        })
        
        if (node) observer.current.observe(node)
    }, [loading, loadingMore, hasMore])

    // Load User and Catalogs
    useEffect(() => {
        const storedUser = localStorage.getItem('moldapp_user')
        if (!storedUser) {
            router.push('/login')
            return
        }
        setUser(JSON.parse(storedUser))

        const loadCatalogs = async () => {
            try {
                // Fetch catalogs in parallel
                const [defects, personnel, supervisors] = await Promise.all([
                    moldsService.getDefectsCatalog(),
                    moldsService.getPersonnel(),
                    moldsService.getSupervisorsAndLeaders()
                ])
                setDefectsCatalog(defects || [])
                setPersonnelCatalog(personnel || [])
                setSupervisorsCatalog(supervisors || [])
            } catch (error) {
                console.error('Error loading catalogs:', error)
            }
        }
        loadCatalogs()
    }, [router])

    const fetchInitial = async (searchVal: string, filters: any) => {
        setLoading(true)
        setOffset(0)
        try {
            const data = await moldsService.getAllRegistros(BATCH_SIZE, 0, searchVal, filters)
            setRecords(data || [])
            setHasMore(data?.length === BATCH_SIZE)
        } catch (error) {
            console.error('Error fetching data:', error)
            setRecords([])
        } finally {
            setLoading(false)
        }
    }

    const fetchMore = async () => {
        if (loadingMore || !hasMore) return
        setLoadingMore(true)
        try {
            const filters = {
                defecto: filterDefecto,
                responsable: filterResponsable,
                fecha_desde: filterFechaDesde,
                fecha_hasta: filterFechaHasta
            }
            const data = await moldsService.getAllRegistros(BATCH_SIZE, offset, searchTerm, filters)
            if (data.length < BATCH_SIZE) setHasMore(false)
            setRecords(prev => [...prev, ...data])
        } catch (error) {
            console.error('Error loading more:', error)
        } finally {
            setLoadingMore(false)
        }
    }

    // Effect for offset change (infinite scroll)
    useEffect(() => {
        if (offset > 0) {
            fetchMore()
        }
    }, [offset])

    // Effect for active filters (re-fetches when dropdowns or dates change)
    useEffect(() => {
        const filters = {
            defecto: filterDefecto,
            responsable: filterResponsable,
            fecha_desde: filterFechaDesde,
            fecha_hasta: filterFechaHasta
        }
        fetchInitial(searchTerm, filters)
    }, [filterDefecto, filterResponsable, filterFechaDesde, filterFechaHasta])

    const handleSearchChange = (val: string) => {
        setSearchTerm(val)
        if (searchTimeout.current) clearTimeout(searchTimeout.current)
        searchTimeout.current = setTimeout(() => {
            const filters = {
                defecto: filterDefecto,
                responsable: filterResponsable,
                fecha_desde: filterFechaDesde,
                fecha_hasta: filterFechaHasta
            }
            fetchInitial(val, filters)
        }, 500)
    }

    const clearFilters = () => {
        setSearchTerm('')
        setFilterDefecto('')
        setFilterResponsable('')
        setFilterFechaDesde('')
        setFilterFechaHasta('')
    }

    const handleEditClick = (record: any) => {
        setIsCreateMode(false)
        setEditingRecord(record)
        setEditForm({
            "CODIGO MOLDE": record['CODIGO MOLDE'] || '',
            "Nombre": record['Nombre'] || '',
            "DEFECTOS A REPARAR": record['DEFECTOS A REPARAR'] || '',
            "FECHA ESPERADA": record['FECHA ESPERADA'] || '',
            "ESTADO": record['ESTADO'] || '',
            "OBSERVACIONES": record['OBSERVACIONES'] || '',
            "Responsable": record['Responsable'] || '',
            "Recibido": record['Recibido'] || '',
            "Prioridad": record['Prioridad'] || '',
            "Tipo de reparacion": record['Tipo de reparacion'] || '',
            "Tipo": record['Tipo'] || '',
            "espesor_pestana": record['espesor_pestana'] || '',
            "espesor_bowl": record['espesor_bowl'] || '',
            "espesor_fondo": record['espesor_fondo'] || '',
            "espesor_parte_plana": record['espesor_parte_plana'] || '',
            "H altura de pestaña": record['H altura de pestaña'] || ''
        })
        setDefectSearch('')
        setMoldSearchResults([])
        setShowMoldResults(false)
    }

    const handleCreateClick = () => {
        setIsCreateMode(true)
        setEditingRecord({ ID: 'NEW' }) 
        setEditForm({
            "CODIGO MOLDE": '',
            "Nombre": '',
            "DEFECTOS A REPARAR": '',
            "FECHA ESPERADA": '',
            "ESTADO": 'en espera - Moldes',
            "OBSERVACIONES": '',
            "Responsable": '',
            "Recibido": '',
            "Prioridad": 'Media',
            "Tipo de reparacion": '',
            "Tipo": '',
            "espesor_pestana": '',
            "espesor_bowl": '',
            "espesor_fondo": '',
            "espesor_parte_plana": '',
            "H altura de pestaña": ''
        })
        setDefectSearch('')
        setMoldSearchResults([])
        setShowMoldResults(false)
    }

    const handleUpdateRecord = async () => {
        if (!editingRecord && !isCreateMode) return
        setIsSaving(true)
        try {
            if (isCreateMode) {
                const payload = {
                    ...editForm,
                    "FECHA ENTRADA": new Date().toISOString(),
                    "Usuario": user?.Nombre || user?.NombreCompleto || 'Desconocido'
                }
                const newRecord = await moldsService.createRegistroMolde(payload)
                if (newRecord) {
                    setRecords(prev => [newRecord, ...prev])
                } else {
                    fetchInitial(searchTerm, {
                        defecto: filterDefecto,
                        responsable: filterResponsable,
                        fecha_desde: filterFechaDesde,
                        fecha_hasta: filterFechaHasta
                    })
                }
                setEditingRecord(null)
                setIsCreateMode(false)
            } else {
                const idToUpdate = editingRecord.ID || editingRecord.id
                await moldsService.updateRegistroMolde(idToUpdate, editForm)
                setRecords(prev => prev.map(r => (r.ID || r.id) === idToUpdate ? { ...r, ...editForm } : r))
                setEditingRecord(null)
            }
        } catch (error) {
            console.error("Error al procesar registro:", error)
            alert("Error al guardar los cambios")
        } finally {
            setIsSaving(false)
        }
    }

    const handleMoldSearch = async (query: string) => {
        setEditForm((prev: any) => ({ ...prev, "CODIGO MOLDE": query.toUpperCase() }))
        
        if (query.trim().length < 2) {
            setMoldSearchResults([])
            setShowMoldResults(false)
            return
        }

        setIsSearchingMolds(true)
        setShowMoldResults(true)
        try {
            const results = await moldsService.searchMolds(query)
            setMoldSearchResults(results || [])
        } catch (error) {
            console.error('Error searching molds:', error)
        } finally {
            setIsSearchingMolds(false)
        }
    }

    const handleSelectMold = (mold: any) => {
        setEditForm((prev: any) => ({
            ...prev,
            "CODIGO MOLDE": mold.serial,
            "Nombre": mold.nombre_articulo
        }))
        setShowMoldResults(false)
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] text-slate-900 dark:text-slate-100">
            <Navbar
                user={user}
                showBackButton
                backPath="/dashboard"
                title="Registros de moldes"
                subtitle="Consolidado Histórico de Producción"
            />

            <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* Dashboard Header / Filter Section */}
                    <div className="bg-white dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-blue-900/10 p-8 lg:p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] -mr-32 -mt-32 rounded-full" />
                        
                        <div className="relative z-10 space-y-8">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                <div className="space-y-2">
                                    <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Panel de <span className="text-blue-500">Filtrado</span></h2>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">Gestiona y analiza el histórico de reparaciones con precisión.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={handleCreateClick}
                                        className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20"
                                    >
                                        <Package className="w-4 h-4" /> Nuevo Registro
                                    </button>
                                    <button 
                                        onClick={clearFilters}
                                        className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-red-500 hover:text-white text-slate-600 dark:text-slate-400 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest border border-slate-200 dark:border-slate-700"
                                    >
                                        <Trash2 className="w-4 h-4" /> Limpiar Todo
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                                {/* BUSCADOR GLOBAL */}
                                <div className="md:col-span-2 xl:col-span-2 relative group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Código, Nombre, Usuario..."
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                        value={searchTerm}
                                        onChange={(e) => handleSearchChange(e.target.value)}
                                    />
                                    <label className="absolute -top-2 left-6 px-2 bg-white dark:bg-[#0f172a] text-[9px] font-black text-blue-500 uppercase tracking-widest">Buscador Global</label>
                                </div>

                                {/* FILTRO DEFECTOS */}
                                <div className="xl:col-span-1 relative group">
                                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500" />
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold appearance-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none uppercase"
                                        value={filterDefecto}
                                        onChange={(e) => setFilterDefecto(e.target.value)}
                                    >
                                        <option value="">TODOS LOS DEFECTOS</option>
                                        {defectsCatalog.map((d, i) => (
                                            <option key={i} value={d.Título}>{d.Título}</option>
                                        ))}
                                    </select>
                                    <label className="absolute -top-2 left-6 px-2 bg-white dark:bg-[#0f172a] text-[9px] font-black text-blue-500 uppercase tracking-widest">Defectos</label>
                                </div>

                                {/* FILTRO RESPONSABLE */}
                                <div className="xl:col-span-1 relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500" />
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold appearance-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none uppercase"
                                        value={filterResponsable}
                                        onChange={(e) => setFilterResponsable(e.target.value)}
                                    >
                                        <option value="">TODOS LOS RESPONSABLES</option>
                                        {personnelCatalog.map((p, i) => (
                                            <option key={i} value={p.NombreCompleto}>{p.NombreCompleto}</option>
                                        ))}
                                    </select>
                                    <label className="absolute -top-2 left-6 px-2 bg-white dark:bg-[#0f172a] text-[9px] font-black text-blue-500 uppercase tracking-widest">Personal</label>
                                </div>

                                {/* FECHA DESDE */}
                                <div className="xl:col-span-1 relative group">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500" />
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-xs font-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                        value={filterFechaDesde}
                                        onChange={(e) => setFilterFechaDesde(e.target.value)}
                                    />
                                    <label className="absolute -top-2 left-6 px-2 bg-white dark:bg-[#0f172a] text-[9px] font-black text-blue-500 uppercase tracking-widest">Fecha Desde</label>
                                </div>

                                {/* FECHA HASTA */}
                                <div className="xl:col-span-1 relative group">
                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500" />
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-xs font-black focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                        value={filterFechaHasta}
                                        onChange={(e) => setFilterFechaHasta(e.target.value)}
                                    />
                                    <label className="absolute -top-2 left-6 px-2 bg-white dark:bg-[#0f172a] text-[9px] font-black text-blue-500 uppercase tracking-widest">Fecha Hasta</label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TABLE SECTION */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[500px]">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                            <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-3">
                                <Clock className="w-5 h-5 text-blue-500" /> Historial de Movimientos
                            </h3>
                            <div className="flex items-center gap-3">
                                {loadingMore && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                                <span className="px-5 py-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-[10px] font-black border border-blue-100 dark:border-blue-500/20 uppercase tracking-widest">
                                    {records.length} Resultados
                                </span>
                            </div>
                        </div>

                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse min-w-[1100px]">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800">
                                        <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Registro / Fecha</th>
                                        <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Información Molde</th>
                                        <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado Actual</th>
                                        <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Defectos & Notas</th>
                                        <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Personal Asignado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {records.map((m, i) => (
                                        <tr 
                                            key={`${m.ID}-${i}`} 
                                            ref={i === records.length - 1 ? lastElementRef : null}
                                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-all group"
                                        >
                                            <td className="py-6 px-8">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-black text-slate-900 dark:text-white">
                                                        {m['FECHA ENTRADA'] && m['FECHA ENTRADA'] !== 'null' ? m['FECHA ENTRADA'] : 'S/F'}
                                                    </span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Entrada</span>
                                                </div>
                                            </td>
                                            <td className="py-6 px-8">
                                                <div className="space-y-1">
                                                    <div className="text-xs font-black text-slate-700 dark:text-slate-200 group-hover:text-blue-500 transition-colors uppercase">
                                                        {m['CODIGO MOLDE'] || 'S/C'}
                                                    </div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter line-clamp-1">
                                                        {m['Nombre'] || 'Sin Título'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-6 px-8">
                                                <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black border uppercase tracking-widest ${
                                                    m['ESTADO']?.toUpperCase().includes('ESPERA') ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                                                    m['ESTADO']?.toUpperCase().includes('PROCESO') || m['ESTADO']?.toUpperCase().includes('REPARACION') ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' :
                                                    m['ESTADO']?.toUpperCase().includes('ENTREGADO') || m['ESTADO']?.toUpperCase().includes('OK') ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                                                    'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                                                }`}>
                                                    {m['ESTADO'] || 'Sin Estado'}
                                                </span>
                                            </td>
                                            <td className="py-6 px-8 max-w-[350px]">
                                                <div className="space-y-1.5">
                                                    <p className="text-xs font-bold text-red-500 dark:text-red-400/90 leading-relaxed">
                                                        {m['DEFECTOS A REPARAR'] || '--'}
                                                    </p>
                                                    {m['OBSERVACIONES'] && (
                                                        <p className="text-[10px] text-slate-500 dark:text-slate-500 italic line-clamp-2">
                                                            {m['OBSERVACIONES']}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-6 px-8">
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center border border-blue-500/20 shrink-0">
                                                            <User className="w-3.5 h-3.5 text-blue-500" />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-[10px] font-black text-slate-800 dark:text-white truncate uppercase tracking-tight">
                                                                {m['Responsable'] || 'No Asignado'}
                                                            </span>
                                                            <span className="text-[8px] font-bold text-slate-500 uppercase">
                                                                ID: {m['ID'] || m['id'] || '---'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleEditClick(m)} 
                                                        className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-500 dark:hover:bg-blue-500 hover:text-white dark:hover:text-white text-slate-500 dark:text-slate-400 transition-colors rounded-xl border border-slate-200 dark:border-slate-700 active:scale-95 group-hover:opacity-100 opacity-0 md:opacity-100"
                                                        title="Editar Registro"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {/* LOADING STATES */}
                            {loading && (
                                <div className="p-24 flex flex-col items-center justify-center">
                                    <div className="relative">
                                        <div className="w-16 h-16 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Loader2 className="w-6 h-6 text-blue-500 animate-pulse" />
                                        </div>
                                    </div>
                                    <p className="text-sm font-black text-slate-400 mt-8 animate-pulse tracking-widest uppercase">Consultando Datos Unificados...</p>
                                </div>
                            )}

                            {!loading && records.length === 0 && (
                                <div className="p-24 flex flex-col items-center justify-center text-center">
                                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-6">
                                        <Search className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                                    </div>
                                    <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2">Sin Resultados</h4>
                                    <p className="text-sm text-slate-500 max-w-xs mx-auto">No encontramos registros que coincidan con los filtros aplicados actualmente.</p>
                                </div>
                            )}

                            {loadingMore && (
                                <div className="p-10 text-center bg-slate-50/50 dark:bg-slate-950/50 animate-pulse">
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500">Recuperando más información...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* FLOATING ACTION NAV */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2.5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl z-50">
                <button onClick={() => router.push('/dashboard/molds')} className="flex items-center gap-3 px-8 py-4 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-3xl transition-all font-black text-[10px] uppercase tracking-widest">
                    <Package className="w-4 h-4" /> MOLDES
                </button>
                <div className="px-8 py-4 bg-blue-500 text-white rounded-3xl transition-all font-black text-[10px] flex items-center gap-3 shadow-xl shadow-blue-500/30 uppercase tracking-widest">
                    <ClipboardList className="w-4 h-4" /> REGISTRO
                </div>
                <button onClick={() => router.push('/dashboard/audit')} className="flex items-center gap-3 px-8 py-4 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-3xl transition-all font-black text-[10px] uppercase tracking-widest">
                    <Activity className="w-4 h-4" /> AUDITORIA
                </button>
            </div>

            {/* EDIT MODAL */}
            {editingRecord && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pb-20 sm:pb-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingRecord(null)} />
                    <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                        
                        {/* Header Modal */}
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50 rounded-t-[2rem]">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                    {isCreateMode ? <Package className="w-5 h-5 text-blue-500" /> : <Edit2 className="w-5 h-5 text-blue-500" />}
                                    {isCreateMode ? 'Nuevo Registro de Molde' : 'Editar Registro de Molde'}
                                </h3>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                                    {isCreateMode ? 'Creando nueva entrada en producción' : `Molde: ${editingRecord['CODIGO MOLDE']} | ID: ${editingRecord.ID || editingRecord.id}`}
                                </p>
                            </div>
                            <button 
                                onClick={() => setEditingRecord(null)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Body Modal */}
                        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                {/* CODIGO MOLDE */}
                                <div className="space-y-2 relative group-mold-search">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Código del Molde</label>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Buscar por serie o nombre..."
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none uppercase"
                                            value={editForm['CODIGO MOLDE'] || ''}
                                            onChange={(e) => handleMoldSearch(e.target.value)}
                                            onFocus={() => {
                                                if (editForm['CODIGO MOLDE']?.length >= 2) setShowMoldResults(true)
                                            }}
                                        />
                                        {isSearchingMolds && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                            </div>
                                        )}
                                    </div>

                                    {/* MOLD SEARCH RESULTS DROPDOWN */}
                                    {showMoldResults && (moldSearchResults.length > 0 || isSearchingMolds) && (
                                        <div className="absolute z-[110] left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                                            {moldSearchResults.map((mold, idx) => (
                                                <button
                                                    key={mold.id || idx}
                                                    type="button"
                                                    onClick={() => handleSelectMold(mold)}
                                                    className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800 flex flex-col gap-1 border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[11px] font-black text-blue-500 uppercase tracking-tight">{mold.serial}</span>
                                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                                            mold.estado?.toLowerCase().includes('disp') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                                                        }`}>
                                                            {mold.estado}
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase line-clamp-1">{mold.nombre_articulo}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* CLOSE SEARCH WHEN CLICKING AWAY - handled by simple blur or user selection */}
                                    {showMoldResults && (
                                        <div 
                                            className="fixed inset-0 z-[105]" 
                                            onClick={() => setShowMoldResults(false)}
                                        />
                                    )}
                                </div>

                                {/* NOMBRE / REFERENCIA */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nombre / Referencia</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: LAVAMANOS MARSEL AQUAMARINA"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none uppercase"
                                        value={editForm['Nombre'] || ''}
                                        onChange={(e) => setEditForm({ ...editForm, "Nombre": e.target.value.toUpperCase() })}
                                    />
                                </div>

                                {/* ESTADO */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none uppercase"
                                        value={editForm['ESTADO'] || ''}
                                        onChange={(e) => setEditForm({ ...editForm, "ESTADO": e.target.value })}
                                    >
                                        <option value="">Seleccione Estado</option>
                                        <option value="Entregado">Entregado</option>
                                        <option value="En espera - produccion">En espera - produccion</option>
                                        <option value="En reparacion">En reparacion</option>
                                        <option value="en espera - Moldes">en espera - Moldes</option>
                                    </select>
                                </div>

                                {/* RESPONSABLE */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Responsable</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none uppercase"
                                        value={editForm['Responsable'] || ''}
                                        onChange={(e) => setEditForm({ ...editForm, "Responsable": e.target.value })}
                                    >
                                        <option value="">Seleccione Responsable</option>
                                        {personnelCatalog.map((p, i) => (
                                            <option key={i} value={p.NombreCompleto}>{p.NombreCompleto}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* FECHA ESPERADA */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha Esperada</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none uppercase"
                                        value={editForm['FECHA ESPERADA'] ? editForm['FECHA ESPERADA'].split('T')[0] : ''}
                                        onChange={(e) => setEditForm({ ...editForm, "FECHA ESPERADA": e.target.value })}
                                    />
                                </div>

                                {/* PRIORIDAD */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Prioridad</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none uppercase"
                                        value={editForm['Prioridad'] || ''}
                                        onChange={(e) => setEditForm({ ...editForm, "Prioridad": e.target.value })}
                                    >
                                        <option value="">Seleccione Prioridad</option>
                                        <option value="Alta">Alta</option>
                                        <option value="Media">Media</option>
                                        <option value="Baja">Baja</option>
                                    </select>
                                </div>
                                
                                {/* TIPO */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none uppercase"
                                        value={editForm['Tipo'] || ''}
                                        onChange={(e) => setEditForm({ ...editForm, "Tipo": e.target.value })}
                                    >
                                        <option value="">Seleccione Tipo</option>
                                        <option value="MS">MS</option>
                                        <option value="FV">FV</option>
                                    </select>
                                </div>

                                {/* TIPO DE REPARACIÓN */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo de Reparación</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none uppercase"
                                        value={editForm['Tipo de reparacion'] || ''}
                                        onChange={(e) => setEditForm({ ...editForm, "Tipo de reparacion": e.target.value })}
                                    />
                                </div>

                                {/* RECIBIDO */}
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recibido (Persona que recibe)</label>
                                    <select
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-xs font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none uppercase"
                                        value={editForm['Recibido'] || ''}
                                        onChange={(e) => setEditForm({ ...editForm, "Recibido": e.target.value })}
                                    >
                                        <option value="">Seleccione Receptor</option>
                                        {supervisorsCatalog.map((s, i) => (
                                            <option key={i} value={s.nombreCompleto}>
                                                {s.nombreCompleto} - {s.cargo}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* DEFECTOS A REPARAR */}
                                <div className="space-y-4 md:col-span-2">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Defectos a Reparar</label>
                                        <div className="relative group min-w-[250px]">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="Buscar defecto..."
                                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 pl-9 pr-4 text-[10px] font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                                value={defectSearch}
                                                onChange={(e) => setDefectSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2 mb-2 custom-scrollbar overflow-x-auto pb-2 min-h-[44px]">
                                        {defectsCatalog
                                            .filter(d => d.Título?.toLowerCase().includes(defectSearch.toLowerCase()))
                                            .map((d, i) => {
                                                const isSelected = editForm['DEFECTOS A REPARAR']?.includes(d.Título);
                                                return (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        onClick={() => {
                                                            const current = editForm['DEFECTOS A REPARAR'] ? editForm['DEFECTOS A REPARAR'].split(',').map((x: string) => x.trim()).filter(Boolean) : [];
                                                            let newDefects = [];
                                                            if (isSelected) {
                                                                newDefects = current.filter((x: string) => x !== d.Título);
                                                            } else {
                                                                newDefects = [...current, d.Título];
                                                            }
                                                            setEditForm({ ...editForm, "DEFECTOS A REPARAR": newDefects.join(', ') });
                                                        }}
                                                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-colors border ${
                                                            isSelected 
                                                                ? 'bg-blue-500 text-white border-blue-600 shadow-md shadow-blue-500/20' 
                                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                        }`}
                                                    >
                                                        {d.Título}
                                                    </button>
                                                )
                                            })}
                                        {defectsCatalog.filter(d => d.Título?.toLowerCase().includes(defectSearch.toLowerCase())).length === 0 && (
                                            <span className="text-[10px] font-bold text-slate-400 italic py-2">No se encontraron defectos coincidentes</span>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="O ingrese texto libre separado por comas..."
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-xs font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                        value={editForm['DEFECTOS A REPARAR'] || ''}
                                        onChange={(e) => setEditForm({ ...editForm, "DEFECTOS A REPARAR": e.target.value })}
                                    />
                                </div>

                                {/* MEDIDAS */}
                                <div className="space-y-4 md:col-span-2 p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Medidas del Molde</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Espesor Pestaña</label>
                                            <input
                                                type="text"
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-blue-500/20 outline-none"
                                                value={editForm['espesor_pestana'] || ''}
                                                onChange={(e) => setEditForm({ ...editForm, "espesor_pestana": e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Espesor Bowl</label>
                                            <input
                                                type="text"
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-blue-500/20 outline-none"
                                                value={editForm['espesor_bowl'] || ''}
                                                onChange={(e) => setEditForm({ ...editForm, "espesor_bowl": e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Espesor Fondo</label>
                                            <input
                                                type="text"
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-blue-500/20 outline-none"
                                                value={editForm['espesor_fondo'] || ''}
                                                onChange={(e) => setEditForm({ ...editForm, "espesor_fondo": e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Espesor Parte Plana</label>
                                            <input
                                                type="text"
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-blue-500/20 outline-none"
                                                value={editForm['espesor_parte_plana'] || ''}
                                                onChange={(e) => setEditForm({ ...editForm, "espesor_parte_plana": e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">H Altura Pestaña</label>
                                            <input
                                                type="text"
                                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-blue-500/20 outline-none"
                                                value={editForm['H altura de pestaña'] || ''}
                                                onChange={(e) => setEditForm({ ...editForm, "H altura de pestaña": e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* OBSERVACIONES */}
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Observaciones</label>
                                    <textarea
                                        rows={3}
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-xs font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none resize-none"
                                        value={editForm['OBSERVACIONES'] || ''}
                                        onChange={(e) => setEditForm({ ...editForm, "OBSERVACIONES": e.target.value })}
                                    />
                                </div>
                            </div>

                        </div>

                        {/* Footer Modal */}
                        <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-4 shrink-0 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-[2rem]">
                            <button 
                                onClick={() => setEditingRecord(null)}
                                disabled={isSaving}
                                className="px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors uppercase tracking-widest disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleUpdateRecord}
                                disabled={isSaving}
                                className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {isSaving ? 'Guardando...' : (isCreateMode ? 'Crear Registro' : 'Guardar Cambios')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
