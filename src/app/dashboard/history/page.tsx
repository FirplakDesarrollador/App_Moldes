'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Package, ClipboardList, Activity, Search, Clock, Loader2, Filter, Calendar, User, Trash2 } from 'lucide-react'
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
    
    const [offset, setOffset] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    
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
                // Fetch both catalogs in parallel
                const [defects, personnel] = await Promise.all([
                    moldsService.getDefectsCatalog(),
                    moldsService.getPersonnel()
                ])
                setDefectsCatalog(defects || [])
                setPersonnelCatalog(personnel || [])
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
                                <button 
                                    onClick={clearFilters}
                                    className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-red-500 hover:text-white text-slate-600 dark:text-slate-400 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest border border-slate-200 dark:border-slate-700"
                                >
                                    <Trash2 className="w-4 h-4" /> Limpiar Todo
                                </button>
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
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center border border-blue-500/20 shrink-0">
                                                        <User className="w-3.5 h-3.5 text-blue-500" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[10px] font-black text-slate-800 dark:text-white truncate uppercase tracking-tight">
                                                            {m['Responsable'] || 'No Asignado'}
                                                        </span>
                                                        <span className="text-[8px] font-bold text-slate-500 uppercase">
                                                            ID: {m['ID'] || '---'}
                                                        </span>
                                                    </div>
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
                    <Package className="w-4 h-4" /> Molds
                </button>
                <div className="px-8 py-4 bg-blue-500 text-white rounded-3xl transition-all font-black text-[10px] flex items-center gap-3 shadow-xl shadow-blue-500/30 uppercase tracking-widest">
                    <ClipboardList className="w-4 h-4" /> History
                </div>
                <button onClick={() => router.push('/dashboard/audit')} className="flex items-center gap-3 px-8 py-4 text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-3xl transition-all font-black text-[10px] uppercase tracking-widest">
                    <Activity className="w-4 h-4" /> Audit
                </button>
            </div>
        </div>
    )
}
