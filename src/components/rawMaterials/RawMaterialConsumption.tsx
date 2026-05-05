
'use client'

import { useState, useEffect } from 'react'
import { moldsService } from '@/services/molds.service'
import { 
    Package, 
    Search, 
    Loader2, 
    Save, 
    AlertCircle, 
    CheckCircle2, 
    Factory, 
    Hash, 
    Ruler, 
    Calculator, 
    ArrowLeftRight, 
    FileText, 
    MessageSquare,
    ChevronDown,
    Calendar,
    User
} from 'lucide-react'

export default function RawMaterialConsumption() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Catalogs
    const [rawMaterials, setRawMaterials] = useState<any[]>([])
    const [user, setUser] = useState<any>(null)

    // Form state matching instructions EXACTLY
    const [formData, setFormData] = useState({
        id: '', // internal selector id
        titulo: '',
        codigo_mp: '',
        cantidad: '',
        unds: '',
        tipo: '',
        mp_molde: '--',
        mp_molde_codigo: '--',
        concepto: '',
        observaciones: '',
        relacion_molde: '', // Code
        relacion_molde_nombre: '' // Name
    })

    const [moldsSearchResults, setMoldsSearchResults] = useState<any[]>([])
    const [moldSearchTerm, setMoldSearchTerm] = useState('')
    const [showMoldResults, setShowMoldResults] = useState(false)
    const [isSearchingMolds, setIsSearchingMolds] = useState(false)

    // Material Search
    const [materialSearchTerm, setMaterialSearchTerm] = useState('')
    const [showMaterialResults, setShowMaterialResults] = useState(false)
    const [filteredMaterials, setFilteredMaterials] = useState<any[]>([])

    useEffect(() => {
        const storedUser = localStorage.getItem('moldapp_user')
        if (storedUser) setUser(JSON.parse(storedUser))

        const loadData = async () => {
            try {
                const materials = await moldsService.getRawMaterials()
                setRawMaterials(materials || [])
                setFilteredMaterials(materials || [])
            } catch (error) {
                console.error('Error loading materials:', error)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    const handleMaterialSearch = (val: string) => {
        setMaterialSearchTerm(val)
        if (!val.trim()) {
            setFilteredMaterials(rawMaterials)
            setShowMaterialResults(false)
            return
        }
        
        const term = val.toLowerCase()
        const filtered = rawMaterials.filter(m => 
            (m.titulo || '').toLowerCase().includes(term) ||
            (m.raw?.['CODIGO MP'] || '').toLowerCase().includes(term)
        )
        setFilteredMaterials(filtered)
        setShowMaterialResults(true)
    }

    const selectMaterial = (mat: any) => {
        // Autocomplete based on instructores (Título, CODIGO MP, UNDS, etc)
        // m.raw contains the original Supabase record
        const r = mat.raw;
        setFormData(prev => ({
            ...prev,
            id: mat.id,
            titulo: r.Título || r['Materia Prima'] || 'Sin Título',
            codigo_mp: r['CODIGO MP'] || r['Número de artículo SAP'] || 'S/C',
            unds: r.UNDS || r['Unidad de medida de compras'] || 'UN',
            mp_molde: r['MP MOLDE'] || '--',
            mp_molde_codigo: r['MP MOLDE CODIGO'] || '--'
        }))
        setMaterialSearchTerm(r.Título || r['Materia Prima'] || 'Sin Título')
        setShowMaterialResults(false)
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        
        // Final Validations
        if (!formData.id) {
            setMessage({ type: 'error', text: 'Debe seleccionar un material.' });
            return;
        }
        if (!formData.cantidad || parseFloat(formData.cantidad) === 0) {
            setMessage({ type: 'error', text: 'La cantidad debe ser válida y positiva.' });
            return;
        }
        if (!formData.tipo) {
            setMessage({ type: 'error', text: 'Debe seleccionar un tipo de movimiento.' });
            return;
        }

        setSaving(true)
        setMessage(null)

        try {
            const now = new Date().toISOString()
            const usuarioStr = user?.Nombre || user?.NombreCompleto || 'Desconocido'

            // prepare record for public."Entradas_salidas_MP" (Existing table)
            const oldTableRecord = {
                'Título': formData.titulo,
                'CODIGO MP': formData.codigo_mp,
                'CANTIDAD': formData.cantidad,
                'UNDS': formData.unds,
                'TIPO': formData.tipo,
                'MP MOLDE': formData.mp_molde,
                'MP MOLDE CODIGO': formData.mp_molde_codigo,
                'CONCEPTO': formData.concepto,
                'OBSERVACIONES': formData.observaciones,
                'Created': now,
                'Usuario': usuarioStr,
                'SAP': 'Pendiente',
                'Modified': now,
                'Modified By': usuarioStr,
                'MOLDE RELACIONADO': formData.relacion_molde
            }

            // prepare record for public."historico_BD_entradas _salidas_MP" (REQUIRED NEW TABLE)
            const historicoRecord = {
                materia_prima: formData.titulo,
                codigo_materia_prima: formData.codigo_mp,
                uab: formData.unds,
                unidades: parseFloat(formData.cantidad),
                tipo_movimiento: formData.tipo,
                concepto: formData.concepto,
                molde: formData.relacion_molde_nombre,
                codigo_molde: formData.relacion_molde,
                responsable: usuarioStr,
                fecha_movimiento: now,
                observaciones: formData.observaciones,
                mp_molde: formData.mp_molde,
                mp_molde_codigo: formData.mp_molde_codigo
            }

            // Save to both
            await Promise.all([
                moldsService.saveRawMaterialMovement(oldTableRecord),
                moldsService.saveHistoricoMP(historicoRecord)
            ])

            setMessage({ type: 'success', text: 'Movimiento registrado correctamente en historial y base de datos.' })
            
            // Clear form
            setFormData({
                id: '',
                titulo: '',
                codigo_mp: '',
                cantidad: '',
                unds: '',
                tipo: '',
                mp_molde: '--',
                mp_molde_codigo: '--',
                concepto: '',
                observaciones: '',
                relacion_molde: '',
                relacion_molde_nombre: ''
            })
            setMoldSearchTerm('')
            setMaterialSearchTerm('')
        } catch (error: any) {
            console.error(error)
            setMessage({ type: 'error', text: 'Fallo técnica: ' + (error.message || 'Error desconocido') })
        } finally {
            setSaving(false)
        }
    }

    const handleMoldSearch = async (val: string) => {
        setMoldSearchTerm(val)
        if (val.length < 2) {
            setMoldsSearchResults([])
            setShowMoldResults(false)
            return
        }
        setIsSearchingMolds(true)
        setShowMoldResults(true)
        try {
            const results = await moldsService.searchMoldsMaster(val)
            setMoldsSearchResults(results || [])
        } catch (e) {
            console.error(e)
        } finally {
            setIsSearchingMolds(false)
        }
    }

    const selectMold = (m: any) => {
        setFormData(prev => ({ 
            ...prev, 
            relacion_molde: m.serial,
            relacion_molde_nombre: m.nombre_articulo 
        }))
        setMoldSearchTerm(`${m.serial} - ${m.nombre_articulo}`)
        setShowMoldResults(false)
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-6">
                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Consultando Materia_prima_moldes...</p>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-700 py-6">
            {/* Module Title */}
            <div className="flex flex-col md:flex-row items-center gap-8 mb-4">
                <div className="w-24 h-24 bg-emerald-500/10 rounded-[2.8rem] flex items-center justify-center border-2 border-emerald-500/20 shadow-2xl shadow-emerald-500/10">
                    <Factory className="w-12 h-12 text-emerald-500" />
                </div>
                <div className="text-center md:text-left">
                    <h1 className="text-5xl font-black tracking-tight text-slate-900 dark:text-white uppercase leading-none mb-3">
                        Materia <span className="text-emerald-500">Prima</span>
                    </h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
                        <span className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full"><Search className="w-3 h-3"/> Origen: Materia_prima_moldes</span>
                        <span className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full"><Loader2 className="w-3 h-3"/> Destino: Entradas_salidas_MP</span>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSave} className="bg-white dark:bg-slate-901 rounded-[4rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden backdrop-blur-3xl relative">
                <div className="p-12 lg:p-20 space-y-16">
                    
                    {/* SECTION 1: Material Selection */}
                    <div className="space-y-10">
                        <div className="flex items-center gap-4">
                            <div className="h-0.5 w-12 bg-emerald-500 rounded-full"></div>
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Selección de Insumo</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">
                                    <Package className="w-4 h-4 text-emerald-500" /> Material Base
                                </label>
                                <div className="relative">
                                    <input
                                        required
                                        type="text"
                                        autoComplete="off"
                                        placeholder="BUSCAR EN MATERIA_PRIMA_MOLDES..."
                                        className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-3xl py-6 px-10 font-black text-xs text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all uppercase relative z-10"
                                        value={materialSearchTerm}
                                        onChange={(e) => handleMaterialSearch(e.target.value)}
                                        onFocus={() => setShowMaterialResults(true)}
                                    />
                                    <Search className="absolute right-10 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-20 pointer-events-none" />
                                    
                                    {showMaterialResults && filteredMaterials.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-50 p-4 max-h-60 overflow-y-auto overflow-x-hidden">
                                            {filteredMaterials.map(m => (
                                                <button
                                                    key={m.id}
                                                    type="button"
                                                    onClick={() => selectMaterial(m)}
                                                    className="w-full text-left p-4 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-2xl transition-all border-b border-slate-50 dark:border-slate-800/50 last:border-0"
                                                >
                                                    <div className="text-xs font-black text-slate-900 dark:text-white uppercase">{m.titulo}</div>
                                                    <div className="text-[10px] font-bold text-slate-500 uppercase truncate">
                                                        Código: {m.raw?.['CODIGO MP'] || m.raw?.['Número de artículo SAP'] || 'S/C'}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4 opacity-70">
                                <label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">
                                    <Hash className="w-4 h-4 text-emerald-500" /> Código MP
                                </label>
                                <input
                                    readOnly
                                    type="text"
                                    className="w-full bg-slate-100 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl py-6 px-10 font-mono text-xs font-black text-slate-500 dark:text-slate-400 outline-none"
                                    value={formData.codigo_mp}
                                    placeholder="Auto-completado..."
                                />
                            </div>
                        </div>

                        {/* AUTO-FILLED TECH DATA */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-10 bg-slate-50/50 dark:bg-slate-950/40 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
                           <div className="space-y-2">
                               <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Unidad Origen (UNDS)</p>
                               <div className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase">{formData.unds || '---'}</div>
                           </div>
                        </div>
                    </div>

                    {/* SECTION 2: Movement Details */}
                    <div className="space-y-10">
                        <div className="flex items-center gap-4">
                            <div className="h-0.5 w-12 bg-emerald-500 rounded-full"></div>
                            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Cuantificación & Registro</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                            <div className="space-y-4">
                                <label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">
                                    <Calculator className="w-4 h-4 text-emerald-500" /> Cantidad <span className="text-red-500 text-lg">*</span>
                                </label>
                                <input
                                    required
                                    type="number"
                                    step="any"
                                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-3xl py-6 px-10 font-black text-xs text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono"
                                    placeholder="0.00"
                                    value={formData.cantidad}
                                    onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">
                                    <ArrowLeftRight className="w-4 h-4 text-emerald-500" /> Tipo Movimiento
                                </label>
                                <div className="relative">
                                    <select
                                        required
                                        className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-3xl py-6 px-10 font-black text-xs text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 appearance-none transition-all cursor-pointer"
                                        value={formData.tipo}
                                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                    >
                                        <option value="" disabled hidden>SELECCIONAR TIPO...</option>
                                        <option value="Entrada">Entrada</option>
                                        <option value="Salida">Salida</option>
                                    </select>
                                    <ChevronDown className="absolute right-10 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">
                                    <Package className="w-4 h-4 text-blue-500" /> Relación con Molde
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Buscar por código o nombre..."
                                        className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-3xl py-6 px-10 font-black text-xs text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all uppercase"
                                        value={moldSearchTerm}
                                        onChange={(e) => handleMoldSearch(e.target.value)}
                                        onFocus={() => { if(moldSearchTerm.length >= 2) setShowMoldResults(true) }}
                                    />
                                    <Search className="absolute right-10 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    
                                    {showMoldResults && (moldsSearchResults.length > 0 || isSearchingMolds) && (
                                        <div className="absolute top-full left-0 right-0 mt-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl z-50 p-4 max-h-60 overflow-y-auto">
                                            {isSearchingMolds ? (
                                                <div className="flex items-center justify-center py-4">
                                                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                                                </div>
                                            ) : (
                                                moldsSearchResults.map(m => (
                                                    <button
                                                        key={m.id}
                                                        type="button"
                                                        onClick={() => selectMold(m)}
                                                        className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all border-b border-slate-50 dark:border-slate-800 last:border-0"
                                                    >
                                                        <div className="text-xs font-black text-slate-900 dark:text-white uppercase">{m.serial}</div>
                                                        <div className="text-[10px] font-bold text-slate-500 uppercase truncate">{m.nombre_articulo}</div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">
                                    <FileText className="w-4 h-4 text-emerald-500" /> Concepto
                                </label>
                                <div className="relative">
                                    <select
                                        required
                                        className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-3xl py-6 px-10 font-black text-xs text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 appearance-none transition-all cursor-pointer"
                                        value={formData.concepto}
                                        onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                                    >
                                        <option value="" disabled hidden>SELECCIONAR CONCEPTO...</option>
                                        <option value="Fabricación Molde">Fabricación Molde</option>
                                        <option value="Reparación Especial">Reparación Especial</option>
                                        <option value="Reparación rápida">Reparación rápida</option>
                                    </select>
                                    <ChevronDown className="absolute right-10 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">
                                <MessageSquare className="w-4 h-4 text-emerald-500" /> Observaciones Técnicas
                            </label>
                            <textarea
                                className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-[3rem] py-10 px-12 font-bold text-sm text-slate-900 dark:text-white outline-none focus:ring-4 focus:ring-emerald-500/10 resize-none h-56 transition-all"
                                placeholder="..."
                                value={formData.observaciones}
                                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                            />
                        </div>


                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-12 lg:p-20 bg-slate-50 dark:bg-slate-950/20 border-t-2 border-slate-200 dark:border-slate-800 flex flex-col items-center">
                    {message && (
                        <div className={`w-full max-w-2xl mb-12 p-8 rounded-[2.5rem] flex items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-4 border-2 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'}`}>
                            {message.type === 'success' ? <CheckCircle2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                            <span className="font-black uppercase tracking-[0.2em] text-xs">{message.text}</span>
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row items-center gap-8 w-full max-w-4xl">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-black py-8 rounded-[2.8rem] transition-all shadow-2xl shadow-emerald-500/30 flex items-center justify-center gap-6 uppercase tracking-[0.3em] text-[11px] active:scale-[0.98]"
                        >
                            {saving ? <Loader2 className="w-8 h-8 animate-spin" /> : <><Save className="w-8 h-8" /> Confirmar y registrar movimiento</>}
                        </button>
                    </div>
                    
                    <div className="mt-12 flex flex-col md:flex-row items-center gap-10 text-slate-400">
                        <div className="flex items-center gap-3">
                            <User className="w-4 h-4 text-emerald-500/50" />
                            <span className="text-[9px] font-black uppercase tracking-widest">{user?.Nombre || 'Sessión Activa'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-emerald-500/50" />
                            <span className="text-[9px] font-black uppercase tracking-widest">{new Date().toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
