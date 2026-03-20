// PV_MOLDES V2.4
'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { X, Loader2, Save, Calendar, User, Tag, Clock, Package, Search, Plus } from 'lucide-react'
import { moldsService, Mold } from '@/services/molds.service'

interface AddMoldModalProps {
    onClose: () => void
    onSuccess: () => void
    moldToEdit?: Mold
}

export default function AddMoldModal({ onClose, onSuccess, moldToEdit }: AddMoldModalProps) {
    const isEditing = !!moldToEdit
    const [loading, setLoading] = useState(false)
    const [personnel, setPersonnel] = useState<any[]>([])
    const [defectsCatalog, setDefectsCatalog] = useState<any[]>([])
    const [selectedDefects, setSelectedDefects] = useState<string[]>([])
    const [defectSearch, setDefectSearch] = useState('')
    const [showDefectDropdown, setShowDefectDropdown] = useState(false)
    const defectInputRef = useRef<HTMLInputElement>(null)

    const unselectedDefects = useMemo(() => {
        const search = defectSearch.toLowerCase()
        return defectsCatalog
            .filter(d => !selectedDefects.includes(d.Título))
            .filter(d => d.Título?.toLowerCase().includes(search))
    }, [defectsCatalog, selectedDefects, defectSearch])

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
            <div className="bg-white dark:bg-[#0f1115] w-full max-w-4xl rounded-[4rem] shadow-2xl relative overflow-hidden border border-white/10">
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
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Tag className="w-3 h-3 text-blue-500" /> Nombre del Molde / Artículo
                            </label>
                            <input
                                required
                                value={formData.nombre_articulo || ''}
                                onChange={e => setFormData({ ...formData, nombre_articulo: e.target.value })}
                                className="w-full bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-2xl py-5 px-8 font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-400"
                                placeholder="Ej: Jabonera Leaf"
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Tag className="w-3 h-3 text-blue-500" /> Serial / Código Único
                            </label>
                            <input
                                required
                                value={formData.serial || ''}
                                onChange={e => setFormData({ ...formData, serial: e.target.value })}
                                className="w-full bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-2xl py-5 px-8 font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/20 outline-none transition-all uppercase"
                                placeholder="Ej: ML-001"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Estado Operativo</label>
                            <select
                                value={formData.estado || ''}
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
                                value={formData.Estado_reparacion || ''}
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

                    {!isEditing && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6 border-t border-black/5 dark:border-white/5">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                        <User className="w-3 h-3 text-blue-500" /> Responsable Asignado
                                    </label>
                                    <select
                                        value={formData.Responsable || ''}
                                        onChange={e => setFormData({ ...formData, Responsable: e.target.value })}
                                        className="w-full bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-2xl py-5 px-8 font-bold text-slate-900 dark:text-white outline-none appearance-none"
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
                                            value={formData.Fecha_de_ingreso || ''}
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
                                        value={formData.Fecha_esperada || ''}
                                        className="w-full bg-black/5 dark:bg-white/[0.01] border border-black/5 dark:border-white/5 rounded-2xl py-5 px-8 font-bold text-gray-400 cursor-not-allowed uppercase"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Fecha Real Entrega</label>
                                    <input
                                        type="date"
                                        value={formData.Fecha_de_entrega || ''}
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
                                                onClick={() => {
                                                    const news = selectedDefects.filter(x => x !== d)
                                                    setSelectedDefects(news)
                                                    setFormData({ ...formData, Observaciones_reparacion: news.join(', ') })
                                                }}
                                                className="hover:bg-blue-500/20 rounded-full p-0.5"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>

                                <div className="relative">
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        ref={defectInputRef}
                                        type="text"
                                        value={defectSearch}
                                        onChange={e => {
                                            setDefectSearch(e.target.value)
                                            setShowDefectDropdown(true)
                                        }}
                                        onFocus={() => setShowDefectDropdown(true)}
                                        placeholder="Buscar o agregar defectos..."
                                        className="w-full bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-2xl py-5 pl-14 pr-8 font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/20 outline-none transition-all"
                                    />
                                    {showDefectDropdown && (
                                        <div className="absolute top-100 left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-black/10 dark:border-white/10 rounded-2xl shadow-xl z-[60] overflow-hidden max-h-60 overflow-y-auto">
                                            {unselectedDefects.length > 0 ? (
                                                unselectedDefects.map(d => (
                                                    <button
                                                        key={d.id || d.Título}
                                                        type="button"
                                                        onClick={() => {
                                                            const news = [...selectedDefects, d.Título]
                                                            setSelectedDefects(news)
                                                            setFormData({ ...formData, Observaciones_reparacion: news.join(', ') })
                                                            setDefectSearch('')
                                                            setShowDefectDropdown(false)
                                                        }}
                                                        className="w-full text-left px-8 py-4 hover:bg-black/5 dark:hover:bg-white/5 font-bold text-xs transition-colors"
                                                    >
                                                        {d.Título}
                                                    </button>
                                                ))
                                            ) : (
                                                defectSearch.trim() ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const news = [...selectedDefects, defectSearch.trim()]
                                                            setSelectedDefects(news)
                                                            setFormData({ ...formData, Observaciones_reparacion: news.join(', ') })
                                                            setDefectSearch('')
                                                            setShowDefectDropdown(false)
                                                        }}
                                                        className="w-full text-left px-8 py-4 hover:bg-blue-500/10 text-blue-500 font-bold flex items-center gap-3"
                                                    >
                                                        <Plus className="w-4 h-4" /> Agregar "{defectSearch.trim()}"
                                                    </button>
                                                ) : (
                                                    <div className="px-8 py-4 text-xs text-gray-400 font-bold italic">No hay más defectos disponibles</div>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    <div className="space-y-6 pt-10 border-t border-black/5 dark:border-white/5">
                        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                            Observaciones Técnicas / Detalles de la Reparación
                        </label>
                        <textarea
                            value={formData.Observaciones_reparacion || ''}
                            onChange={e => setFormData({ ...formData, Observaciones_reparacion: e.target.value })}
                            className="w-full bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-[3rem] py-8 px-10 font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/20 outline-none transition-all h-60 resize-none placeholder:text-gray-700"
                            placeholder="Describa el estado actual, piezas requeridas y trabajos realizados..."
                        />
                    </div>

                    {isEditing && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-black/5 dark:border-white/5 bg-blue-500/[0.02] rounded-[3rem] p-10 border border-blue-500/10">
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