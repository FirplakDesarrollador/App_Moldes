'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Package, ClipboardList, TrendingUp, Activity, Search, Filter, Calendar, Info, Loader2, Clock } from 'lucide-react'
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
    const [isSearching, setIsSearching] = useState(false)

    useEffect(() => {
        const storedUser = localStorage.getItem('moldapp_user')
        if (!storedUser) {
            router.push('/login')
            return
        }
        setUser(JSON.parse(storedUser))
        setLoading(false)
    }, [router])

    const handleSearch = async () => {
        if (!searchTerm.trim()) return

        setIsSearching(true)
        try {
            // Buscamos historial completo del molde seleccionado
            const data = await moldsService.getHistoryForMold(searchTerm.trim())
            setResults(data)
        } catch (error) {
            console.error('Error fetching history:', error)
        } finally {
            setIsSearching(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <Navbar
                user={user}
                showBackButton
                backPath="/dashboard"
                title="Histórico"
                subtitle="Trazabilidad Completa"
            />

            {/* Main Content */}
            <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
                <div className="space-y-8 animate-in fade-in duration-500">

                    {/* Search Bar for History */}
                    <div className="p-10 glass-card rounded-[3rem] border border-white/5 space-y-8 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none group-hover:bg-blue-600/10 transition-colors" />

                        <div className="max-w-2xl">
                            <h2 className="text-3xl font-black mb-4 tracking-tighter">Buscador de <span className="text-blue-500">Trazabilidad</span></h2>
                            <p className="text-gray-500 text-sm mb-8 font-medium">Ingresa el código exacto del molde para desplegar todos los eventos históricos registrados en la base de datos dinámica.</p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1 relative group/input">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within/input:text-blue-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Código del Molde (Ej: 0062-47)..."
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all font-mono"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                </div>
                                <button
                                    onClick={handleSearch}
                                    disabled={isSearching}
                                    className="bg-blue-600 hover:bg-blue-500 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 uppercase text-[10px] tracking-[0.2em]"
                                >
                                    {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : "Consultar Trazabilidad"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Results Table */}
                    <div className="p-8 glass-card rounded-[2.5rem] border border-white/5 bg-black/40 backdrop-blur-3xl">
                        <div className="flex items-center justify-between mb-8 px-4">
                            <h3 className="text-xl font-black flex items-center gap-3">
                                <Clock className="w-6 h-6 text-blue-500" /> Eventos del Molde
                            </h3>
                            {results.length > 0 && (
                                <span className="px-4 py-1.5 bg-blue-500/10 text-blue-400 rounded-full text-[10px] font-black border border-blue-500/20 uppercase tracking-widest">
                                    {results.length} Registros Encontrados
                                </span>
                            )}
                        </div>

                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="py-5 px-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Fecha Evento</th>
                                        <th className="py-5 px-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Estado</th>
                                        <th className="py-5 px-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Tipo/Categoría</th>
                                        <th className="py-5 px-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Defectos / Obs</th>
                                        <th className="py-5 px-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Usuario</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {results.map((m, i) => (
                                        <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                            <td className="py-5 px-6 border-l-2 border-transparent group-hover:border-blue-500 transition-all">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-white">{new Date(m.Created).toLocaleDateString()}</span>
                                                    <span className="text-[10px] text-gray-500 font-mono tracking-tighter">{new Date(m.Created).toLocaleTimeString()}</span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6">
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black border uppercase ${m.ESTADO?.includes('ESPERA') ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                        m.ESTADO?.includes('REPARACION') ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                            'bg-green-500/10 text-green-500 border-green-500/20'
                                                    }`}>
                                                    {m.ESTADO || 'S/E'}
                                                </span>
                                            </td>
                                            <td className="py-5 px-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-bold text-gray-300">{m["Tipo de reparacion"]}</span>
                                                    <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">{m.Tipo}</span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 max-w-[300px]">
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold text-red-400/80">{m["DEFECTOS A REPARAR"]}</p>
                                                    <p className="text-[10px] text-gray-500 italic line-clamp-2">{m.OBSERVACIONES}</p>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                                        <span className="text-[8px] font-black text-blue-500">{(m.Usuario || 'U').charAt(0)}</span>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-gray-500">{m.Usuario}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {results.length === 0 && !isSearching && (
                                <div className="py-32 text-center space-y-4">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                                        <Info className="w-8 h-8 text-gray-700" />
                                    </div>
                                    <p className="text-gray-500 italic font-medium">Ingresa un código de molde para iniciar la búsqueda de eventos históricos.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Bottom Floating Navigation (Optional but kept for UX) */}
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl z-50">
                <button onClick={() => router.push('/dashboard/molds')} className="flex items-center gap-2 px-6 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest">
                    <Package className="w-4 h-4" /> Edición
                </button>
                <div className="px-6 py-3 bg-white/10 text-white rounded-2xl transition-all font-black text-xs flex items-center gap-2 shadow-lg shadow-white/5 uppercase tracking-widest">
                    <ClipboardList className="w-4 h-4 text-blue-400" /> Trazabilidad
                </div>
                <button onClick={() => router.push('/dashboard/audit')} className="flex items-center gap-2 px-6 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest">
                    <Activity className="w-4 h-4" /> Auditoría
                </button>
            </div>
        </div>
    )
}
