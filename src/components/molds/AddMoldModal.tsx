'use client'

import { useState, useEffect } from 'react'
import { X, Search, Loader2, Calendar, AlertCircle, Plus, Check, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { moldsService, MoldActive } from '@/services/molds.service'

interface AddMoldModalProps {
    onClose: () => void
    onSuccess: () => void
}

export default function AddMoldModal({ onClose, onSuccess }: AddMoldModalProps) {
    const [loading, setLoading] = useState(false)
    const [searching, setSearching] = useState(false)
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [defectsCatalog, setDefectsCatalog] = useState<any[]>([])
    const [showDefectsDropdown, setShowDefectsDropdown] = useState(false)
    const [defectsSearch, setDefectsSearch] = useState('')

    // Form state
    const [formData, setFormData] = useState<Partial<MoldActive>>({
        nombre: '',
        codigo: '',
        estado: 'En espera en moldes',
        defectos: [],
        tipo_reparacion: 'Reparación rápida',
        fecha_entrada: new Date().toISOString().split('T')[0],
        fecha_entrega_esperada: '',
        observaciones: ''
    })

    const supabase = createClient()

    useEffect(() => {
        loadDefects()
    }, [])

    const loadDefects = async () => {
        const data = await moldsService.getDefectsCatalog()
        setDefectsCatalog(data)
    }

    const searchMolds = async (query: string) => {
        if (query.length < 2) {
            setSearchResults([])
            return
        }
        setSearching(true)
        try {
            const { data } = await supabase
                .from('base_datos_moldes')
                .select('Nombre, "CODIGO MOLDE"')
                .or(`Nombre.ilike.%${query}%, "CODIGO MOLDE".ilike.%${query}%`)
                .limit(5)
            setSearchResults(data || [])
        } catch (error) {
            console.error(error)
        } finally {
            setSearching(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const storedUser = localStorage.getItem('moldapp_user')
            const user = storedUser ? JSON.parse(storedUser) : null

            await moldsService.addMold({
                ...formData as MoldActive,
                created_by: user?.Cedula?.toString(),
                fecha_entrega_esperada: formData.fecha_entrega_esperada || calculateEstimatedDate(formData.defectos || [])
            })
            onSuccess()
            onClose()
        } catch (error) {
            console.error(error)
            alert('Error al agregar el molde')
        } finally {
            setLoading(false)
        }
    }

    const calculateEstimatedDate = (selectedDefectTitles: string[]) => {
        if (!formData.fecha_entrada) return ''

        const totalDays = selectedDefectTitles.reduce((acc, title) => {
            const defect = defectsCatalog.find(d => d.Título === title)
            return acc + (defect?.Tiempo || 0)
        }, 0)

        const entryDate = new Date(formData.fecha_entrada + 'T00:00:00')
        // Add totalDays (handling potential floats if needed, but adding as days)
        entryDate.setDate(entryDate.getDate() + Math.ceil(totalDays))

        return entryDate.toISOString().split('T')[0]
    }

    const toggleDefect = (defectTitle: string) => {
        const current = formData.defectos || []
        let newDefects: string[] = []

        if (current.includes(defectTitle)) {
            newDefects = current.filter(d => d !== defectTitle)
        } else {
            newDefects = [...current, defectTitle]
        }

        const estimatedDate = calculateEstimatedDate(newDefects)
        setFormData({
            ...formData,
            defectos: newDefects,
            fecha_entrega_esperada: estimatedDate
        })
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-2xl bg-[#0f0f0f] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Plus className="w-5 h-5 text-blue-500" />
                        Agregar Nuevo Molde
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                    {/* Buscador Autocomplete */}
                    <div className="space-y-2 relative">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Buscador de Molde</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Nombre del molde..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-blue-500/50 transition-all outline-none"
                                value={formData.nombre}
                                onChange={(e) => {
                                    setFormData({ ...formData, nombre: e.target.value })
                                    searchMolds(e.target.value)
                                }}
                                required
                            />
                            {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />}
                        </div>
                        {searchResults.length > 0 && (
                            <div className="absolute z-10 w-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                                {searchResults.map((m, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        className="w-full p-4 text-left hover:bg-blue-500/10 border-b border-white/5 last:border-0 transition-colors"
                                        onClick={() => {
                                            setFormData({ ...formData, nombre: m.Nombre, codigo: m['CODIGO MOLDE'] })
                                            setSearchResults([])
                                        }}
                                    >
                                        <p className="text-sm font-bold">{m.Nombre}</p>
                                        <p className="text-xs text-gray-500">{m['CODIGO MOLDE']}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Código del Molde</label>
                            <input
                                type="text"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-500/50 transition-all outline-none"
                                value={formData.codigo}
                                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Estado Inicial</label>
                            <select
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none appearance-none"
                                value={formData.estado}
                                onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
                            >
                                <option value="En espera en moldes">En espera en moldes</option>
                                <option value="En reparación">En reparación</option>
                                <option value="En espera en producción">En espera en producción</option>
                                <option value="Destruido">Destruido</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Clasificación</label>
                            <select
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none appearance-none"
                                value={formData.tipo_reparacion}
                                onChange={(e) => setFormData({ ...formData, tipo_reparacion: e.target.value as any })}
                            >
                                <option value="Reparación rápida">Reparación rápida</option>
                                <option value="Reparación especial">Reparación especial</option>
                                <option value="Molde nuevo">Molde nuevo</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Fecha Entrada</label>
                            <input
                                type="date"
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white outline-none"
                                value={formData.fecha_entrada}
                                onChange={(e) => setFormData({ ...formData, fecha_entrada: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Defectos Searchable Dropdown */}
                    <div className="space-y-2 relative">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Defectos a Reparar
                        </label>

                        <div
                            onClick={() => setShowDefectsDropdown(!showDefectsDropdown)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white flex items-center justify-between cursor-pointer hover:bg-white/10 transition-all min-h-[50px]"
                        >
                            <div className="flex flex-wrap gap-2">
                                {formData.defectos && formData.defectos.length > 0 ? (
                                    formData.defectos.map((d, i) => (
                                        <span key={i} className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1 border border-blue-500/30">
                                            {d}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-gray-500 text-sm">Selecciona los defectos...</span>
                                )}
                            </div>
                            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showDefectsDropdown ? 'rotate-180' : ''}`} />
                        </div>

                        {showDefectsDropdown && (
                            <div className="absolute z-50 w-full mt-2 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-3 border-b border-white/5">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Buscar defecto..."
                                            className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                            value={defectsSearch}
                                            onChange={(e) => setDefectsSearch(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            autoFocus
                                        />
                                    </div>
                                </div>
                                <div className="max-h-60 overflow-y-auto p-2 custom-scrollbar">
                                    {defectsCatalog
                                        .filter(d => d.Título.toLowerCase().includes(defectsSearch.toLowerCase()))
                                        .map((d, i) => (
                                            <div
                                                key={i}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    toggleDefect(d.Título)
                                                }}
                                                className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-colors mb-1 ${formData.defectos?.includes(d.Título)
                                                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                                                    : 'hover:bg-white/5 text-gray-400'
                                                    }`}
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold">{d.Título}</span>
                                                    <span className="text-[10px] opacity-50 uppercase tracking-tighter">Tiempo estimado: {d.Tiempo}d</span>
                                                </div>
                                                {formData.defectos?.includes(d.Título) && <Check className="w-4 h-4" />}
                                            </div>
                                        ))}
                                    {defectsCatalog.filter(d => d.Título.toLowerCase().includes(defectsSearch.toLowerCase())).length === 0 && (
                                        <div className="p-4 text-center text-gray-600 text-xs italic">No se encontraron defectos</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Observaciones</label>
                        <textarea
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white min-h-[100px] outline-none"
                            placeholder="Escribe detalles adicionales aquí..."
                            value={formData.observaciones}
                            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Registrar Molde</>}
                    </button>
                </form>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
            `}</style>
        </div>
    )
}
