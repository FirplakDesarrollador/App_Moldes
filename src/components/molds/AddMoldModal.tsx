'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Loader2, Save, Calendar, User, Tag, Clock, Package, Search, Plus } from 'lucide-react'
import { moldsService, Mold } from '@/services/molds.service'

interface AddMoldModalProps {
    onClose: () => void
    onSuccess: () => void
    moldToEdit?: Mold
}

const isBusinessDay = (d: Date) => {
    // Para simplificar, usamos solo la fecha
    const hYYMMDD = d.toISOString().split('T')[0];
    const day = d.getDay();
    const holidays = [
        "2024-01-01", "2024-01-08", "2024-03-25", "2024-03-28", "2024-03-29",
        "2024-05-01", "2024-05-13", "2024-06-03", "2024-06-10", "2024-07-01",
        "2024-07-20", "2024-08-07", "2024-08-19", "2024-10-14", "2024-11-04",
        "2024-11-11", "2024-12-08", "2024-12-25",
        "2025-01-01", "2025-01-06", "2025-03-24", "2025-04-17", "2025-04-18",
        "2025-05-01", "2025-06-02", "2025-06-23", "2025-06-30", "2025-07-20",
        "2025-08-07", "2025-08-18", "2025-10-13", "2025-11-03", "2025-11-17",
        "2025-12-08", "2025-12-25",
        "2026-01-01", "2026-01-12", "2026-03-23", "2026-04-02", "2026-04-03",
        "2026-05-01", "2026-05-18", "2026-06-08", "2026-06-15", "2026-06-29",
        "2026-07-20", "2026-08-07", "2026-08-17", "2026-10-12", "2026-11-02",
        "2026-11-16", "2026-12-08", "2026-12-25"
    ];
    // 0 = domingo, 6 = sabado
    return day !== 0 && day !== 6 && !holidays.includes(hYYMMDD);
};

const calculateExpectedDate = (totalDays: number, startDateStr: string) => {
    if (totalDays === 0) return startDateStr; // Mismo día si no hay defectos
    
    // Tratar de evitar UTC shifts usando hora local
    const parts = startDateStr.split('-');
    let current = new Date(parseInt(parts[0]), parseInt(parts[1])-1, parseInt(parts[2]), 12, 0, 0);
    
    if (totalDays > 0 && totalDays <= 0.5) {
        while (!isBusinessDay(current)) {
            current.setDate(current.getDate() + 1);
        }
        return current.toISOString().split('T')[0];
    }
    
    let added = 0;
    let daysToWait = Math.floor(totalDays);
    
    while (added < daysToWait) {
        current.setDate(current.getDate() + 1);
        if (isBusinessDay(current)) {
            added++;
        }
    }
    
    while (!isBusinessDay(current)) {
        current.setDate(current.getDate() + 1);
    }
    
    return current.toISOString().split('T')[0];
}

