'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Package, ClipboardList, TrendingUp, Activity, Search, Filter, Calendar, Info, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { moldsService, MoldActive } from '@/services/molds.service'
import Navbar from '@/components/layout/Navbar'

export default function HistoryPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [results, setResults] = useState<MoldActive[]>([])

    // Filters
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedTypes, setSelectedTypes] = useState<string[]>([])
    const [selectedDefects, setSelectedDefects] = useState<string[]>([])
    const [defectsCatalog, setDefectsCatalog] = useState<any[]>([])
    const [isSearching, setIsSearching] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        const storedUser = localStorage.getItem('moldapp_user')
        if (!storedUser) {
            router.push('/login')
            return
        }
        setUser(JSON.parse(storedUser))
        loadInitialData()
    }, [router])

    const loadInitialData = async () => {
        setLoading(true)
        const defects = await moldsService.getDefectsCatalog()
        setDefectsCatalog(defects)
        // Load initial "recent" history
        const data = await moldsService.getActiveMolds()
        setResults(data)
        setLoading(false)
    }

    const handleSearch = async () => {
        setIsSearching(true)
        try {
            const data = await moldsService.searchHistory({
                titles: searchTerm ? [searchTerm] : [], // Simplification for now
                types: selectedTypes,
                defects: selectedDefects
            })
            setResults(data)
        } catch (error) {
            console.error(error)
        } finally {
            setIsSearching(false)
        }
    }

    const toggleType = (type: string) => {
        setSelectedTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        )
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <Navbar
                user={user}
                showBackButton
                backPath="/dashboard"
                title="Histórico"
                subtitle="Trazabilidad de Moldes"
            />

            {/* Main Content */}
            <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Lateral Filters */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="p-6 glass-card rounded-3xl border border-white/10 space-y-6">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Filter className="w-5 h-5 text-blue-500" /> Filtros
                            </h2>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Buscador</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Título o Código..."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs focus:ring-2 focus:ring-blue-500/50 outline-none"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tipo de Molde</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['Reparación rápida', 'Reparación especial', 'Molde nuevo'].map(type => (
                                            <button
                                                key={type}
                                                onClick={() => toggleType(type)}
                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${selectedTypes.includes(type) ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-white/5 border-white/10 text-gray-400'
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={handleSearch}
                                    disabled={isSearching}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                                >
                                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                                    Aplicar Filtros
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="p-8 glass-card rounded-[2.5rem] border border-white/5">
                            <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
                                <ClipboardList className="w-7 h-7 text-blue-500" /> Histórico de Moldes
                            </h2>

                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Código</th>
                                            <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Título</th>
                                            <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Entrega</th>
                                            <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Defectos</th>
                                            <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Obs</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {results.map((m, i) => (
                                            <tr key={m.id || i} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="py-4 px-4 font-mono text-xs text-blue-400">{m.codigo}</td>
                                                <td className="py-4 px-4 font-bold text-sm tracking-tight">{m.nombre}</td>
                                                <td className="py-4 px-4 text-xs text-gray-400">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="w-3 h-3 text-gray-500" />
                                                        {m.fecha_entrega_esperada}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {m.defectos.slice(0, 2).map((d, di) => (
                                                            <span key={di} className="px-1.5 py-0.5 bg-red-500/10 text-red-500/70 rounded text-[9px] font-medium border border-red-500/20">
                                                                {d}
                                                            </span>
                                                        ))}
                                                        {m.defectos.length > 2 && <span className="text-[9px] text-gray-600">+{m.defectos.length - 2}</span>}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4 text-xs text-gray-500 truncate max-w-[150px]">{m.observaciones}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {results.length === 0 && !isSearching && (
                                    <div className="py-20 text-center space-y-4">
                                        <Info className="w-12 h-12 text-gray-700 mx-auto" />
                                        <p className="text-gray-500 italic">No se encontraron registros con los filtros actuales.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom Floating Navigation */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl z-50">
                <button onClick={() => router.push('/dashboard/molds')} className="flex items-center gap-2 px-6 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all font-bold text-xs">
                    <Package className="w-4 h-4" /> Moldes
                </button>
                <button onClick={() => router.push('/dashboard/raw-materials')} className="flex items-center gap-2 px-6 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all font-bold text-xs">
                    <TrendingUp className="w-4 h-4" /> Consumo
                </button>
                <div className="px-6 py-3 bg-white/10 text-white rounded-2xl transition-all font-black text-xs flex items-center gap-2 shadow-lg shadow-white/5">
                    <ClipboardList className="w-4 h-4 text-blue-400" /> Histórico
                </div>
                <button onClick={() => router.push('/dashboard/audit')} className="flex items-center gap-2 px-6 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all font-bold text-xs">
                    <Activity className="w-4 h-4" /> Auditoría
                </button>
            </div>
        </div>
    )
}
