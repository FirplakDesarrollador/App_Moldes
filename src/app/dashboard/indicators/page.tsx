'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, LogOut, Package, ClipboardList, TrendingUp, Settings, Activity, Calendar, Filter, Loader2, Target, CheckCircle2, AlertCircle } from 'lucide-react'
import { indicatorsService, IndicatorData } from '@/services/indicators.service'

export default function IndicatorsPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState<IndicatorData | null>(null)

    // Filters
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(1)).toISOString().split('T')[0], // 1st of current month
        end: new Date().toISOString().split('T')[0]
    })
    const [selectedType, setSelectedType] = useState('')

    useEffect(() => {
        const storedUser = localStorage.getItem('moldapp_user')
        if (!storedUser) {
            router.push('/login')
            return
        }
        setUser(JSON.parse(storedUser))
        loadStats()
    }, [router])

    const loadStats = async () => {
        setLoading(true)
        try {
            const data = await indicatorsService.getIndicatorStats(dateRange, selectedType)
            setStats(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const getGaugeColor = (value: number) => {
        if (value >= 95) return 'text-green-500'
        if (value >= 85) return 'text-yellow-500'
        return 'text-red-500'
    }

    const handleLogout = () => {
        localStorage.removeItem('moldapp_user')
        router.push('/login')
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-medium text-sm">Volver al Panel</span>
                        </button>
                        <div className="h-6 w-[1px] bg-white/10" />
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-green-600/20 flex items-center justify-center border border-green-500/30">
                                <TrendingUp className="w-4 h-4 text-green-400" />
                            </div>
                            <span className="font-black tracking-tighter text-xl text-white">MoldApp <span className="text-green-500">Analytics</span></span>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Filters */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="p-6 glass-card rounded-3xl border border-white/10 space-y-6">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Filter className="w-5 h-5 text-green-500" /> Filtros
                            </h2>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Desde</label>
                                    <input
                                        type="date"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs outline-none focus:ring-2 focus:ring-green-500/50"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Hasta</label>
                                    <input
                                        type="date"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs outline-none focus:ring-2 focus:ring-green-500/50"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tipo</label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs outline-none"
                                        value={selectedType}
                                        onChange={(e) => setSelectedType(e.target.value)}
                                    >
                                        <option value="">Todos los tipos</option>
                                        <option value="Reparación rápida">Reparación rápida</option>
                                        <option value="Reparación especial">Reparación especial</option>
                                        <option value="Molde nuevo">Molde nuevo</option>
                                    </select>
                                </div>
                                <button
                                    onClick={loadStats}
                                    className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-green-600/20 uppercase text-xs tracking-widest"
                                >
                                    Actualizar
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Stats Dashboard */}
                    <div className="lg:col-span-3 space-y-8">
                        {loading ? (
                            <div className="py-40 flex flex-col items-center gap-4">
                                <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
                                <p className="text-gray-500 text-sm animate-pulse">Calculando indicadores...</p>
                            </div>
                        ) : stats && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Service Level Gauge */}
                                    <div className="p-8 glass-card rounded-[2.5rem] border border-white/5 flex flex-col items-center justify-center text-center space-y-6">
                                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-500">Nivel de Servicio</h3>
                                        <div className="relative w-48 h-48 flex items-center justify-center">
                                            <svg className="w-full h-full -rotate-90">
                                                <circle cx="96" cy="96" r="80" className="stroke-white/5 fill-none" strokeWidth="12" />
                                                <circle
                                                    cx="96" cy="96" r="80"
                                                    className={`fill-none transition-all duration-1000 ${getGaugeColor(stats.nivelServicio).replace('text-', 'stroke-')}`}
                                                    strokeWidth="12"
                                                    strokeDasharray={2 * Math.PI * 80}
                                                    strokeDashoffset={2 * Math.PI * 80 * (1 - stats.nivelServicio / 100)}
                                                    strokeLinecap="round"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className={`text-5xl font-black ${getGaugeColor(stats.nivelServicio)}`}>{Math.round(stats.nivelServicio)}%</span>
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Service Level</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 px-4 py-1.5 bg-white/5 rounded-full border border-white/10">
                                            <Target className="w-4 h-4 text-green-500" />
                                            <span className="text-xs font-bold">Meta: 95%</span>
                                        </div>
                                    </div>

                                    {/* Total Counter */}
                                    <div className="p-8 glass-card rounded-[2.5rem] border border-white/5 flex flex-col items-end justify-between text-right">
                                        <div className="w-16 h-16 bg-blue-500/10 rounded-3xl flex items-center justify-center border border-blue-500/20">
                                            <Package className="w-8 h-8 text-blue-400" />
                                        </div>
                                        <div>
                                            <span className="text-6xl font-black block">{stats.totalEntregadas}</span>
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Reparaciones Entregadas</span>
                                            <div className="h-[1px] w-full bg-white/10 my-4" />
                                            <p className="text-[10px] text-gray-400">De un total de {stats.totalComprometidas} moldes comprometidos en el periodo.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Details Table */}
                                <div className="p-8 glass-card rounded-[2.5rem] border border-white/5">
                                    <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                                        <ClipboardList className="w-6 h-6 text-green-500" /> Detalles de Reparación
                                    </h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="border-b border-white/10">
                                                    <th className="py-4 px-2 text-[10px] font-bold text-gray-500 uppercase">Molde</th>
                                                    <th className="py-4 px-2 text-[10px] font-bold text-gray-500 uppercase">Comprometida</th>
                                                    <th className="py-4 px-2 text-[10px] font-bold text-gray-500 uppercase">Estado</th>
                                                    <th className="py-4 px-2 text-[10px] font-bold text-gray-500 uppercase text-right">Cumplimiento</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {stats.detalles.map((m, i) => {
                                                    const isOnTime = m.estado === 'En espera en producción' || m.estado === 'Destruido'
                                                    return (
                                                        <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                                            <td className="py-4 px-2">
                                                                <p className="font-bold text-sm">{m.nombre}</p>
                                                                <p className="text-[10px] font-mono text-gray-500">{m.codigo}</p>
                                                            </td>
                                                            <td className="py-4 px-2 text-xs text-gray-400">{m.fecha_entrega_esperada}</td>
                                                            <td className="py-4 px-2">
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.estado === 'En reparación' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-green-500/10 text-green-500'
                                                                    }`}>
                                                                    {m.estado}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-2 text-right">
                                                                {isOnTime ? <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" /> : <AlertCircle className="w-5 h-5 text-red-500 ml-auto" />}
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>

            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 p-2 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl z-50">
                <button onClick={() => router.push('/dashboard/molds')} className="flex items-center gap-2 px-6 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all font-bold text-xs">
                    <Package className="w-4 h-4" /> Moldes
                </button>
                <button onClick={() => router.push('/dashboard/raw-materials')} className="flex items-center gap-2 px-6 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all font-bold text-xs">
                    <TrendingUp className="w-4 h-4" /> Consumo
                </button>
                <button onClick={() => router.push('/dashboard/history')} className="flex items-center gap-2 px-6 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all font-bold text-xs">
                    <ClipboardList className="w-4 h-4" /> Histórico
                </button>
                <button onClick={() => router.push('/dashboard/audit')} className="flex items-center gap-2 px-6 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all font-bold text-xs">
                    <Activity className="w-4 h-4" /> Auditoría
                </button>
            </div>
        </div>
    )
}
