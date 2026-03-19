'use client' // Force rebuild 2026-03-17 

import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Search, Loader2, Package, Tag, Edit3, Settings2 } from 'lucide-react'
import { moldsService, Mold } from '@/services/molds.service'
import AddMoldModal from './AddMoldModal'

export default function MoldsModule() {
    const [molds, setMolds] = useState<Mold[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingMold, setEditingMold] = useState<Mold | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [repairFilter, setRepairFilter] = useState<'TODO' | 'REPARACION_RAPIDA' | 'REPARACION_ESPECIAL'>('TODO')

    const isFetchingRef = useRef(false)

    const fetchAllMolds = useCallback(async () => {
        if (isFetchingRef.current) return
        isFetchingRef.current = true
        setLoading(true)

        try {
            const data = await moldsService.getAll()
            setMolds(data || [])
        } catch (e) {
            console.error('Error loading molds:', e)
        } finally {
            isFetchingRef.current = false
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchAllMolds()
    }, [fetchAllMolds])

    const handleSearchChange = (value: string) => {
        setSearchQuery(value)
    }

    const filteredMolds = (molds || []).filter(m => {
        const query = searchQuery.toUpperCase()
        const matchesSearch = (m.nombre_articulo || '').toUpperCase().includes(query) || 
                             (m.serial || '').toUpperCase().includes(query)
        
        if (!matchesSearch) return false

        let matchesRepair = true
        if (repairFilter !== 'TODO') {
            const estadoObj = (m.estado || '').toUpperCase()
            // Ensure state is actually repairing and NOT disponible, en uso, destruido
            const isRepairState = estadoObj.includes('REPARACION') || estadoObj.includes('ESPERA') || estadoObj === 'EN REPARACION'
            const isInvalidState = estadoObj.includes('DESTRUIDO') || estadoObj.includes('DISPONIBLE') || estadoObj.includes('EN USO') || estadoObj.includes('ENTREGADO')

            if (isInvalidState || !isRepairState) return false; // Force repair states only

            const tipoRep = (m.Tipo_de_reparacion || '').toUpperCase()
            const isEspecial = tipoRep.includes('ESPECIAL')

            if (repairFilter === 'REPARACION_ESPECIAL') {
                matchesRepair = isEspecial
            } else if (repairFilter === 'REPARACION_RAPIDA') {
                matchesRepair = tipoRep.includes('RAPIDA') || tipoRep === 'REPARACION RAPIDA'
            }
        }

        return matchesRepair
    }).sort((a, b) => {
        const statusA = (a.estado || '').toUpperCase().includes('REPARACION') ? 1 : 0
        const statusB = (b.estado || '').toUpperCase().includes('REPARACION') ? 1 : 0
        if (statusA !== statusB) return statusB - statusA

        const dateA = a.Fecha_esperada ? new Date(a.Fecha_esperada).getTime() : Infinity
        const dateB = b.Fecha_esperada ? new Date(b.Fecha_esperada).getTime() : Infinity
        return dateA - dateB
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
        <div className="space-y-8 animate-in fade-in duration-700 p-4 md:p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 p-1.5 rounded-[2rem] border border-black/10 dark:border-white/10 shadow-inner">
                    {(['TODO', 'REPARACION_RAPIDA', 'REPARACION_ESPECIAL'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setRepairFilter(tab)}
                            className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${repairFilter === tab ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-500 dark:text-gray-500 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}`}
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

            <div className="glass-card p-8 rounded-[3rem] border border-black/5 dark:border-white/5 relative overflow-hidden shadow-2xl bg-white/50 dark:bg-black/20">
                <div className="relative flex items-center gap-6">
                    <div className="flex-1 w-full relative group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o serial..."
                            className="w-full bg-black/5 dark:bg-white/[0.03] border border-black/10 dark:border-white/10 rounded-[1.8rem] py-5 pl-16 pr-6 text-sm font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-700"
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-6">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                    <p className="text-gray-500 text-xs font-black uppercase tracking-[0.4em]">Sincronizando Base de Datos...</p>
                </div>
            ) : filteredMolds.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMolds.map((mold) => (
                        <div
                            key={mold.id || mold.serial || `mold-${mold.nombre_articulo}`}
                            onClick={() => setEditingMold(mold)}
                            className="group relative bg-white dark:bg-[#0a0a0a] border border-black/5 dark:border-white/5 rounded-[2.8rem] p-8 hover:border-blue-500/30 transition-all cursor-pointer flex flex-col shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(37,99,235,0.05)]"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-4 bg-blue-600/10 rounded-2xl border border-blue-500/20 transition-colors group-hover:bg-blue-600/20">
                                    <Package className="w-6 h-6 text-blue-500" />
                                </div>
                                <div className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                                    <Edit3 className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight uppercase line-clamp-2">{mold.nombre_articulo}</h3>
                                    <p className="text-[10px] font-mono font-black text-slate-500 dark:text-gray-600 mt-1 uppercase tracking-tighter">SERIAL: {mold.serial}</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <div className={`inline-flex px-4 py-1.5 rounded-full text-[9px] font-black uppercase border tracking-wider transition-all ${getStatusStyles(mold.estado)}`}>
                                        {mold.estado?.replace(/_/g, ' ')}
                                    </div>
                                    <div className="bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-full text-[9px] font-bold text-gray-500 uppercase">
                                        {mold.Tipo_de_reparacion || 'Standard'}
                                    </div>
                                </div>
                            </div>
                            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-b-[2.8rem]" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-40 text-center space-y-6 bg-black/5 dark:bg-white/[0.02] rounded-[3rem] border border-dashed border-black/10 dark:border-white/10">
                    <Package className="w-16 h-16 text-gray-300 mx-auto opacity-50" />
                    <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-sm">No se encontraron moldes.</p>
                </div>
            )}

            {showAddModal && <AddMoldModal onClose={() => setShowAddModal(false)} onSuccess={fetchAllMolds} />}
            {editingMold && <AddMoldModal moldToEdit={editingMold} onClose={() => setEditingMold(null)} onSuccess={fetchAllMolds} />}
        </div>
    )
}
