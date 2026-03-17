'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Loader2, Package, Tag, Clock, Calendar, User, Edit3, CheckCircle2, AlertCircle } from 'lucide-react'
import { moldsService, Mold } from '@/services/molds.service'
import { parseFlexibleDate } from '@/lib/date-utils'
import AddMoldModal from './AddMoldModal'
import MoldDetails from './MoldDetails'

export default function MoldsModule() {
    const [molds, setMolds] = useState<Mold[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [selectedMoldDetails, setSelectedMoldDetails] = useState<Mold | null>(null)
    const [editingMold, setEditingMold] = useState<Mold | null>(null)

    // Filters
    const [searchQuery, setSearchQuery] = useState('')
    const [repairFilter, setRepairFilter] = useState<'TODO' | 'REPARACION_RAPIDA' | 'REPARACION_ESPECIAL'>('TODO')

    useEffect(() => {
        loadMolds()
    }, [])

    const loadMolds = async () => {
        setLoading(true)
        try {
            const data = await moldsService.getAll()
            setMolds(data)
        } catch (error: any) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredMolds = molds.filter(m => {
        // Lógica de Segmentación de Reparación
        let matchesRepair = true
        const tipoRep = (m["Tipo de reparacion"] || '').toUpperCase()
        const defectoStr = (m["DEFECTOS A REPARAR"] || '').toUpperCase()

        if (repairFilter === 'REPARACION_ESPECIAL') {
            matchesRepair = tipoRep.includes('ESPECIAL') ||
                defectoStr.includes('NUEVO') ||
                defectoStr.includes('DESTRUCCION')
        } else if (repairFilter === 'REPARACION_RAPIDA') {
            // "en este modo debe priorizar mostrar moldes EN REPARACION" 
            // Esto se maneja mejor por ordenación, pero el filtro debe incluir todo lo que no es especial
            const isEspecial = tipoRep.includes('ESPECIAL') ||
                defectoStr.includes('NUEVO') ||
                defectoStr.includes('DESTRUCCION')
            matchesRepair = !isEspecial
        }

        // Buscador: case-insensitive, parcial para nombre, exacto para código (si ingresa completo)
        const query = searchQuery.toLowerCase().trim()
        const matchesSearch = !query ||
            (m.Nombre || '').toLowerCase().includes(query) ||
            (m["CODIGO MOLDE"] || '').toLowerCase().includes(query) ||
            (m.ESTADO || '').toLowerCase().includes(query) ||
            (m["DEFECTOS A REPARAR"] || '').toLowerCase().includes(query)

        return matchesRepair && matchesSearch
    }).sort((a, b) => {
        // Lógica de Priorización por estado en Reparación Rápida
        if (repairFilter === 'REPARACION_RAPIDA') {
            const statusA = (a.ESTADO || '').toUpperCase().includes('REPARACION') ? 1 : 0
            const statusB = (b.ESTADO || '').toUpperCase().includes('REPARACION') ? 1 : 0
            if (statusA !== statusB) return statusB - statusA
        }

        // Criterio base: Fecha esperada ASC, Fecha Entrada ASC
        const dateA_exp = a["FECHA ESPERADA"] ? new Date(a["FECHA ESPERADA"]).getTime() : Infinity
        const dateB_exp = b["FECHA ESPERADA"] ? new Date(b["FECHA ESPERADA"]).getTime() : Infinity
        if (dateA_exp !== dateB_exp) return dateA_exp - dateB_exp

        const dateA_ent = a["FECHA ENTRADA"] ? new Date(a["FECHA ENTRADA"]).getTime() : Infinity
        const dateB_ent = b["FECHA ENTRADA"] ? new Date(b["FECHA ENTRADA"]).getTime() : Infinity
        return dateA_ent - dateB_ent
    })

    const getStatusStyles = (st: string) => {
        const s = (st || '').toUpperCase()
        if (s.includes('REPARACION')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
        if (s.includes('ESPERA')) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
        if (s.includes('ENTREGADO') || s.includes('PRODUCCION')) return 'bg-green-500/10 text-green-400 border-green-500/20'
        if (s.includes('DESTRUIDO')) return 'bg-red-500/10 text-red-500 border-red-500/20'
        return 'bg-white/5 text-gray-400 border-white/10'
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* 1. Repair Type Tabs */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-[2rem] border border-white/10">
                    {(['TODO', 'REPARACION_RAPIDA', 'REPARACION_ESPECIAL'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setRepairFilter(tab)}
                            className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${repairFilter === tab ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                        >
                            {tab.replace(/_/g, ' ')}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-[2.5rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-blue-600/20 flex items-center gap-3 active:scale-[0.98] transition-all"
                >
                    <Plus className="w-5 h-5" /> Iniciar Registro
                </button>
            </div>

            {/* 2. Search Section */}
            <div className="glass-card p-8 rounded-[3rem] border border-white/5 space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 rounded-full blur-[100px] -mr-40 -mt-40 pointer-events-none" />
                <div className="relative flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-1 w-full relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar molde, código, estado o defecto..."
                            className="w-full bg-white/[0.03] border border-white/10 rounded-[1.8rem] py-5 pl-16 pr-6 text-sm font-bold text-white focus:ring-4 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-700"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* 3. List of Results */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-6">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                    <p className="text-gray-500 text-xs font-black uppercase tracking-[0.4em]">Sincronizando Base de Datos...</p>
                </div>
            ) : filteredMolds.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                    {filteredMolds.map(mold => (
                        <div
                            key={mold.ID}
                            onClick={() => setSelectedMoldDetails(mold)}
                            className="group relative bg-[#0a0a0a] border border-white/5 rounded-[2.8rem] p-8 hover:border-blue-500/30 transition-all cursor-pointer flex flex-col h-full shadow-lg"
                        >
                            {/* Card Header */}
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-4 bg-blue-600/10 rounded-2xl border border-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                                    <Tag className="w-6 h-6 text-blue-500" />
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setEditingMold(mold); }}
                                    className="p-3 bg-white/5 hover:bg-blue-600/20 rounded-xl transition-all border border-white/5"
                                >
                                    <Edit3 className="w-4 h-4 text-gray-500 group-hover:text-blue-400" />
                                </button>
                            </div>

                            <div className="space-y-4 flex-1">
                                <div>
                                    <h3 className="text-lg font-black text-white leading-tight uppercase line-clamp-2">{mold.Nombre}</h3>
                                    <p className="text-[10px] font-mono font-black text-gray-600 mt-1 uppercase tracking-tighter">REF: {mold["CODIGO MOLDE"]}</p>
                                </div>

                                <div className={`inline-flex px-4 py-1.5 rounded-full text-[9px] font-black uppercase border tracking-wider ${getStatusStyles(mold.ESTADO)}`}>
                                    {mold.ESTADO?.replace(/_/g, ' ')}
                                </div>

                                <div className="space-y-3 pt-4 border-t border-white/5">
                                    <div className="flex items-center justify-between text-[10px] font-bold">
                                        <div className="flex items-center gap-2 text-gray-500 uppercase tracking-widest">
                                            <Calendar className="w-3 h-3" /> Entrada
                                        </div>
                                        <span className="text-white">{parseFlexibleDate(mold["FECHA ENTRADA"])?.toLocaleDateString() || mold["FECHA ENTRADA"] || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] font-bold">
                                        <div className="flex items-center gap-2 text-blue-500/50 uppercase tracking-widest">
                                            <Clock className="w-3 h-3" /> Esperada
                                        </div>
                                        <span className="text-blue-400 font-black">{parseFlexibleDate(mold["FECHA ESPERADA"])?.toLocaleDateString() || mold["FECHA ESPERADA"] || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] font-bold">
                                        <div className="flex items-center gap-2 text-green-500/50 uppercase tracking-widest">
                                            <CheckCircle2 className="w-3 h-3" /> Entrega Real
                                        </div>
                                        <span className="text-green-400 font-black">{parseFlexibleDate(mold["FECHA ENTREGA"])?.toLocaleDateString() || 'PENDIENTE'}</span>
                                    </div>
                                </div>

                                <div className="bg-white/2 rounded-2xl p-4 space-y-2">
                                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Defectos Registrados</p>
                                    <div className="flex flex-wrap gap-2">
                                        {mold["DEFECTOS A REPARAR"]?.split(',').map((def, idx) => (
                                            <span key={idx} className="bg-red-500/5 text-red-500/60 border border-red-500/10 px-2.5 py-1 rounded-lg text-[9px] font-bold">
                                                {def.trim()}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                        <User className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <span className="text-[8px] font-black text-gray-600 uppercase tracking-[0.2em] line-clamp-1">{mold.Usuario || 'SIN ASIGNAR'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-40 text-center space-y-6">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/5">
                        <Package className="w-10 h-10 text-gray-800" />
                    </div>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">No se encontraron moldes con estos criterios.</p>
                </div>
            )}

            {/* Modals */}
            {showAddModal && <AddMoldModal onClose={() => setShowAddModal(false)} onSuccess={loadMolds} />}
            {selectedMoldDetails && <MoldDetails mold={selectedMoldDetails} onClose={() => setSelectedMoldDetails(null)} onEdit={(m) => { setSelectedMoldDetails(null); setEditingMold(m); }} />}
            {editingMold && <AddMoldModal moldToEdit={editingMold} onClose={() => setEditingMold(null)} onSuccess={loadMolds} />}
        </div>
    )
}
