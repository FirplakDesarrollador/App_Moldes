
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Package, ClipboardList, Activity, Search, Clock, Loader2, Filter, Calendar, User, Trash2, Edit2, X, Save, AlertTriangle } from 'lucide-react'
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

    // Catalogs State
    const [defectsCatalog, setDefectsCatalog] = useState<any[]>([])
    const [personnelCatalog, setPersonnelCatalog] = useState<any[]>([])
    
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
    const [masterSearchType, setMasterSearchType] = useState<'codigo' | 'titulo'>('codigo')

    // Defect Dropdown State
    const [defectSearch, setDefectSearch] = useState('')
    const [showDefectDropdown, setShowDefectDropdown] = useState(false)
    const defectInputRef = useRef<HTMLInputElement>(null)

    // Main Search Suggestions (BD_moldes)
    const [searchSuggestions, setSearchSuggestions] = useState<any[]>([])
    const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(false)
    const suggestionsRef = useRef<HTMLDivElement>(null)

    const searchTimeout = useRef<NodeJS.Timeout | null>(null)
    const observer = useRef<IntersectionObserver | null>(null)


    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
                setShowSuggestions(false)
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

    const fetchInitial = async (searchVal: string, repairType: string) => {
        setLoading(true)
        setOffset(0)
        console.log('>>> FETCH INITIAL:', { searchVal, repairType })
        try {
            // "Al ingresar... deben mostrarse únicamente los moldes que estén en estado de reparación"
            const data = await moldsService.getAllRegistros(BATCH_SIZE, 0, searchVal, {
                repair_type: repairType === 'Todos' ? '' : repairType
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
                repair_type: filterView === 'Todos' ? '' : filterView
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
    }, [searchTerm, filterView])

    // Main List Search (BD_moldes)
    const handleMainSearchChange = async (val: string) => {
        setSearchTerm(val)
        if (val.length < 2) {
            setSearchSuggestions([])
            setShowSuggestions(false)
            return
        }

        setIsSearchingSuggestions(true)
        setShowSuggestions(true)
        try {
            const results = await moldsService.searchMoldsInBD(val)
            setSearchSuggestions(results || [])
        } catch (e) {
            console.error(e)
        } finally {
            setIsSearchingSuggestions(false)
        }
    }

    const selectSuggestion = (s: any) => {
        setSearchTerm(s.serial)
        setShowSuggestions(false)
        fetchInitial(s.serial, filterView)
    }

    // Modal search (within Nuevo registro): must use base_datos_historico_moldes
    async function handleMasterSearch(val: string, type: 'codigo' | 'titulo') {
        setMasterSearch(val)
        setMasterSearchType(type)
        
        // Sincronizar con el formulario para permitir ingreso manual si es necesario
        if (type === 'codigo') {
            setEditForm((prev: any) => ({ ...prev, codigo_molde: val }))
        } else {
            setEditForm((prev: any) => ({ ...prev, titulo: val }))
        }

        if (val.length < 2) {
            setMasterMolds([])
            return
        }
        try {
            const results = await moldsService.searchRegistroMoldes(val, type)
            setMasterMolds(results || [])
        } catch (e) {
            console.error(e)
        }
    }


    const selectMasterMoldFromBD = (m: any) => {
        // m ya viene enriquecido desde searchRegistroMoldes:
        // estado, tipo_de_reparacion y responsable del registro más reciente en BD_moldes
        setEditForm((prev: any) => ({
            ...prev,
            codigo_molde: m.codigo_molde,
            titulo: m.titulo,
            defectos_a_reparar: m.defectos_a_reparar || prev.defectos_a_reparar,
            fecha_entrada: m.fecha_entrada || prev.fecha_entrada,
            fecha_esperada: m.fecha_esperada || prev.fecha_esperada,
            observaciones: m.observaciones || prev.observaciones,
            // Campos enriquecidos desde BD_moldes (registro más reciente)
            estado: m.estado || 'En reparacion',
            tipo_de_reparacion: m.tipo_de_reparacion || prev.tipo_de_reparacion,
            responsable: m.responsable || prev.responsable,
        }))
        setMasterMolds([])
        setMasterSearch(m.codigo_molde)
    }

    // Requirement 2.6: Calculation excluding Sat, Sun and holidays
    const calculateExpectedDate = (entryDate: string, selectedDefects: string) => {
        if (!entryDate) return ''
        const date = new Date(entryDate + 'T00:00:00') // Asegurar hora local 00:00
        
        let totalTime = 0;
        const defectArray = selectedDefects.split(',').map(d => d.trim());
        defectArray.forEach(title => {
            const defRecord = defectsCatalog.find(d => d.titulo === title);
            if (defRecord) {
                totalTime += (defRecord.tiempo || 0);
            }
        });

        if (totalTime <= 0) return entryDate;

        const holidays = Array.isArray(holidaysData) ? (holidaysData as string[]) : [];
        
        // Si el tiempo es p.ej. 0.5 (12h), sumamos 0 días adicionales (mismo día)
        // Si es 1.5, sumamos 1 día adicional.
        let daysToAdd = Math.floor(totalTime);
        let added = 0;

        while (added < daysToAdd) {
            date.setDate(date.getDate() + 1);
            const day = date.getDay(); // 0: Sun, 6: Sat
            const dateStr = date.toISOString().split('T')[0];

            if (day !== 0 && day !== 6 && !holidays.includes(dateStr)) {
                added++;
            }
        }

        // Asegurarnos de que el día resultante sea hábil (p.ej. si cayó en sábado, mover a lunes)
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
            estado: 'En reparacion',
            observaciones: '',
            responsable: '',
            recibido: '',
            tipo_de_reparacion: 'Rapida',
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
            if (editForm.estado === 'Entregado' || editForm.estado === 'ENTREGADO') sapEstado = 'Activo';
            if (editForm.estado === 'Destruido' || editForm.estado === 'DESTRUIDO') sapEstado = 'Baja';

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

            <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    
                    {/* Header & Main Controls */}
                    <div className="bg-white dark:bg-slate-900/50 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl p-8 lg:p-12 relative overflow-visible z-20">
                        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                            <div className="space-y-2">
                                <h1 className="text-4xl font-black tracking-tighter uppercase text-slate-900 dark:text-white">Registro <span className="text-blue-500">moldes</span></h1>
                                <p className="text-slate-500 font-medium">Panel consolidado de reparaciones en curso.</p>
                            </div>
                            
                            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full lg:w-auto mt-6 lg:mt-0">
                                {/* Type Selector */}
                                <div className="flex flex-wrap bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                                    {['Todos', 'Reparación rápida', 'Reparación especial'].map((v) => (
                                        <button
                                            key={v}
                                            onClick={() => setFilterView(v)}
                                            className={`flex-1 min-w-[30%] px-2 py-3 md:px-6 md:py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase transition-all text-center ${filterView === v ? 'bg-white dark:bg-slate-700 text-blue-500 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            {v}
                                        </button>
                                    ))}
                                </div>

                                <button onClick={handleCreateClick} className="w-full md:w-auto px-8 py-4 md:py-3.5 bg-blue-500 text-white rounded-2xl font-black text-[11px] md:text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all">
                                    <Package className="w-5 h-5 md:w-4 md:h-4" /> Nuevo Registro
                                </button>
                            </div>
                        </div>

                        {/* Search Bar - Connecting ONLY to BD_moldes per Requirement 1 */}
                        <div className="mt-8 md:mt-10 relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar molde en reparaciones (BD_moldes)..."
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[2rem] py-5 pl-16 pr-8 text-sm font-medium outline-none"
                                value={searchTerm}
                                onChange={(e) => handleMainSearchChange(e.target.value)}
                                onFocus={() => { if(searchTerm.length >= 2) setShowSuggestions(true) }}
                            />
                            {showSuggestions && searchSuggestions.length > 0 && (
                                <div ref={suggestionsRef} className="absolute top-full left-0 right-0 mt-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] shadow-2xl z-[100] p-4 max-h-[400px] overflow-y-auto animate-in slide-in-from-top-2 duration-200">
                                    <h4 className="px-4 py-2 text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Sugerencias en reparaciones</h4>
                                    {searchSuggestions.map((s, idx) => (
                                        <button 
                                            key={`${s.serial}-${idx}`} 
                                            onClick={() => selectSuggestion(s)}
                                            className="w-full text-left p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl transition-all border-b border-slate-50 dark:border-slate-800 last:border-0 flex flex-col gap-1"
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-black text-slate-900 dark:text-white">{s.serial}</span>
                                                <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-500">{s.estado}</span>
                                            </div>
                                            <span className="text-xs font-bold text-slate-400 uppercase truncate">{s.titulo}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Records Table */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[500px]">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1100px]">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800">
                                        <th className="py-4 px-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[20%]">Código / Título</th>
                                        <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[10%]">Estado</th>
                                        <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-[12%]">Tipo Reparación</th>
                                        <th className="py-4 px-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[38%]">Defectos & Notas</th>
                                        <th className="py-4 px-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[14%]">Cronología</th>
                                        <th className="py-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky right-0 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur z-10 text-center border-l border-slate-100 dark:border-slate-800 shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)] shadow-slate-200/50 dark:shadow-slate-900/50 w-[6%]">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 relative">
                                    {records.map((r, i) => (
                                        <tr key={`${r.id}-${i}`} ref={i === records.length - 1 ? lastElementRef : null} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                                            <td className="py-5 px-5">
                                                <div className="space-y-0.5">
                                                    <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{r.codigo_molde || 'S/C'}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase line-clamp-1">{r.titulo || 'Sin Título'}</div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black border uppercase tracking-wider whitespace-nowrap ${
                                                    (r.estado || '').toLowerCase().includes('reparacion') ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 
                                                    (r.estado || '').toLowerCase().includes('entregado') || (r.estado || '').toLowerCase() === 'activo' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                                                    (r.estado || '').toLowerCase().includes('destruido') || (r.estado || '').toLowerCase() === 'baja' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                                                    'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                                }`}>
                                                    {r.estado || 'Sin Estado'}
                                                </span>
                                            </td>
                                            <td className="py-5 px-4 text-center">
                                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[8px] font-black uppercase text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                                                    {r.tipo_de_reparacion || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="py-5 px-5 whitespace-normal">
                                                <div className="space-y-1 max-w-full">
                                                    <p className="text-xs font-bold text-red-500 leading-tight line-clamp-2 uppercase italic">{r.defectos_a_reparar || '--'}</p>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 italic line-clamp-1 opacity-70 leading-tight">{r.observaciones}</p>
                                                </div>
                                            </td>
                                            <td className="py-5 px-5">
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-600 dark:text-slate-300">
                                                        <Calendar className="w-3 h-3 text-blue-500 opacity-70" />
                                                        {r.fecha_entrada ? r.fecha_entrada : 'S/F'}
                                                    </div>
                                                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Vence: {r.fecha_esperada || '---'}</div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-4 sticky right-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50/50 dark:group-hover:bg-slate-800/80 transition-all border-l border-slate-100 dark:border-slate-800 shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)] shadow-slate-200/50 dark:shadow-slate-900/50 z-10 text-center align-middle">
                                                <button onClick={() => handleEditClick(r)} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-blue-500 hover:text-white transition-all border border-slate-200 dark:border-slate-700 mx-auto flex shrink-0 group/btn shadow-sm">
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
                                                value={masterSearchType === 'codigo' ? masterSearch : (editForm.codigo_molde || '')}
                                                onChange={(e) => handleMasterSearch(e.target.value.toUpperCase(), 'codigo')}
                                            />
                                            {masterMolds.length > 0 && masterSearchType === 'codigo' && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 p-2 max-h-60 overflow-y-auto overflow-x-hidden">
                                                    <h4 className="px-4 py-2 text-[9px] font-black text-blue-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 mb-2">Sugerencias del Histórico</h4>
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
                                        <div className="relative">
                                            <input 
                                                type="text" 
                                                className="w-full bg-slate-50 dark:bg-slate-951 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all" 
                                                value={editForm.titulo || ''} 
                                                readOnly={!isCreateMode && !((editForm.defectos_a_reparar || '').toLowerCase().includes('nuevo'))}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (isCreateMode) {
                                                        handleMasterSearch(val, 'titulo');
                                                    } else {
                                                        setEditForm({...editForm, titulo: val});
                                                    }
                                                }} 
                                            />
                                            {masterMolds.length > 0 && masterSearchType === 'titulo' && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 p-2 max-h-60 overflow-y-auto overflow-x-hidden">
                                                    <h4 className="px-4 py-2 text-[9px] font-black text-blue-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 mb-2">Sugerencias del Histórico</h4>
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
                                            onChange={(e) => {
                                                const newStatus = e.target.value;
                                                const updates: any = { estado: newStatus };
                                                if (newStatus === 'Entregado' && !editForm.fecha_entrega) {
                                                    updates.fecha_entrega = new Date().toISOString().split('T')[0];
                                                }
                                                setEditForm({...editForm, ...updates});
                                            }}
                                        >
                                            <option value="">Seleccione Estado</option>
                                            <option value="En reparacion">En Reparación</option>
                                            <option value="En espera - Produccion">En Espera - Producción</option>
                                            <option value="En espera - Moldes">En Espera - Moldes</option>
                                            <option value="Entregado">Entregado</option>
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
                                        <option value="">Seleccione Tipo</option>
                                        <option value="Rapida">Reparación Rápida</option>
                                        <option value="Especial">Reparación Especial</option>
                                        <option value="Desmanchado">Desmanchado</option>
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
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Fecha de Entrega (Real)</label>
                                        <input 
                                            type="date" 
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-sm font-bold outline-none uppercase" 
                                            value={editForm.fecha_entrega || ''}
                                            onChange={(e) => setEditForm({...editForm, fecha_entrega: e.target.value})}
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
