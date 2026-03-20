// PV_MOLDES V2.4
'use client' // Force rebuild 2026-03-17 

import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Search, Loader2, Package, Edit3 } from 'lucide-react'
import { moldsService, Mold } from '@/services/molds.service'
import AddMoldModal from './AddMoldModal'

export default function MoldsModule() {
    const [molds, setMolds] = useState<Mold[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingMold, setEditingMold] = useState<Mold | null>(null)
    const [searchQuery, setSearchQuery] = useState('')


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

        return true
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
                <div className="w-full overflow-x-auto rounded-[2rem] border border-black/5 dark:border-white/5 bg-white/50 dark:bg-black/20 shadow-2xl glass-card relative">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
                                <th className="p-6 text-[10px] font-black uppercase text-gray-500 tracking-widest">Nombre del Molde</th>
                                <th className="p-6 text-[10px] font-black uppercase text-gray-500 tracking-widest">Serial</th>
                                <th className="p-6 text-[10px] font-black uppercase text-gray-500 tracking-widest">Estado</th>
                                <th className="p-6 text-[10px] font-black uppercase text-gray-500 tracking-widest">Tipo Rep.</th>
                                <th className="p-6 text-[10px] font-black uppercase text-gray-500 tracking-widest min-w-[200px]">Defectos Principales</th>
                                <th className="p-6 text-[10px] font-black uppercase text-gray-500 tracking-widest">Fecha Ingreso</th>
                                <th className="p-6 text-[10px] font-black uppercase text-gray-500 tracking-widest">Fecha Esperada</th>
                                <th className="p-6 text-[10px] font-black uppercase text-gray-500 tracking-widest">Fecha Real Entrega</th>
                                <th className="p-6 text-center text-[10px] font-black uppercase text-gray-500 tracking-widest">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                            {filteredMolds.map((mold) => {
                                const isDelayed = mold.Fecha_esperada && new Date(mold.Fecha_esperada) < new Date() && !((mold.estado || '').toUpperCase().includes('ENTREGADO'));
                                return (
                                <tr 
                                    key={mold.id} 
                                    onClick={() => setEditingMold(mold)}
                                    className="group hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                                >
                                    <td className="p-6 align-middle font-bold text-slate-900 dark:text-white uppercase leading-tight">
                                        {mold.nombre_articulo}
                                    </td>
                                    <td className="p-6 align-middle">
                                        <span className="font-mono text-xs font-bold text-slate-500 uppercase">{mold.serial}</span>
                                    </td>
                                    <td className="p-6 align-middle">
                                        <div className={`inline-flex px-3 py-1.5 rounded-full text-[9px] font-black uppercase border tracking-wider ${getStatusStyles(mold.estado)}`}>
                                            {mold.estado?.replace(/_/g, ' ')}
                                        </div>
                                    </td>
                                    <td className="p-6 align-middle">
                                        <div className="bg-black/5 dark:bg-white/5 inline-flex px-3 py-1.5 rounded-full text-[9px] font-bold text-gray-500 uppercase whitespace-nowrap">
                                            {mold.Tipo_de_reparacion || 'Standard'}
                                        </div>
                                    </td>
                                    <td className="p-6 align-middle">
                                        <div className="text-xs text-gray-600 dark:text-gray-400 font-medium line-clamp-2 max-w-sm">
                                            {mold.Observaciones_reparacion || '-'}
                                        </div>
                                    </td>
                                    <td className="p-6 align-middle">
                                        <div className="font-mono text-xs font-bold text-slate-600 dark:text-gray-400">
                                            {mold.Fecha_de_ingreso ? mold.Fecha_de_ingreso.split('T')[0] : '-'}
                                        </div>
                                    </td>
                                    <td className="p-6 align-middle">
                                        <div className={`font-mono text-xs font-bold ${isDelayed ? 'text-red-500' : 'text-slate-600 dark:text-gray-400'}`}>
                                            {mold.Fecha_esperada ? mold.Fecha_esperada.split('T')[0] : '-'}
                                        </div>
                                    </td>
                                    <td className="p-6 align-middle">
                                        <div className="font-mono text-xs font-bold text-slate-600 dark:text-gray-400">
                                            {mold.Fecha_de_entrega ? mold.Fecha_de_entrega.split('T')[0] : '-'}
                                        </div>
                                    </td>
                                    <td className="p-6 align-middle text-center">
                                        <button className="p-2.5 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white rounded-xl transition-all opacity-50 group-hover:opacity-100">
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                                )
                            })}
                        </tbody>
                    </table>
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