export default function AddMoldModal({ onClose, onSuccess, moldToEdit }: AddMoldModalProps) {
    const isEditing = !!moldToEdit
    const [loading, setLoading] = useState(false)
    const [personnel, setPersonnel] = useState<any[]>([])
    const [defectsCatalog, setDefectsCatalog] = useState<any[]>([])
    
    // AutoComplete state para Moldes
    const [moldSearch, setMoldSearch] = useState('')
    const [moldResults, setMoldResults] = useState<Mold[]>([])
    const [showMoldDropdown, setShowMoldDropdown] = useState(false)
    const [showSerialDropdown, setShowSerialDropdown] = useState(false)
    const moldInputRef = useRef<HTMLInputElement>(null)
    const serialInputRef = useRef<HTMLInputElement>(null)

    // AutoComplete state para Defectos
    const [defectSearch, setDefectSearch] = useState('')
    const [showDefectDropdown, setShowDefectDropdown] = useState(false)
    const [selectedDefects, setSelectedDefects] = useState<string[]>([])
    const defectInputRef = useRef<HTMLInputElement>(null)

    const [formData, setFormData] = useState<Partial<Mold>>({
        nombre_articulo: '',
        serial: '',
        estado: 'Disponible',
        Estado_reparacion: 'En espera-moldes',
        Responsable: '',
        Tipo_de_reparacion: 'Rapida',
        Fecha_de_ingreso: new Date().toISOString().split('T')[0],
        Fecha_esperada: '',
        Fecha_de_entrega: '',
        Observaciones_reparacion: '',
        modificado_por: '',
        modified_at: ''
    })

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [p, d] = await Promise.all([
                    moldsService.getPersonnel(),
                    moldsService.getDefectsCatalog()
                ])
                setPersonnel(p || [])
                setDefectsCatalog(d || [])
            } catch (err) {
                console.error('Error loading modal data:', err)
            }
        }
        loadInitialData()
    }, [])

    useEffect(() => {
        if (moldToEdit) {
            setFormData({
                ...moldToEdit,
                Fecha_de_ingreso: moldToEdit.Fecha_de_ingreso ? moldToEdit.Fecha_de_ingreso.split('T')[0] : '',
                Fecha_esperada: moldToEdit.Fecha_esperada ? moldToEdit.Fecha_esperada.split('T')[0] : '',
                Fecha_de_entrega: moldToEdit.Fecha_de_entrega ? moldToEdit.Fecha_de_entrega.split('T')[0] : '',
            })
            if (moldToEdit.Observaciones_reparacion) {
                const existingDefects = moldToEdit.Observaciones_reparacion.split(', ').filter(Boolean)
                setSelectedDefects(existingDefects)
            }
        }
    }, [moldToEdit])

    // Lógica para Autocomplete de Moldes
    useEffect(() => {
        if (!moldSearch.trim()) {
            setMoldResults([])
            return
        }
        const delayDebounce = setTimeout(async () => {
            const results = await moldsService.searchMolds(moldSearch)
            setMoldResults(results)
        }, 300)
        return () => clearTimeout(delayDebounce)
    }, [moldSearch])

    // Recalcular Fecha Esperada cada vez que cambian los defectos o la fecha de ingreso
    useEffect(() => {
        if (!formData.Fecha_de_ingreso) return;
        
        // Si hay una fecha real de entrega modificada manualmente, no sobreescribir la esperada a menos que sea un nuevo registro?
        // El prompt dice "Fecha esperada: Debe ser editable manualmente". Computaremos el valor inicial pero permitiremos que se cambie.
        // Haremos el auto-calculo si es nuevo. Si es edición, dejamos la que está a menos que cambie los defectos.
        
        let totalTime = 0
        selectedDefects.forEach(d => {
            const catItem = defectsCatalog.find(c => c.Título === d);
            if (catItem && catItem.Tiempo) {
                totalTime += parseFloat(catItem.Tiempo);
            }
        })
        
        let expected = calculateExpectedDate(totalTime, formData.Fecha_de_ingreso);
        
        // Asignamos la fecha esperada sugerida y bloqueada
        setFormData(prev => ({ 
            ...prev, 
            Fecha_esperada: expected
            // No autocompleta Fecha_de_entrega para dejar que se diligencie después
        }))
    }, [selectedDefects, defectsCatalog, formData.Fecha_de_ingreso])
    
    // Reflejar string array a comma separated para backend
    useEffect(() => {
        setFormData(prev => ({ ...prev, Observaciones_reparacion: selectedDefects.join(', ') }))
    }, [selectedDefects])

    const handleSelectMold = (mold: Mold) => {
        setFormData(prev => ({
            ...prev,
            nombre_articulo: mold.nombre_articulo,
            serial: mold.serial,
            estado: mold.estado || prev.estado
        }))
        setMoldSearch('')
        setShowMoldDropdown(false)
        setShowSerialDropdown(false)
    }

    const unselectedDefects = defectsCatalog.filter(d => 
        !selectedDefects.includes(d.Título) && 
        d.Título.toLowerCase().includes(defectSearch.toLowerCase())
    ).slice(0, 10)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const userStr = localStorage.getItem('moldapp_user')
            const currentUser = userStr ? JSON.parse(userStr).Nombre : 'Sistema'
            
            const dbRecord: Mold = {
                ...(formData as Mold),
                modified_at: new Date().toISOString(),
                modificado_por: currentUser
            }

            if (!isEditing) {
                dbRecord.created_at = new Date().toISOString()
            }

            await moldsService.saveMold(dbRecord)
            onSuccess()
            onClose()
        } catch (error) {
            console.error('Error saving mold:', error)
            alert('No se pudo guardar el registro. Verifique la conexión.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-[#0f1115] w-full max-w-4xl rounded-[4rem] shadow-2xl relative overflow-hidden border border-white/10" onClick={() => {setShowMoldDropdown(false); setShowSerialDropdown(false); setShowDefectDropdown(false);}}>
                <div className="p-10 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-blue-600 rounded-[1.5rem] shadow-2xl shadow-blue-600/30">
                            <Package className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                {isEditing ? 'Gestión de Molde' : 'Ingreso de Molde'}
                            </h2>
                            <p className="text-[11px] font-black text-blue-500 uppercase tracking-[0.4em] mt-1">Industrial Control System</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-4 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all group">
                        <X className="w-8 h-8 text-gray-400 group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-10 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4 relative" onClick={e => e.stopPropagation()}>
                            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Tag className="w-3 h-3 text-blue-500" /> Nombre del Molde / Artículo
                            </label>
                            <div className="relative">
                                {!isEditing && <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />}
                                <input
                                    required
                                    ref={moldInputRef}
                                    value={showMoldDropdown ? moldSearch : formData.nombre_articulo}
                                    onChange={e => {
                                        if (isEditing) {
                                            setFormData({ ...formData, nombre_articulo: e.target.value })
                                        } else {
                                            setMoldSearch(e.target.value)
                                            setShowMoldDropdown(true)
                                            setFormData({ ...formData, nombre_articulo: e.target.value })
                                        }
                                    }}
                                    onFocus={() => { if (!isEditing) { setShowMoldDropdown(true); setShowSerialDropdown(false); } }}
                                    className={`w-full bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-2xl py-5 pr-8 font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-400 ${!isEditing ? 'pl-14' : 'px-8'}`}
                                    placeholder={!isEditing ? "Escriba para buscar molde..." : "Nombre del molde"}
                                />
                                {showMoldDropdown && moldResults.length > 0 && !isEditing && (
                                    <div className="absolute top-100 left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-black/10 dark:border-white/10 rounded-2xl shadow-xl z-[60] overflow-hidden max-h-60 overflow-y-auto">
                                        {moldResults.map(m => (
                                            <button
                                                key={m.id || m.serial}
                                                type="button"
                                                onClick={() => handleSelectMold(m)}
                                                className="w-full text-left px-6 py-4 hover:bg-black/5 dark:hover:bg-white/5 border-b border-black/5 dark:border-white/5 last:border-0"
                                            >
                                                <div className="font-bold text-slate-900 dark:text-white">{m.nombre_articulo}</div>
                                                <div className="text-xs text-slate-500">Serial: {m.serial} • Estado: {m.estado}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-4 relative" onClick={e => e.stopPropagation()}>
                            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Tag className="w-3 h-3 text-blue-500" /> Serial / Código Único
                            </label>
                            <div className="relative">
                                {!isEditing && <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />}
                                <input
                                    required
                                    ref={serialInputRef}
                                    value={showSerialDropdown ? moldSearch : formData.serial}
                                    onChange={e => {
                                        if (isEditing) {
                                            setFormData({ ...formData, serial: e.target.value })
                                        } else {
                                            setMoldSearch(e.target.value)
                                            setShowSerialDropdown(true)
                                            setShowMoldDropdown(false)
                                            setFormData({ ...formData, serial: e.target.value })
                                        }
                                    }}
                                    onFocus={() => { if (!isEditing) { setShowSerialDropdown(true); setShowMoldDropdown(false); } }}
                                    className={`w-full bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-2xl py-5 pr-8 font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/20 outline-none transition-all uppercase placeholder:text-gray-400 ${!isEditing ? 'pl-14' : 'px-8'}`}
                                    placeholder={!isEditing ? "Escriba para buscar serial..." : "Ej: ML-001"}
                                />
                                {showSerialDropdown && moldResults.length > 0 && !isEditing && (
                                    <div className="absolute top-100 left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-black/10 dark:border-white/10 rounded-2xl shadow-xl z-[60] overflow-hidden max-h-60 overflow-y-auto">
                                        {moldResults.map(m => (
                                            <button
                                                key={`serial-${m.id || m.serial}`}
                                                type="button"
                                                onClick={() => handleSelectMold(m)}
                                                className="w-full text-left px-6 py-4 hover:bg-black/5 dark:hover:bg-white/5 border-b border-black/5 dark:border-white/5 last:border-0"
                                            >
                                                <div className="font-bold text-slate-900 dark:text-white">{m.serial}</div>
                                                <div className="text-xs text-slate-500">Molde: {m.nombre_articulo} • Estado: {m.estado}</div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Estado Operativo</label>
                            <select
                                value={formData.estado}
                                onChange={e => setFormData({ ...formData, estado: e.target.value })}
                                className="w-full bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-2xl py-5 px-8 font-bold text-slate-900 dark:text-white outline-none appearance-none"
                            >
                                <option value="Disponible">Disponible</option>
                                <option value="En uso">En uso</option>
                                <option value="En reparacion">En reparación</option>
                                <option value="En fabricacion">En fabricación</option>
                                <option value="Destruido">Destruido</option>
                                <option value="Indefinido">Indefinido</option>
                            </select>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Estado Reparación</label>
                            <select
                                value={formData.Estado_reparacion}
                                onChange={e => setFormData({ ...formData, Estado_reparacion: e.target.value })}
                                className="w-full bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-2xl py-5 px-8 font-bold text-slate-900 dark:text-white outline-none appearance-none"
                            >
                                <option value="En espera-moldes">En espera - Moldes</option>
                                <option value="En espera-produccion">En espera - Producción</option>
                                <option value="En reparacion">En reparación</option>
                                <option value="Entregado">Entregado</option>
                                <option value="Destruido">Destruido</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6 border-t border-black/5 dark:border-white/5">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <User className="w-3 h-3 text-blue-500" /> Responsable Asignado
                            </label>
                            <select
                                value={formData.Responsable}
                                onChange={e => setFormData({ ...formData, Responsable: e.target.value })}
                                className="w-full bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-2xl py-5 px-8 font-bold text-slate-900 dark:text-white outline-none appearance-none"
                            >
                                <option value="">No Asignado</option>
                                {personnel.map((p, i) => (
                                    <option key={`p-${i}`} value={p.NombreCompleto}>{p.NombreCompleto}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Tipo de Reparación</label>
                            <div className="flex gap-4">
                                {(['Rapida', 'Especial'] as const).map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, Tipo_de_reparacion: type })}
                                        className={`flex-1 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${formData.Tipo_de_reparacion === type ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' : 'bg-black/5 dark:bg-white/5 text-gray-500 hover:text-gray-300'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Fecha de Entrada</label>
                            <div className="relative">
                                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                                <input
                                    type="date"
                                    value={formData.Fecha_de_ingreso}
                                    onChange={e => setFormData({ ...formData, Fecha_de_ingreso: e.target.value })}
                                    className="w-full bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-2xl py-5 pl-14 pr-6 font-bold text-slate-900 dark:text-white outline-none"
                                />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Fecha Esperada</label>
                                <input
                                    disabled
                                    type="date"
                                    value={formData.Fecha_esperada}
                                    className="w-full bg-black/5 dark:bg-white/[0.01] border border-black/5 dark:border-white/5 rounded-2xl py-5 px-8 font-bold text-gray-400 cursor-not-allowed uppercase"
                                />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Fecha Real Entrega</label>
                            <input
                                type="date"
                                value={formData.Fecha_de_entrega}
                                onChange={e => setFormData({ ...formData, Fecha_de_entrega: e.target.value })}
                                className="w-full bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-2xl py-5 px-8 font-bold text-slate-900 dark:text-white outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-6 pt-4 relative" onClick={e => e.stopPropagation()}>
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Defectos a Intervenir</label>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                            {selectedDefects.map(d => (
                                <span key={d} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full text-xs font-bold">
                                    {d}
                                    <button
                                        type="button"
                                        onClick={() => setSelectedDefects(selectedDefects.filter(x => x !== d))}
                                        className="hover:bg-blue-500/20 rounded-full p-0.5"
                                    >
                                        <option value="">No Asignado</option>
                                        {personnel.map((p, idx) => (
                                            <option key={p.Cedula || p.NombreCompleto || idx} value={p.NombreCompleto}>{p.NombreCompleto}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Tipo de Reparación</label>
                                    <div className="flex gap-4">
                                        {(['Rapida', 'Especial'] as const).map(type => (
                                            <button
                                                key={d.Título}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedDefects([...selectedDefects, d.Título])
                                                    setDefectSearch('')
                                                    defectInputRef.current?.focus()
                                                }}
                                                className="w-full text-left px-6 py-4 hover:bg-black/5 dark:hover:bg-white/5 border-b border-black/5 dark:border-white/5 last:border-0 font-bold text-slate-900 dark:text-white flex items-center gap-3"
                                            >
                                                <Plus className="w-4 h-4 text-blue-500" /> {d.Título}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Fecha de Entrada</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                                        <input
                                            type="date"
                                            value={formData.Fecha_de_ingreso}
                                            onChange={e => setFormData({ ...formData, Fecha_de_ingreso: e.target.value })}
                                            className="w-full bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-2xl py-5 pl-14 pr-6 font-bold text-slate-900 dark:text-white outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4 opacity-70">
                                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Fecha Esperada</label>
                                    <input
                                        disabled
                                        type="date"
                                        value={formData.Fecha_esperada}
                                        className="w-full bg-black/5 dark:bg-white/[0.01] border border-black/5 dark:border-white/5 rounded-2xl py-5 px-8 font-bold text-gray-500 cursor-not-allowed"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Fecha Real Entrega</label>
                                    <input
                                        type="date"
                                        value={formData.Fecha_de_entrega}
                                        onChange={e => setFormData({ ...formData, Fecha_de_entrega: e.target.value })}
                                        className="w-full bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-2xl py-5 px-8 font-bold text-slate-900 dark:text-white outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-6 pt-4">
                                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Defectos a Intervenir</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {defectsCatalog.map((d, idx) => (
                                        <button
                                            key={d.id || d.Título || idx}
                                            type="button"
                                            onClick={() => {
                                                const current = selectedDefects.includes(d.Título)
                                                    ? selectedDefects.filter(x => x !== d.Título)
                                                    : [...selectedDefects, d.Título]
                                                setSelectedDefects(current)
                                                setFormData({ ...formData, Observaciones_reparacion: current.join(', ') })
                                            }}
                                            className={`p-4 rounded-2xl border-2 text-[10px] font-black text-left transition-all ${selectedDefects.includes(d.Título) ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/30' : 'bg-black/5 dark:bg-white/5 border-transparent text-gray-500'}`}
                                        >
                                            {d.Título}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6 pt-10 border-t border-black/5 dark:border-white/5">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                             Observaciones Técnicas / Detalles de la Reparación
                        </label>
                        <textarea
                            value={formData.Observaciones_reparacion}
                            onChange={e => setFormData({ ...formData, Observaciones_reparacion: e.target.value })}
                            className="w-full bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-[3rem] py-8 px-10 font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/20 outline-none transition-all h-60 resize-none placeholder:text-gray-700"
                            placeholder="Describa el estado actual, piezas requeridas y trabajos realizados..."
                        />
                    </div>

                    {isEditing && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 bg-blue-500/[0.02] rounded-[3rem] p-10 border border-blue-500/10 dark:border-white/5">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <User className="w-3 h-3" /> Última Modificación Realizada Por
                                </label>
                                <div className="w-full bg-white dark:bg-white/[0.05] border border-blue-500/10 dark:border-white/10 rounded-2xl py-5 px-8 font-black text-slate-600 dark:text-gray-300 text-xs uppercase shadow-sm">
                                    {formData.modificado_por || 'Sistema de Control'}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Clock className="w-3 h-3" /> Fecha y Hora del Último Ajuste
                                </label>
                                <div className="w-full bg-white dark:bg-white/[0.05] border border-blue-500/10 dark:border-white/10 rounded-2xl py-5 px-8 font-black text-slate-600 dark:text-gray-300 text-xs uppercase shadow-sm">
                                    {formData.modified_at ? new Date(formData.modified_at).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' }) : 'No Registrada'}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="pt-10 flex gap-8">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-10 py-8 rounded-[2.5rem] font-black uppercase text-[10px] tracking-widest text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black py-8 rounded-[3rem] transition-all flex items-center justify-center gap-6 shadow-[0_20px_80px_rgba(37,99,235,0.4)] active:scale-[0.98] uppercase tracking-[0.5em] text-xs"
                        >
                            {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <><Save className="w-7 h-7" /> {isEditing ? 'Guardar Cambios' : 'Confirmar Registro'}</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
