
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Package, ClipboardList, Activity, Search, Clock, Loader2, Filter, Calendar, User, Trash2, Edit2, X, Save, AlertTriangle, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react'
import { moldsService } from '@/services/molds.service'
import Navbar from '@/components/layout/Navbar'
import holidaysData from '@/data/colombia_festivos_2026.json'

const BATCH_SIZE = 20

export default function RegistroMoldesPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [loadingMore, setLoadingMore] = useState(false)
    const [records, setRecords] = useState<any[]>([])
    
    // Filters State
    const [searchTerm, setSearchTerm] = useState('')
    const [filterRepairType, setFilterRepairType] = useState('En Reparacion') // Default starting filter
    const [filterView, setFilterView] = useState('Todos') // 'Todos', 'Reparacion Rapida', 'Reparacion Especial'
    const [categoryFilter, setCategoryFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [expectedDateFilter, setExpectedDateFilter] = useState('')
    const [deliveryDateFilter, setDeliveryDateFilter] = useState('')
    const [responsibleFilter, setResponsibleFilter] = useState('')
    const [defectFilter, setDefectFilter] = useState('')

    // Catalogs State
    const [defectsCatalog, setDefectsCatalog] = useState<any[]>([])
    const [personnelCatalog, setPersonnelCatalog] = useState<any[]>([])
    const [responsiblesList, setResponsiblesList] = useState<string[]>([])
    
    const [offset, setOffset] = useState(0)
    const [hasMore, setHasMore] = useState(true)

    // Edit/Create Modal State
    const [editingRecord, setEditingRecord] = useState<any>(null)
    const [editForm, setEditForm] = useState<any>({})
    const [isSaving, setIsSaving] = useState(false)
    const [isCreateMode, setIsCreateMode] = useState(false)

    // Mold Search State
    const [moldSearchQuery, setMoldSearchQuery] = useState('')
    const [moldSearchResults, setMoldSearchResults] = useState<any[]>([])
    const [isSearchingMolds, setIsSearchingMolds] = useState(false)
    const [showMoldResults, setShowMoldResults] = useState(false)
    
    // Autocomplete for Master Molds
    const [masterMolds, setMasterMolds] = useState<any[]>([])
    const [masterSearch, setMasterSearch] = useState('')

    // Defect Dropdown State
    const [defectSearch, setDefectSearch] = useState('')
    const [showDefectDropdown, setShowDefectDropdown] = useState(false)
    const defectInputRef = useRef<HTMLInputElement>(null)

    // Global Search with Autocomplete
    const [globalMoldsResults, setGlobalMoldsResults] = useState<any[]>([])
    const [isSearchingGlobal, setIsSearchingGlobal] = useState(false)
    const [showGlobalResults, setShowGlobalResults] = useState(false)

    const searchTimeout = useRef<NodeJS.Timeout | null>(null)
    const observer = useRef<IntersectionObserver | null>(null)
    const globalResultsRef = useRef<HTMLDivElement>(null)

    // Close global results on escape or click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (globalResultsRef.current && !globalResultsRef.current.contains(event.target as Node)) {
                setShowGlobalResults(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

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

    // Load Initial Data
    useEffect(() => {
        const storedUser = localStorage.getItem('moldapp_user')
        if (!storedUser) {
            router.push('/login')
            return
        }
        setUser(JSON.parse(storedUser))

        const loadCatalogs = async () => {
            try {
                const [defects, personnel, responsibles] = await Promise.all([
                    moldsService.getDefectsCatalog(),
                    moldsService.getPersonnel(),
                    moldsService.getRegistroResponsables()
                ])
                setDefectsCatalog(defects || [])
                setPersonnelCatalog(personnel || [])
                if (responsibles && responsibles.length > 0) {
                    setResponsiblesList(responsibles)
                }
            } catch (error) {
                console.error('Error loading catalogs:', error)
            }
        }
        loadCatalogs()
    }, [router])

    const fetchInitial = async (searchVal: string, repairType: string) => {
        setLoading(true)
        setOffset(0)
        console.log('>>> FETCH INITIAL:', { searchVal, repairType, categoryFilter, statusFilter, expectedDateFilter, deliveryDateFilter, responsibleFilter, defectFilter })
        try {
            // "Al ingresar... deben mostrarse únicamente los moldes que estén en estado de reparación"
            const data = await moldsService.getAllRegistros(BATCH_SIZE, 0, searchVal, {
                repair_type: repairType === 'Todos' ? '' : repairType,
                categoria: categoryFilter,
                estado: statusFilter,
                fecha_esperada: expectedDateFilter,
                fecha_entrega: deliveryDateFilter,
                responsable: responsibleFilter,
                defecto: defectFilter
            })

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
            const data = await moldsService.getAllRegistros(BATCH_SIZE, offset, searchTerm, {
                repair_type: filterView === 'Todos' ? '' : filterView,
                categoria: categoryFilter,
                estado: statusFilter,
                fecha_esperada: expectedDateFilter,
                fecha_entrega: deliveryDateFilter,
                responsable: responsibleFilter,
                defecto: defectFilter
            })
            if (data.length < BATCH_SIZE) setHasMore(false)
            setRecords(prev => [...prev, ...data])
        } catch (error) {
            console.error('Error loading more:', error)
        } finally {
            setLoadingMore(false)
        }
    }

    useEffect(() => {
        if (offset > 0) fetchMore()
    }, [offset])

    useEffect(() => {
        fetchInitial(searchTerm, filterView)
    }, [searchTerm, filterView, categoryFilter, statusFilter, expectedDateFilter, deliveryDateFilter, responsibleFilter, defectFilter])

    const hasActiveFilters = Boolean(
        categoryFilter || statusFilter || expectedDateFilter || deliveryDateFilter || responsibleFilter || defectFilter
    )

    const resetFilters = () => {
        setCategoryFilter('')
        setStatusFilter('')
        setExpectedDateFilter('')
        setDeliveryDateFilter('')
        setResponsibleFilter('')
        setDefectFilter('')
    }

    const getCategoryLabel = (r: { tipo?: string | null; tipo_de_reparacion?: string | null; observaciones?: string | null; defectos_a_reparar?: string | null }) => {
        const tipo = (r.tipo || '').toUpperCase()
        const tipoRep = (r.tipo_de_reparacion || '').toUpperCase()
        const obs = (r.observaciones || '').toUpperCase()
        const def = (r.defectos_a_reparar || '').toUpperCase()

        if (tipo === 'MOLDE NUEVO' || obs.includes('MOLDE NUEVO')) return 'Molde nuevo'
        if (tipoRep.includes('MODELO') || obs.includes('MODELO NUEVO')) return 'Modelo nuevo'
        if (tipoRep.includes('RAPIDA') || tipoRep.includes('RÁPIDA')) return 'Reparación rápida'
        if (tipoRep.includes('ESPECIAL')) return 'Reparación especial'
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

    const getStatusStyles = (st: string) => {
        const s = (st || '').toUpperCase()
        if (s.includes('REPARACION') || s.includes('PROCESO')) return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
        if (s.includes('ESPERA')) return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20'
        if (s.includes('ENTREGADO') || s.includes('OK') || s.includes('ACTIVO')) return 'bg-green-500/10 text-green-600 border-green-500/20'
        if (s.includes('DESTRUIDO') || s.includes('BAJA')) return 'bg-red-500/10 text-red-600 border-red-500/20'
        return 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
    }

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '—'
        return dateStr.split('T')[0]
    }

    // Modal search (within Nuevo registro): must use BD_moldes
    const handleMasterSearch = async (val: string) => {
        setMasterSearch(val)
        if (val.length < 2) {
            setMasterMolds([])
            return
        }
        try {
            // Requirement 2.4: Nuevo registro list must connect to BD_moldes
            const results = await moldsService.searchRegistroMoldes(val)
            setMasterMolds(results || [])
        } catch (e) {
            console.error(e)
        }
    }

    // Global search (header): must use moldes table
    const handleGlobalSearchChange = async (val: string) => {
        setSearchTerm(val)
        if (val.length < 2) {
            setGlobalMoldsResults([])
            setShowGlobalResults(false)
            return
        }
        setIsSearchingGlobal(true)
        setShowGlobalResults(true)
        try {
            // Requirement 2.2: Global search must connect to moldes table
            const results = await moldsService.searchMoldsMaster(val)
            setGlobalMoldsResults(results || [])
        } catch (e) {
            console.error(e)
        } finally {
            setIsSearchingGlobal(false)
        }
    }

    const selectGlobalMold = (m: any) => {
        setSearchTerm(m.serial)
        setShowGlobalResults(false)
        setGlobalMoldsResults([]) // Clear result to hide box
        // Optionally jump to it by filtering exactly
        fetchInitial(m.serial, filterView)
    }

    const selectMasterMoldFromBD = (m: any) => {
        setEditForm((prev: any) => ({
            ...prev,
            codigo_molde: m.codigo_molde,
            titulo: m.titulo,
            responsable: m.responsable || prev.responsable,
            estado: ['Entregado', 'En reparación', 'Destruido'].includes(m.estado) ? m.estado : 'En reparación'
        }))
        setMasterMolds([])
        setMasterSearch(m.codigo_molde)
    }

    // Requirement 2.6: Calculation excluding Sat, Sun and holidays
    const calculateExpectedDate = (entryDate: string, selectedDefects: string) => {
        if (!entryDate) return ''
        const date = new Date(entryDate)
        
        let totalDays = 0;
        const defectArray = selectedDefects.split(',').map(d => d.trim());
        defectArray.forEach(title => {
            const defRecord = defectsCatalog.find(d => d.titulo === title);
            if (defRecord) {
                totalDays += (defRecord.tiempo || 0);
            }
        });

        if (totalDays <= 0) return entryDate;

        const holidays = Array.isArray(holidaysData) ? (holidaysData as string[]) : [];
        let addedDays = 0;
        let targetDays = Math.ceil(totalDays);

        while (addedDays < targetDays) {
            date.setDate(date.getDate() + 1);
            const day = date.getDay(); // 0: Sun, 6: Sat
            const dateStr = date.toISOString().split('T')[0];

            if (day !== 0 && day !== 6 && !holidays.includes(dateStr)) {
                addedDays++;
            }
        }

        // If the result finally falls on a non-business day (though the loop logic prevents it for addedDays > 0),
        // we ensure it's pushed to next. (Shouldn't happen with the while logic but for completeness)
        let finalDay = date.getDay();
        let finalStr = date.toISOString().split('T')[0];
        while (finalDay === 0 || finalDay === 6 || holidays.includes(finalStr)) {
            date.setDate(date.getDate() + 1);
            finalDay = date.getDay();
            finalStr = date.toISOString().split('T')[0];
        }

        return date.toISOString().split('T')[0];
    }

    const toggleDefect = (title: string) => {
        setEditForm((prev: any) => {
            const current = prev.defectos_a_reparar ? prev.defectos_a_reparar.split(',').map((x: string) => x.trim()).filter(Boolean) : [];
            let updated = [];
            if (current.includes(title)) {
                updated = current.filter((x: string) => x !== title);
            } else {
                updated = [...current, title];
            }
            
            const defectString = updated.join(', ');
            const entryDate = prev.fecha_entrada || new Date().toISOString().split('T')[0];
            const expectedDate = calculateExpectedDate(entryDate, defectString);

            return {
                ...prev,
                defectos_a_reparar: defectString,
                fecha_esperada: expectedDate
            };
        });
    }

    const handleEditClick = (record: any) => {
        setIsCreateMode(false)
        setEditingRecord(record)
        setEditForm({ ...record })
        setMasterSearch(record.codigo_molde || '')
    }

    const handleCreateClick = () => {
        setIsCreateMode(true)
        const today = new Date().toISOString().split('T')[0];
        setEditingRecord({ id: 'NEW' }) 
        setEditForm({
            codigo_molde: '',
            titulo: '',
            defectos_a_reparar: '',
            fecha_entrada: today,
            fecha_esperada: today,
            estado: 'En reparación',
            observaciones: '',
            responsable: '',
            recibido: '',
            tipo_de_reparacion: 'Reparación rápida',
            tipo: 'Molde',
            usuario: user?.Nombre || 'Desconocido'
        })
        setMasterSearch('')
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            // Map app state to SAP expected state
            let sapEstado = editForm.estado;
            if (editForm.estado === 'Entregado') sapEstado = 'Activo';
            if (editForm.estado === 'Destruido') sapEstado = 'Baja';

            // 1. SUPABASE UPDATE
            await moldsService.saveRegistro({
                ...editForm,
                usuario: user?.Nombre || user?.NombreCompleto,
                modified_by: user?.Nombre
            }, isCreateMode)

            // 2. SAP UPDATE
            // (Only try to update SAP if we have a valid code)
            let sapSuccess = true;
            let sapErrorMessage = '';
            if (editForm.codigo_molde) {
                try {
                    const serialSAP = String(editForm.codigo_molde).trim();
                    console.log("Serial enviado a SAP:", serialSAP);
                    
                    const res = await fetch('/api/sap-items/update', {
                        method: 'POST',
                        body: JSON.stringify({
                            itemCode: serialSAP,
                            serialNumber: serialSAP,
                            estado_sap: sapEstado
                        })
                    });
                    
                    const sapRes = await res.json();
                    if (!sapRes.success) {
                        sapSuccess = false;
                        sapErrorMessage = sapRes.error;
                        console.error('SAP Update Failed logic side:', sapRes.error);
                    }
                } catch (e) {
                    sapSuccess = false;
                    console.error('SAP server error exception:', e);
                }
            }

            // 3. RESULT
            if (sapSuccess) {
                alert('Registro guardado y estado actualizado en SAP correctamente');
            } else {
                alert('Registro guardado, pero falló SAP: ' + (sapErrorMessage || 'No fue posible comunicar con SAP'));
            }
            
            fetchInitial(searchTerm, filterView)
            setEditingRecord(null)
        } catch (error) {
            console.error(error)
            alert('Error al guardar el registro en la base de datos')
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
            const results = await moldsService.searchRegistroMoldes(query)
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
                title="Registro moldes"
                subtitle="Gestión de Reparaciones y Mantenimiento"
            />

            <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 w-full max-w-[98%] 2xl:max-w-[1920px] mx-auto">
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    
                    {/* Header & Main Controls */}
                    <div className="bg-white dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl p-6 lg:p-10 relative overflow-hidden">
                        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                            <div className="space-y-1">
                                <h1 className="text-3xl lg:text-4xl font-black tracking-tighter uppercase text-slate-900 dark:text-white">Registro <span className="text-blue-500">moldes</span></h1>
                                <p className="text-slate-500 font-medium text-xs lg:text-sm">Panel consolidado de reparaciones en curso.</p>
                            </div>
                            
                            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full lg:w-auto">
                                {/* Type Selector */}
                                <div className="flex flex-wrap bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                                    {['Todos', 'Reparación rápida', 'Reparación especial'].map((v) => (
                                        <button
                                            key={v}
                                            onClick={() => setFilterView(v)}
                                            className={`flex-1 min-w-[30%] px-3 py-2.5 md:px-5 md:py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase transition-all text-center ${filterView === v ? 'bg-white dark:bg-slate-700 text-blue-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>

                                <button onClick={handleCreateClick} className="w-full md:w-auto px-6 py-3.5 bg-blue-500 text-white rounded-2xl font-black text-[11px] md:text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all">
                                    <Package className="w-4 h-4" /> Nuevo Registro
                                </button>
                            </div>
                        </div>

                        {/* Search Bar - Upgraded to Autocomplete pointing to 'moldes' table per Requirement 2.2 */}
                        <div className="mt-6 relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Escribe para buscar el molde en Maestro 'moldes'..."
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-16 pr-8 text-sm font-medium outline-none"
                                value={searchTerm}
                                onChange={(e) => handleGlobalSearchChange(e.target.value)}
                                onFocus={() => { if(searchTerm.length >= 2) setShowGlobalResults(true) }}
                            />
                            {showGlobalResults && globalMoldsResults.length > 0 && (
                                <div ref={globalResultsRef} className="absolute top-full left-0 right-0 mt-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-2xl z-[100] p-4 max-h-[400px] overflow-y-auto animate-in slide-in-from-top-2 duration-200">
                                    <h4 className="px-4 py-2 text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Resultados en Maestro 'moldes'</h4>
                                    {globalMoldsResults.map((m) => (
                                        <button 
                                            key={m.id} 
                                            onClick={() => selectGlobalMold(m)}
                                            className="w-full text-left p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-all border-b border-slate-50 dark:border-slate-800 last:border-0 flex flex-col gap-1"
                                        >
                                            <span className="text-sm font-black text-slate-900 dark:text-white">{m.serial}</span>
                                            <span className="text-xs font-bold text-slate-400 uppercase">{m.nombre_articulo}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Complementary Filters */}
                        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80 space-y-3.5">
                            {/* Row 1: Categoría, Estado, Responsable */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                                {/* Categoría */}
                                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 relative group">
                                    <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 pointer-events-none" />
                                    <select
                                        className="w-full bg-transparent border-0 py-2 pl-9 pr-3 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
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
                                    <label className="absolute -top-2 left-5 px-2 bg-white dark:bg-[#0f172a] text-[9px] font-black text-blue-500 uppercase tracking-widest">Categoría</label>
                                </div>

                                {/* Estado */}
                                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 relative group">
                                    <Activity className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 pointer-events-none" />
                                    <select
                                        className="w-full bg-transparent border-0 py-2 pl-9 pr-3 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="" className="dark:bg-slate-900">Todos los estados</option>
                                        <option value="En reparacion" className="dark:bg-slate-900">En reparación</option>
                                        <option value="En espera - Moldes" className="dark:bg-slate-900">En espera - Moldes</option>
                                        <option value="En espera - Produccion" className="dark:bg-slate-900">En espera - Producción</option>
                                        <option value="Entregado" className="dark:bg-slate-900">Entregado</option>
                                        <option value="Destruido" className="dark:bg-slate-900">Destruido</option>
                                    </select>
                                    <label className="absolute -top-2 left-5 px-2 bg-white dark:bg-[#0f172a] text-[9px] font-black text-blue-500 uppercase tracking-widest">Estado</label>
                                </div>

                                {/* Responsable */}
                                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 relative group">
                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 pointer-events-none" />
                                    <select
                                        className="w-full bg-transparent border-0 py-2 pl-9 pr-3 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                                        value={responsibleFilter}
                                        onChange={(e) => setResponsibleFilter(e.target.value)}
                                    >
                                        <option value="" className="dark:bg-slate-900">Todos los responsables</option>
                                        {Array.from(new Set([
                                            ...responsiblesList,
                                            ...personnelCatalog.map(p => p.NombreCompleto || p.Nombre).filter(Boolean)
                                        ])).sort((a: string, b: string) => a.localeCompare(b)).map((resp) => (
                                            <option key={resp} value={resp} className="dark:bg-slate-900">
                                                {resp}
                                            </option>
                                        ))}
                                    </select>
                                    <label className="absolute -top-2 left-5 px-2 bg-white dark:bg-[#0f172a] text-[9px] font-black text-blue-500 uppercase tracking-widest">Responsable</label>
                                </div>
                            </div>

                            {/* Row 2: Defecto, F. Esperada, F. Real Entrega, Contador y Limpiar */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                                {/* Defecto */}
                                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 relative group">
                                    <AlertCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500" />
                                    <input
                                        type="text"
                                        placeholder="Defecto..."
                                        className="w-full bg-transparent border-0 py-2 pl-8 pr-2 text-xs font-bold text-slate-900 dark:text-white outline-none"
                                        value={defectFilter}
                                        onChange={(e) => setDefectFilter(e.target.value)}
                                    />
                                    <label className="absolute -top-2 left-4 px-2 bg-white dark:bg-[#0f172a] text-[9px] font-black text-blue-500 uppercase tracking-widest">Defecto</label>
                                </div>

                                {/* F. Esperada */}
                                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 relative group">
                                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 pointer-events-none" />
                                    <input
                                        type="date"
                                        className="w-full bg-transparent border-0 py-2 pl-9 pr-3 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                                        value={expectedDateFilter}
                                        onChange={(e) => setExpectedDateFilter(e.target.value)}
                                    />
                                    <label className="absolute -top-2 left-5 px-2 bg-white dark:bg-[#0f172a] text-[9px] font-black text-blue-500 uppercase tracking-widest">F. Esperada</label>
                                </div>

                                {/* F. Real Entrega */}
                                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 relative group">
                                    <CheckCircle2 className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-green-500 pointer-events-none" />
                                    <input
                                        type="date"
                                        className="w-full bg-transparent border-0 py-2 pl-9 pr-3 text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
                                        value={deliveryDateFilter}
                                        onChange={(e) => setDeliveryDateFilter(e.target.value)}
                                    />
                                    <label className="absolute -top-2 left-5 px-2 bg-white dark:bg-[#0f172a] text-[9px] font-black text-green-500 uppercase tracking-widest">F. Real Entrega</label>
                                </div>

                                {/* Estado de Filtros & Limpiar */}
                                <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
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
                                            title="Limpiar filtros"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            Limpiar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Records Table */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-sm overflow-hidden min-h-[500px]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800">
                                        <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400 tracking-wider min-w-[200px]">Título</th>
                                        <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400 tracking-wider whitespace-nowrap">Código</th>
                                        <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400 tracking-wider whitespace-nowrap">Categoría</th>
                                        <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400 tracking-wider whitespace-nowrap">Estado</th>
                                        <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400 tracking-wider whitespace-nowrap">F. Entrada</th>
                                        <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400 tracking-wider whitespace-nowrap">F. Esperada</th>
                                        <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400 tracking-wider whitespace-nowrap">F. Real Entrega</th>
                                        <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400 tracking-wider min-w-[200px]">Defectos & Notas</th>
                                        <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400 tracking-wider whitespace-nowrap">Responsable</th>
                                        <th className="py-4 px-4 text-[10px] font-black uppercase text-slate-400 tracking-wider sticky right-0 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur z-10 text-center border-l border-slate-100 dark:border-slate-800 shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)]">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 relative">
                                    {records.map((r, i) => (
                                        <tr key={`${r.id}-${i}`} ref={i === records.length - 1 ? lastElementRef : null} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                                            <td className="py-4 px-4 align-middle font-bold text-slate-900 dark:text-white uppercase leading-snug text-xs min-w-[200px]">
                                                {r.titulo || 'Sin Título'}
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
                                                <span className={`px-3 py-1.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${getStatusStyles(r.estado)}`}>
                                                    {r.estado || 'Sin Estado'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 align-middle whitespace-nowrap font-mono text-xs font-bold text-slate-600 dark:text-gray-400">
                                                {formatDate(r.fecha_entrada)}
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
                                                    <p className="text-xs font-bold text-red-500 leading-relaxed truncate">{r.defectos_a_reparar || '--'}</p>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 italic truncate opacity-70">{r.observaciones || '--'}</p>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 align-middle whitespace-nowrap text-[10px] font-black text-slate-600 dark:text-gray-400">
                                                {r.responsable || 'N/A'}
                                            </td>
                                            <td className="py-4 px-4 sticky right-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/80 transition-all border-l border-slate-100 dark:border-slate-800 text-center align-middle">
                                                <button onClick={() => handleEditClick(r)} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-blue-500 hover:text-white transition-all border border-slate-200 dark:border-slate-700 mx-auto flex shrink-0 group/btn">
                                                    <Edit2 className="w-3.5 h-3.5 text-slate-500 group-hover/btn:text-white dark:text-slate-400" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {loading && <div className="p-24 flex flex-col items-center justify-center gap-6"><Loader2 className="w-12 h-12 text-blue-500 animate-spin" /><p className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Consultando BD_moldes...</p></div>}
                            {!loading && records.length === 0 && <div className="p-24 text-center space-y-4"><Package className="w-12 h-12 text-slate-300 mx-auto" /><p className="text-sm font-bold text-slate-400 uppercase italic">No se encontraron moldes en reparación en BD_moldes.</p></div>}
                        </div>
                    </div>
                </div>
            </main>

            {/* EDIT/CREATE MODAL */}
            {editingRecord && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-900/40">
                    <div className="w-full max-w-4xl bg-white dark:bg-slate-901 shadow-2xl rounded-[3rem] overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-300">
                        
                        {/* Modal Header */}
                        <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-5 font-sans">
                                <div className="p-4 bg-blue-500 text-white rounded-[1.5rem] shadow-xl shadow-blue-500/20">
                                    <ClipboardList className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{isCreateMode ? 'Nuevo Registro de Molde' : 'Editar Registro Técnico'}</h3>
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mt-1">Conectado a BD_moldes & Moldes Maestro</p>
                                </div>
                            </div>
                            <button onClick={() => setEditingRecord(null)} className="p-3 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all"><X className="w-7 h-7" /></button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-10 overflow-y-auto space-y-10 custom-scrollbar">
                            
                            {/* Section 1: Mold Identification */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Identificación del Molde</h4>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="relative group">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2 absolute -top-2 left-6 bg-white dark:bg-[#0f172a] z-10 transition-colors group-focus-within:text-blue-500">Código del Molde (Maestro)</label>
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all uppercase" 
                                                placeholder="Escribe código (ej: 215-04)"
                                                value={masterSearch || ''}
                                                onChange={(e) => handleMasterSearch(e.target.value.toUpperCase())}
                                            />
                                            {masterMolds.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 p-2 max-h-60 overflow-y-auto overflow-x-hidden">
                                                    <h4 className="px-4 py-2 text-[9px] font-black text-amber-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 mb-2">Registros en 'BD_moldes'</h4>
                                                    {masterMolds.map((m) => (
                                                        <button 
                                                            key={m.id} 
                                                            onClick={() => selectMasterMoldFromBD(m)}
                                                            className="w-full text-left p-4 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl transition-all flex flex-col gap-1 border-b border-slate-50 dark:border-slate-800/50 last:border-0"
                                                        >
                                                            <span className="text-xs font-black text-slate-900 dark:text-white">{m.codigo_molde}</span>
                                                            <span className="text-[10px] font-bold text-slate-500 truncate">{m.titulo}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="relative group">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-2 absolute -top-2 left-6 bg-white dark:bg-[#0f172a] z-10 transition-colors group-focus-within:text-blue-500">Título / Referencia</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-slate-50 dark:bg-slate-951 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all" 
                                            value={editForm.titulo || ''} 
                                            readOnly={!isCreateMode}
                                            onChange={(e) => setEditForm({...editForm, titulo: e.target.value})} 
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Status and Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Estado del Molde</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        <select 
                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-xs font-black uppercase outline-none focus:ring-4 focus:ring-blue-500/5"
                                            value={editForm.estado || ''}
                                            onChange={(e) => setEditForm({...editForm, estado: e.target.value})}
                                        >
                                            <option value="Entregado">Entregado</option>
                                            <option value="En reparación">En reparación</option>
                                            <option value="Destruido">Destruido</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Tipo de Reparación</label>
                                    <select 
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-xs font-black uppercase outline-none focus:ring-4 focus:ring-blue-500/5"
                                        value={editForm.tipo_de_reparacion || ''}
                                        onChange={(e) => setEditForm({...editForm, tipo_de_reparacion: e.target.value})}
                                    >
                                        <option value="Reparación rápida">Reparación rápida</option>
                                        <option value="Reparación especial">Reparación especial</option>
                                    </select>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Personal Responsable</label>
                                    <select 
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-xs font-black uppercase outline-none focus:ring-4 focus:ring-blue-500/5"
                                        value={editForm.responsable || ''}
                                        onChange={(e) => setEditForm({...editForm, responsable: e.target.value})}
                                    >
                                        <option value="">Seleccione Responsable</option>
                                        {personnelCatalog.map((p, i) => <option key={i} value={p.NombreCompleto}>{p.NombreCompleto}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Section 3: Defects & Smart Dates */}
                            <div className="bg-slate-50 dark:bg-slate-950/40 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 space-y-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 opacity-[0.03] rotate-12 pointer-events-none">
                                    <Activity className="w-64 h-64 text-blue-500" />
                                </div>
                                
                                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="space-y-1">
                                        <h5 className="font-black text-xs uppercase tracking-widest text-slate-900 dark:text-white">Defectos a Reparar</h5>
                                        <p className="text-[9px] font-bold text-blue-500 uppercase">Selección sincronizada con tiempos técnicos</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-sm">
                                        <div className="flex flex-col text-right">
                                            <span className="text-[8px] font-black text-slate-400 uppercase">Fecha Estimada</span>
                                            <span className="text-xs font-black text-blue-500">{editForm.fecha_esperada || 'Cargando...'}</span>
                                        </div>
                                        <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 relative">
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {(editForm.defectos_a_reparar ? editForm.defectos_a_reparar.split(',').map((x: string) => x.trim()).filter(Boolean) : []).map((d: string) => (
                                            <span key={d} className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl text-[10px] font-black uppercase">
                                                {d}
                                                <button type="button" onClick={() => toggleDefect(d)} className="hover:bg-blue-200 dark:hover:bg-blue-500/20 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="relative">
                                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            ref={defectInputRef}
                                            type="text"
                                            value={defectSearch}
                                            onChange={e => {
                                                setDefectSearch(e.target.value)
                                                setShowDefectDropdown(true)
                                            }}
                                            onFocus={() => setShowDefectDropdown(true)}
                                            placeholder="Buscar o agregar defecto..."
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-14 pr-5 text-xs font-bold outline-none focus:border-blue-500"
                                        />
                                        {showDefectDropdown && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-[60] overflow-hidden max-h-60 overflow-y-auto">
                                                {defectsCatalog.filter(d => d.titulo.toLowerCase().includes(defectSearch.toLowerCase()) && !(editForm.defectos_a_reparar || '').includes(d.titulo)).map(d => (
                                                    <button
                                                        key={d.titulo}
                                                        type="button"
                                                        onClick={() => {
                                                            toggleDefect(d.titulo)
                                                            setDefectSearch('')
                                                            setShowDefectDropdown(false)
                                                        }}
                                                        className="w-full text-left px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-bold text-[10px] uppercase border-b border-slate-50 dark:border-slate-800 last:border-0 flex justify-between"
                                                    >
                                                        <span>{d.titulo}</span>
                                                        <span className="text-slate-400">+{d.tiempo || 0}d</span>
                                                    </button>
                                                ))}
                                                {defectsCatalog.filter(d => d.titulo.toLowerCase().includes(defectSearch.toLowerCase()) && !(editForm.defectos_a_reparar || '').includes(d.titulo)).length === 0 && (
                                                    <div className="px-6 py-4 text-[10px] uppercase font-bold text-slate-400">No hay coincidencias</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Fecha de Ingreso</label>
                                        <input 
                                            type="date" 
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-sm font-bold outline-none uppercase" 
                                            value={editForm.fecha_entrada || ''}
                                            onChange={(e) => {
                                                const newDate = e.target.value;
                                                const expected = calculateExpectedDate(newDate, editForm.defectos_a_reparar || '');
                                                setEditForm({...editForm, fecha_entrada: newDate, fecha_esperada: expected});
                                            }}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Observaciones Técnicas</label>
                                        <textarea 
                                            rows={3}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-xs font-bold outline-none resize-none" 
                                            placeholder="Detalles adicionales de la reparación..."
                                            value={editForm.observaciones || ''}
                                            onChange={(e) => setEditForm({...editForm, observaciones: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-10 py-10 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-5 bg-slate-50/50 dark:bg-slate-900/50">
                            <button onClick={() => setEditingRecord(null)} className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Cancelar</button>
                            <button 
                                onClick={handleSave} 
                                disabled={isSaving}
                                className="px-12 py-5 bg-blue-500 text-white rounded-[1.8rem] font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-blue-500/30 flex items-center gap-4 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                {isSaving ? 'Actualizando Bases...' : 'Confirmar & Guardar Datos'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
