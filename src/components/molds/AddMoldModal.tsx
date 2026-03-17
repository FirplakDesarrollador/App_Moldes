'use client'

import { useState, useEffect } from 'react'
import { X, Search, Loader2, Calendar, AlertCircle, Plus, Check, ChevronDown, CheckCircle2, User, Activity, Clock, MessageCircle } from 'lucide-react'
import { moldsService, Mold, DefectItem } from '@/services/molds.service'
import { addBusinessDays } from '@/lib/date-utils'

interface AddMoldModalProps {
    moldToEdit?: Mold | null
    onClose: () => void
    onSuccess: () => void
}

export default function AddMoldModal({ moldToEdit, onClose, onSuccess }: AddMoldModalProps) {
    const [loading, setLoading] = useState(false)
    const [defectsCatalog, setDefectsCatalog] = useState<DefectItem[]>([])
    const [moldsCatalog, setMoldsCatalog] = useState<string[]>([])
    const [personnel, setPersonnel] = useState<any[]>([])

    const [showDefectsDropdown, setShowDefectsDropdown] = useState(false)
    const [defectsSearch, setDefectsSearch] = useState('')

    // Helper para normalizar fechas de la DB (MM/DD/YYYY) a input (YYYY-MM-DD)
    const normalizeDate = (dateStr: string | undefined): string => {
        if (!dateStr) return ''
        if (dateStr.includes('-')) return dateStr.split('T')[0] // Ya es ISO o similar
        if (dateStr.includes('/')) {
            const parts = dateStr.split('/')
            if (parts.length === 3) {
                // Asumiendo MM/DD/YYYY de la DB
                return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`
            }
        }
        return dateStr
    }

    // Form state
    const [formData, setFormData] = useState({
        nombre: moldToEdit?.Nombre || '',
        codigo: moldToEdit?.["CODIGO MOLDE"] || '',
        estado: moldToEdit?.ESTADO || 'En espera moldes',
        defectos: moldToEdit?.["DEFECTOS A REPARAR"] ? moldToEdit["DEFECTOS A REPARAR"].split(',').map(d => d.trim()) : [] as string[],
        tipo_reparacion: moldToEdit?.["Tipo de reparacion"] || 'Reparación rápida',
        fecha_entrada: normalizeDate(moldToEdit?.["FECHA ENTRADA"]) || new Date().toISOString().split('T')[0],
        fecha_esperada: normalizeDate(moldToEdit?.["FECHA ESPERADA"]) || '',
        fecha_entrega: normalizeDate(moldToEdit?.["FECHA ENTREGA"]) || '',
        observaciones: moldToEdit?.OBSERVACIONES || '',
        responsable: moldToEdit?.Usuario || ''
    })

    const STATUS_OPTIONS = [
        'Entregado',
        'En reparación',
        'Destruido',
        'En espera moldes',
        'En espera producción'
    ]

    const REPAIR_TYPES = [
        'Reparación rápida',
        'Reparación especial'
    ]

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [defects, molds, users] = await Promise.all([
                moldsService.getDefectsCatalog(),
                moldsService.getMoldsCatalog(),
                moldsService.getPersonnel()
            ])
            setDefectsCatalog(defects)
            setMoldsCatalog(molds)
            setPersonnel(users)
        } catch (error) {
            console.error('Error loading catalogs:', error)
        }
    }

    // Cálculo automático de fecha esperada
    useEffect(() => {
        if (!formData.fecha_entrada || formData.defectos.length === 0) {
            return
        }

        const totalDuration = formData.defectos.reduce((acc, title) => {
            const defect = defectsCatalog.find(d => d.Título === title)
            const timeVal = defect?.Tiempo
            const timeLimit = typeof timeVal === 'string' ? parseFloat(timeVal) : (timeVal || 0)
            return acc + (isNaN(timeLimit) ? 0 : timeLimit)
        }, 0)

        // Usamos la nueva versión de addBusinessDays que es más robusta
        const calculated = addBusinessDays(formData.fecha_entrada, totalDuration)

        if (!isNaN(calculated.getTime())) {
            const newExpected = calculated.toISOString().split('T')[0]
            if (newExpected !== formData.fecha_esperada) {
                setFormData(prev => ({ ...prev, fecha_esperada: newExpected }))
            }
        }
    }, [formData.fecha_entrada, formData.defectos, defectsCatalog])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.nombre || !formData.codigo || !formData.responsable || formData.defectos.length === 0) {
            alert('Por favor completa todos los campos obligatorios.')
            return
        }

        // Validación adicional: Fecha de entrega obligatoria si el estado es 'Entregado'
        if (formData.estado === 'Entregado' && !formData.fecha_entrega) {
            alert('La Fecha Entrega Real es obligatoria cuando el estado es "Entregado".')
            return
        }

        setLoading(true)
        try {
            const dbRecord: Mold = {
                Nombre: formData.nombre,
                "CODIGO MOLDE": formData.codigo,
                "ESTADO": formData.estado,
                "DEFECTOS A REPARAR": formData.defectos.join(', '),
                "Tipo de reparacion": formData.tipo_reparacion,
                "FECHA ENTRADA": formData.fecha_entrada,
                "FECHA ESPERADA": formData.fecha_esperada,
                "FECHA ENTREGA": formData.fecha_entrega || null,
                "OBSERVACIONES": formData.observaciones,
                "Usuario": formData.responsable,
                "Modified By": JSON.parse(localStorage.getItem('moldapp_user') || '{}').Nombre
            } as any

            await moldsService.saveMold(dbRecord)
            onSuccess()
            onClose()
        } catch (error: any) {
            console.error(error)
            alert('Error al guardar: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const toggleDefect = (title: string) => {
        const current = formData.defectos
        const next = current.includes(title)
            ? current.filter(d => d !== title)
            : [...current, title]
        setFormData({ ...formData, defectos: next })
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-500">
            <div className="w-full max-w-3xl bg-[#0a0a0a] border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(37,99,235,0.1)] flex flex-col max-h-[92vh]">

                {/* Header */}
                <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-blue-600/10 rounded-3xl flex items-center justify-center border border-blue-600/20">
                            <Plus className={`w-8 h-8 text-blue-500 ${moldToEdit ? 'rotate-45' : ''} transition-transform`} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-widest text-white leading-none mb-1">
                                {moldToEdit ? 'Editar Registro' : 'Nuevo Ingreso'}
                            </h2>
                            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.4em]">Módulo Moldes V2.1</p>
                        </div>
                    </div>
                    <button onClick={() => { if (confirm('¿Cerrar sin guardar cambios?')) onClose(); }} className="p-4 hover:bg-white/5 rounded-3xl transition-all">
                        <X className="w-6 h-6 text-gray-600" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-12 space-y-10 custom-scrollbar">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* 1. Descripción del Molde (Nombre) */}
                        <div className="space-y-3 relative">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-6">Título / Descripción</label>
                            <div className="relative group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                <input
                                    list="molds-list"
                                    type="text"
                                    placeholder="Nombre del molde..."
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-[1.5rem] py-5 pl-14 pr-6 text-sm font-bold text-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    required
                                />
                                <datalist id="molds-list">
                                    {moldsCatalog.map(m => <option key={m} value={m} />)}
                                </datalist>
                            </div>
                        </div>

                        {/* 2. Código Molde */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-6">Código Único (PK)</label>
                            <input
                                type="text"
                                className="w-full bg-white/[0.03] border border-white/10 rounded-[1.5rem] py-5 px-8 text-sm font-mono font-black text-blue-400 placeholder:text-gray-800 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all uppercase"
                                placeholder="Ej: MOLDE-001"
                                value={formData.codigo}
                                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                                required
                            />
                        </div>

                        {/* 3. Responsable */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-6">Responsable Asignado</label>
                            <div className="relative">
                                <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <select
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-[1.5rem] py-5 pl-14 pr-10 text-sm font-bold text-white appearance-none cursor-pointer outline-none focus:ring-4 focus:ring-blue-500/10 transition-all uppercase"
                                    value={formData.responsable}
                                    onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                                    required
                                >
                                    <option value="" className="bg-black">-- Seleccionar Operario --</option>
                                    {personnel.map(p => (
                                        <option key={p.Cedula} value={p.NombreCompleto} className="bg-black">
                                            {p.NombreCompleto}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700 pointer-events-none" />
                            </div>
                        </div>

                        {/* 4. Tipo de Reparación */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-6">Categoría Reparación</label>
                            <div className="relative">
                                <Activity className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <select
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-[1.5rem] py-5 pl-14 pr-10 text-sm font-bold text-white appearance-none cursor-pointer outline-none focus:ring-4 focus:ring-blue-500/10 transition-all uppercase"
                                    value={formData.tipo_reparacion}
                                    onChange={(e) => setFormData({ ...formData, tipo_reparacion: e.target.value })}
                                >
                                    {REPAIR_TYPES.map(opt => (
                                        <option key={opt} value={opt} className="bg-black">{opt}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700 pointer-events-none" />
                            </div>
                        </div>

                        {/* 5. Fecha Entrada */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-6">Fecha de Entrada</label>
                            <div className="relative group">
                                <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors z-20 pointer-events-none" />
                                <input
                                    type="date"
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-[1.5rem] py-5 pl-14 pr-6 text-sm font-bold text-white outline-none focus:ring-4 focus:ring-blue-500/10 transition-all relative z-10"
                                    value={formData.fecha_entrada}
                                    onChange={(e) => setFormData({ ...formData, fecha_entrada: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* 6. Fecha Esperada (Auto) */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-6">Fecha Entrega Esperada (Auto)</label>
                            <div className="relative">
                                <Clock className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500/50" />
                                <input
                                    type="date"
                                    readOnly
                                    className="w-full bg-blue-500/[0.02] border border-blue-500/20 rounded-[1.5rem] py-5 pl-14 pr-6 text-sm font-black text-blue-400 outline-none cursor-not-allowed"
                                    value={formData.fecha_esperada}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 7. Fecha Entrega Real (Manual) - Separada para evitar bloqueos de layout */}
                    <div className="space-y-3 pt-6 border-t border-white/5">
                        <label className="text-[10px] font-black text-green-500 uppercase tracking-[0.3em] ml-6">
                            Fecha Entrega Real (Manual) {formData.estado === 'Entregado' && <span className="text-red-500 ml-1 font-bold"> — REQUERIDO</span>}
                        </label>
                        <div className="relative group">
                            <CheckCircle2 className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 group-focus-within:text-green-400 transition-colors z-20 pointer-events-none" />
                            <input
                                type="date"
                                className="w-full bg-green-500/[0.08] border border-green-500/30 rounded-[2rem] py-6 pl-16 pr-8 text-base font-bold text-white outline-none focus:ring-4 focus:ring-green-500/20 transition-all cursor-pointer relative z-10"
                                value={formData.fecha_entrega}
                                onChange={(e) => setFormData({ ...formData, fecha_entrega: e.target.value })}
                                onFocus={(e) => (e.target as any).showPicker?.()}
                                onClick={(e) => (e.target as any).showPicker?.()}
                            />
                        </div>
                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-wider ml-6">Indica la fecha real de salida del taller.</p>
                    </div>

                    {/* 8. Defectos (Multi-select) */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-6">Defectos a Reparar / Intervenir</label>
                        <div
                            className="bg-white/[0.02] border border-white/10 rounded-[2rem] p-4 min-h-[120px] transition-all relative cursor-pointer hover:bg-white/[0.04]"
                            onClick={() => setShowDefectsDropdown(!showDefectsDropdown)}
                        >
                            <div className="flex flex-wrap gap-2">
                                {formData.defectos.length > 0 ? (
                                    formData.defectos.map((d, i) => (
                                        <div key={i} className="flex items-center gap-2 bg-blue-600/10 text-blue-400 px-4 py-2 rounded-xl border border-blue-600/20 text-[10px] font-black uppercase">
                                            {d}
                                            <button onClick={(e) => { e.stopPropagation(); toggleDefect(d); }} className="hover:text-white"><X className="w-3 h-3" /></button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-700 text-xs font-medium p-4 italic">No hay defectos seleccionados. Haz clic para abrir el catálogo...</p>
                                )}
                            </div>
                        </div>

                        {showDefectsDropdown && (
                            <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-4 shadow-2xl animate-in fade-in slide-in-from-top-4">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Filtrar defectos..."
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs font-medium outline-none"
                                        value={defectsSearch}
                                        onChange={(e) => setDefectsSearch(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1 custom-scrollbar">
                                    {defectsCatalog.filter(d => d.Título.toLowerCase().includes(defectsSearch.toLowerCase())).map((d, i) => (
                                        <div
                                            key={i}
                                            onClick={(e) => { e.stopPropagation(); toggleDefect(d.Título); }}
                                            className={`p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between border ${formData.defectos.includes(d.Título) ? 'bg-blue-600 border-blue-500 shadow-lg' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase tracking-tight">{d.Título}</span>
                                                <span className="text-[9px] opacity-60 font-bold uppercase">{d.Tiempo} DÍAS</span>
                                            </div>
                                            {formData.defectos.includes(d.Título) && <CheckCircle2 className="w-4 h-4 text-white" />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 9. Estado */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-6">Estado del Molde en Taller</label>
                        <div className="flex flex-wrap gap-4">
                            {STATUS_OPTIONS.map(opt => (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, estado: opt })}
                                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${formData.estado === opt ? 'bg-blue-600 text-white border-blue-500 shadow-xl shadow-blue-600/20' : 'bg-white/5 text-gray-500 border-white/5 hover:bg-white/10'}`}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 10. Observaciones */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-6">Observaciones / Comentarios</label>
                        <div className="relative group">
                            <MessageCircle className="absolute left-6 top-6 w-5 h-5 text-gray-600 group-focus-within:text-blue-500 transition-all" />
                            <textarea
                                className="w-full bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 pl-16 text-sm font-medium text-gray-300 min-h-[140px] outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-gray-800"
                                placeholder="Notas adicionales sobre el proceso..."
                                value={formData.observaciones}
                                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-8 flex gap-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black py-10 rounded-[3rem] transition-all flex items-center justify-center gap-6 shadow-[0_20px_60px_rgba(37,99,235,0.4)] active:scale-[0.98] uppercase tracking-[0.4em]"
                        >
                            {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : <><Save className="w-6 h-6" /> {moldToEdit ? 'Actualizar Registro' : 'Confirmar Ingreso'}</>}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    )
}

function Save({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
}
