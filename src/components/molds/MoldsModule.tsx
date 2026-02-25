'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Loader2, Package, ArrowLeft, ChevronDown } from 'lucide-react'
import { moldsService, MoldActive } from '@/services/molds.service'
import MoldCard from './MoldCard'
import AddMoldModal from './AddMoldModal'

export default function MoldsModule() {
    const [molds, setMolds] = useState<MoldActive[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)

    // Filters
    const [searchQuery, setSearchQuery] = useState('')
    const [interventionFilter, setInterventionFilter] = useState('Todos')
    const [statusFilter, setStatusFilter] = useState('Todos')

    useEffect(() => {
        loadMolds()
    }, [])

    const loadMolds = async () => {
        setLoading(true)
        try {
            const data = await moldsService.getActiveMolds()
            setMolds(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const filteredMolds = molds.filter(m => {
        const matchesSearch =
            m.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.codigo.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.defectos.some(d => d.toLowerCase().includes(searchQuery.toLowerCase()))

        const matchesIntervention = interventionFilter === 'Todos' || m.tipo_reparacion === interventionFilter
        const matchesStatus = statusFilter === 'Todos' || m.estado === statusFilter

        return matchesSearch && matchesIntervention && matchesStatus
    })

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-white mb-2">
                        Gestión de <span className="text-blue-500">Moldes</span>
                    </h1>
                    <p className="text-gray-500 text-sm">Monitoreo de moldes en proceso y reparaciones activas.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                >
                    <Plus className="w-5 h-5" />
                    Agregar Molde
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col lg:flex-row gap-4 items-end lg:items-center">
                <div className="flex-1 w-full relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, código o defecto..."
                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:ring-1 focus:ring-blue-500/50 transition-all outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex gap-4 w-full lg:w-auto">
                    <div className="flex-1 lg:w-48 space-y-2">
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-2 flex items-center gap-1">
                            <Filter className="w-3 h-3" /> Intervención
                        </label>
                        <select
                            className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 px-3 text-xs text-white outline-none cursor-pointer"
                            value={interventionFilter}
                            onChange={(e) => setInterventionFilter(e.target.value)}
                        >
                            <option value="Todos">Todas</option>
                            <option value="Reparación rápida">Reparación rápida</option>
                            <option value="Reparación especial">Reparación especial</option>
                            <option value="Molde nuevo">Molde nuevo</option>
                        </select>
                    </div>

                    <div className="flex-1 lg:w-48 space-y-2">
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest ml-2 flex items-center gap-1">
                            <Package className="w-3 h-3" /> Estado
                        </label>
                        <select
                            className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 px-3 text-xs text-white outline-none cursor-pointer"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="Todos">Todos los Estados</option>
                            <option value="En espera en moldes">En espera en moldes</option>
                            <option value="En reparación">En reparación</option>
                            <option value="En espera en producción">En espera en producción</option>
                            <option value="Destruido">Destruido</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Molds Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                    <p className="text-gray-500 animate-pulse text-sm">Cargando base de datos...</p>
                </div>
            ) : filteredMolds.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                    {filteredMolds.map(mold => (
                        <MoldCard key={mold.id} mold={mold} onUpdate={loadMolds} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 bg-white/5 border border-white/5 rounded-[3rem] text-center px-6">
                    <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6">
                        <Package className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No se encontraron moldes</h3>
                    <p className="text-gray-500 max-w-xs text-sm">No hay moldes activos que coincidan con los filtros seleccionados.</p>
                </div>
            )}

            {/* Modals */}
            {showAddModal && <AddMoldModal onClose={() => setShowAddModal(false)} onSuccess={loadMolds} />}
        </div>
    )
}
